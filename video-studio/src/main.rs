//! Plays one timeline.json through FFrames. Everything about a video lives in that file, which
//! the Python storyboards write, so changing a video never needs a recompile.
//!
//!   $env:CV_VIDEO = "build/lesson-56"; cv-studio render -o build/lesson-56/out.mp4
//!
//! All the FFrames commands work: render, strip, frame, inspect, timeline, audio analyze.
use fframes::{
    AudioMap, AudioTimestamp::*, AudioTrack, CombinedMediaProvider, Duration, EncoderOptions,
    FFramesContext, Frame, MediaDirectory, MediaProvider, RenderOptions, Rotate, Scale, Svgr,
    Transform, Video, cli,
};
use fframes_skia_renderer::{SkiaFFramesRenderer, SkiaPipelineConcurrencyPolicy, SkiaPipelineConfig, vulkan::SkiaVulkanCtx};
use serde::Deserialize;
use std::{path::{Path, PathBuf}, process::ExitCode};

const WIDTH: usize = 1920;
const HEIGHT: usize = 1080;

/// A value that is fixed, or moves through [time, value] keys with straight lines between them.
/// Easing is baked into the keys by the storyboard.
#[derive(Deserialize)]
#[serde(untagged)]
enum Num {
    Fixed(f32),
    Keys(Vec<[f32; 2]>),
}

impl Default for Num {
    fn default() -> Self {
        Num::Fixed(0.)
    }
}

impl Num {
    fn at(&self, t: f32) -> f32 {
        match self {
            Num::Fixed(v) => *v,
            Num::Keys(keys) => {
                let next = keys.partition_point(|k| k[0] <= t);
                if next == 0 {
                    return keys.first().map_or(0., |k| k[1]);
                }
                if next == keys.len() {
                    return keys[next - 1][1];
                }
                let [t0, v0] = keys[next - 1];
                let [t1, v1] = keys[next];
                v0 + (v1 - v0) * (t - t0) / (t1 - t0)
            }
        }
    }
}

/// A colour that is fixed, or fades through [time, "#rrggbb"] keys.
#[derive(Deserialize)]
#[serde(untagged)]
enum Paint {
    Fixed(String),
    Keys(Vec<(f32, String)>),
}

impl Default for Paint {
    fn default() -> Self {
        Paint::Fixed("none".into())
    }
}

fn rgb(hex: &str) -> [f32; 3] {
    let part = |i: usize| u8::from_str_radix(hex.get(i..i + 2).unwrap_or("00"), 16).unwrap_or(0) as f32;
    [part(1), part(3), part(5)]
}

impl Paint {
    fn at(&self, t: f32) -> String {
        match self {
            Paint::Fixed(v) => v.clone(),
            Paint::Keys(keys) => {
                let next = keys.partition_point(|k| k.0 <= t);
                if next == 0 {
                    return keys[0].1.clone();
                }
                if next == keys.len() {
                    return keys[next - 1].1.clone();
                }
                let (t0, a) = &keys[next - 1];
                let (t1, b) = &keys[next];
                let u = (t - t0) / (t1 - t0);
                let (a, b) = (rgb(a), rgb(b));
                let mix = |i: usize| (a[i] + (b[i] - a[i]) * u).round() as u8;
                format!("#{:02x}{:02x}{:02x}", mix(0), mix(1), mix(2))
            }
        }
    }
}

fn one() -> Num {
    Num::Fixed(1.)
}
fn forever() -> f32 {
    f32::INFINITY
}
fn no_dash() -> String {
    "none".into()
}
fn start() -> String {
    "start".into()
}
fn medium() -> u16 {
    500
}

/// One drawn thing. `k` is r(ect), c(ircle), l(ine), p(ath), t(ext), i(mage) or g(roup).
#[derive(Deserialize)]
struct Item {
    k: char,
    /// Only drawn between these two seconds.
    #[serde(default)]
    a: f32,
    #[serde(default = "forever")]
    b: f32,
    #[serde(default = "one")]
    o: Num,
    #[serde(default)]
    x: Num,
    #[serde(default)]
    y: Num,
    #[serde(default)]
    w: Num,
    #[serde(default)]
    h: Num,
    #[serde(default)]
    x2: Num,
    #[serde(default)]
    y2: Num,
    #[serde(default)]
    r: Num,
    #[serde(default)]
    fill: Paint,
    #[serde(default)]
    stroke: Paint,
    #[serde(default)]
    sw: Num,
    #[serde(default = "no_dash")]
    dash: String,
    #[serde(default)]
    off: Num,
    #[serde(default)]
    d: String,
    #[serde(default)]
    s: String,
    #[serde(default)]
    size: f32,
    #[serde(default = "medium")]
    weight: u16,
    #[serde(default = "start")]
    anchor: String,
    #[serde(default = "one")]
    sx: Num,
    #[serde(default = "one")]
    sy: Num,
    #[serde(default)]
    rot: Num,
    #[serde(default)]
    kids: Vec<Item>,
}

impl Item {
    fn draw<'a>(&'a self, t: f32, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        if t < self.a || t > self.b {
            return Svgr::empty();
        }
        let o = self.o.at(t);
        if o <= 0.001 {
            return Svgr::empty();
        }
        let (x, y) = (self.x.at(t), self.y.at(t));
        let (fill, stroke, sw) = (self.fill.at(t), self.stroke.at(t), self.sw.at(t));
        match self.k {
            'r' => {
                let (w, h, r) = (self.w.at(t).max(0.5), self.h.at(t).max(0.5), self.r.at(t));
                fframes::svgr!(<rect x={x} y={y} width={w} height={h} rx={r} fill={fill} stroke={stroke} stroke-width={sw} opacity={o} />)
            }
            'c' => {
                let r = self.r.at(t).max(0.5);
                fframes::svgr!(<circle cx={x} cy={y} r={r} fill={fill} stroke={stroke} stroke-width={sw} opacity={o} />)
            }
            'l' => {
                let (x2, y2) = (self.x2.at(t), self.y2.at(t));
                let off = self.off.at(t);
                fframes::svgr!(<line x1={x} y1={y} x2={x2} y2={y2} stroke={stroke} stroke-width={sw} stroke-linecap="round" stroke-dasharray={self.dash.as_str()} stroke-dashoffset={off} opacity={o} />)
            }
            'p' => {
                let off = self.off.at(t);
                fframes::svgr!(<path d={self.d.as_str()} fill={fill} stroke={stroke} stroke-width={sw} stroke-linecap="round" stroke-linejoin="round" stroke-dasharray={self.dash.as_str()} stroke-dashoffset={off} opacity={o} />)
            }
            't' => {
                fframes::svgr!(<text x={x} y={y} font-family="DM Sans" font-size={self.size} font-weight={self.weight} text-anchor={self.anchor.as_str()} fill={fill} opacity={o}>{self.s.as_str()}</text>)
            }
            'i' => {
                let (w, h) = (self.w.at(t), self.h.at(t));
                let Some(image) = ctx.get_image(self.s.as_str()) else {
                    return Svgr::empty();
                };
                fframes::svgr!(<image href={image.href()} x={x} y={y} width={w} height={h} opacity={o} preserveAspectRatio="none" image-rendering={self.anchor.as_str()} />)
            }
            'g' => {
                let transform = Transform {
                    translate_x: f64::from(x),
                    translate_y: f64::from(y),
                    rotate: Rotate { angle: f64::from(self.rot.at(t)), origin: None },
                    scale: Scale { x: f64::from(self.sx.at(t)), y: f64::from(self.sy.at(t)) },
                    ..Default::default()
                };
                let kids: Vec<Svgr<'a>> = self.kids.iter().map(|kid| kid.draw(t, ctx)).collect();
                fframes::svgr!(<g transform={transform} opacity={o}>{kids}</g>)
            }
            _ => Svgr::empty(),
        }
    }
}

#[derive(Deserialize)]
struct Timeline {
    frames: usize,
    background: String,
    items: Vec<Item>,
}

struct Lesson {
    timeline: Timeline,
}

impl Video for Lesson {
    const FPS: usize = 30;
    const WIDTH: usize = WIDTH;
    const HEIGHT: usize = HEIGHT;

    fn duration(&self) -> Duration<'_> {
        Duration::Frames(self.timeline.frames)
    }

    fn audio(&self) -> AudioMap<'_> {
        AudioMap::from([AudioTrack::new("narration.wav", Second(0.)..Eof).voice()])
    }

    fn render_frame<'a>(&'a self, frame: Frame, ctx: &FFramesContext<'a, '_>) -> Svgr<'a> {
        let t = frame.seconds();
        let items: Vec<Svgr<'a>> = self.timeline.items.iter().map(|item| item.draw(t, ctx)).collect();
        fframes::svgr!(
            <svg xmlns="http://www.w3.org/2000/svg" width={Self::WIDTH} height={Self::HEIGHT}>
                <rect width={Self::WIDTH} height={Self::HEIGHT} fill={self.timeline.background.as_str()} />
                {items}
            </svg>
        )
    }
}

fn main() -> ExitCode {
    let dir = PathBuf::from(std::env::var("CV_VIDEO").expect("Set CV_VIDEO to a build folder"));
    let text = std::fs::read_to_string(dir.join("timeline.json")).expect("timeline.json");
    let timeline: Timeline = serde_json::from_str(&text).expect("a valid timeline");
    let video = Lesson { timeline };

    let fonts_dir = MediaDirectory::read_folder(Path::new(env!("CARGO_MANIFEST_DIR")).join("media").as_path()).expect("fonts");
    let fonts = fonts_dir.process_media_source().expect("fonts");
    let assets_dir = MediaDirectory::read_folder(dir.join("media").as_path()).expect("media");
    let assets = assets_dir.process_media_source().expect("media");
    let media = CombinedMediaProvider::from([&fonts as &dyn MediaProvider, &assets]);

    let gpu = SkiaVulkanCtx::new(WIDTH, HEIGHT).expect("Vulkan GPU");
    cli::new(
        &video,
        RenderOptions {
            media: Some(&media),
            default_font: "DM Sans",
            video_encoder_options: EncoderOptions {
                preferred_encoder: Some("libx264"),
                codec_params: Some(&[("crf", "22"), ("preset", "slow"), ("tune", "animation")]),
                ..Default::default()
            },
            ..Default::default()
        },
    )
    .backend(
        SkiaFFramesRenderer::new_vulkan(
            &gpu,
            SkiaPipelineConfig { concurrency_policy: SkiaPipelineConcurrencyPolicy::MaxPerformance, ..Default::default() },
        )
        .expect("Skia renderer"),
    )
    .run()
}
