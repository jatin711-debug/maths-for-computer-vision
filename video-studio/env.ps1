# Points the FFrames build and renderer at the FFmpeg 9 shared build and libclang. Dot-source it: . .\env.ps1
$ffmpeg = (Get-ChildItem "$PSScriptRoot\.tools" -Directory -Filter 'ffmpeg-n9*' | Select-Object -First 1).FullName
if (-not $ffmpeg) { throw 'Unzip ffmpeg-n9.0-latest-win64-gpl-shared-9.0 from BtbN/FFmpeg-Builds into video-studio\.tools' }
$env:FFMPEG_DIR = $ffmpeg
if (-not $env:LIBCLANG_PATH) { $env:LIBCLANG_PATH = 'C:\msys64\ucrt64\bin' }
$env:PATH = "$ffmpeg\bin;$env:PATH"
