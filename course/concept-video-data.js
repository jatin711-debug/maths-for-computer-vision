// Generated from concept-studio/storyboard.json by prepare_assets.py.
window.CV_CONCEPT_VIDEO_DATA = [
  {
    "id": "fframes-pixels",
    "key": "pixels",
    "title": "Images are arrays",
    "module": 1,
    "lesson": 1,
    "experiment": "pixels",
    "duration": 40.53333333333333,
    "src": "media/fframes/pixels.mp4?v=b4181b307652",
    "poster": "media/fframes/pixels.png?v=b4181b307652",
    "captions": "media/fframes/pixels.vtt?v=b4181b307652",
    "chapters": [
      {
        "label": "See the image",
        "name": "SeeTheImage",
        "time": 0.0,
        "end": 6.5,
        "frames": 195,
        "narration": "An image is a grid of numbers. Here, zero means black, and two hundred and fifty five means white."
      },
      {
        "label": "Keep the shape",
        "name": "KeepTheShape",
        "time": 6.5,
        "end": 11.533333333333333,
        "frames": 151,
        "narration": "Keep the rows and columns in order. This image has two rows and two columns."
      },
      {
        "label": "Scale each pixel",
        "name": "ScaleEachPixel",
        "time": 11.533333333333333,
        "end": 17.2,
        "frames": 170,
        "narration": "Multiply each pixel by one half. Every number halves, so the image becomes darker."
      },
      {
        "label": "Add an offset",
        "name": "AddAnOffset",
        "time": 17.2,
        "end": 22.3,
        "frames": 153,
        "narration": "Now add ten to every pixel. This brightens the output without changing its shape."
      },
      {
        "label": "Predict the mean",
        "name": "PredictTheMean",
        "time": 22.3,
        "end": 28.933333333333334,
        "frames": 199,
        "narration": "Predict the new mean. Add the four output values and divide by four. Pause here to work it out."
      },
      {
        "label": "Check the mean",
        "name": "CheckTheMean",
        "time": 28.933333333333334,
        "end": 33.56666666666667,
        "frames": 139,
        "narration": "The values sum to two hundred. Divide by four: the new mean is fifty."
      },
      {
        "label": "Connect the rule",
        "name": "ConnectTheRule",
        "time": 33.56666666666667,
        "end": 40.53333333333333,
        "frames": 209,
        "narration": "The original mean was eighty. Halving it and adding ten gives fifty. This same rule acts on every pixel."
      }
    ]
  },
  {
    "id": "fframes-projection",
    "key": "projection",
    "title": "Projection keeps a direction",
    "module": 2,
    "lesson": 6,
    "experiment": "vectors",
    "duration": 49.86666666666667,
    "src": "media/fframes/projection.mp4?v=2d55e58b75f4",
    "poster": "media/fframes/projection.png?v=2d55e58b75f4",
    "captions": "media/fframes/projection.vtt?v=2d55e58b75f4",
    "chapters": [
      {
        "label": "Start with a vector",
        "name": "StartWithAVector",
        "time": 0.0,
        "end": 6.0,
        "frames": 180,
        "narration": "Our vector moves three units right and four units up. We want the part pointing along the diagonal."
      },
      {
        "label": "Choose a direction",
        "name": "ChooseADirection",
        "time": 6.0,
        "end": 13.066666666666666,
        "frames": 212,
        "narration": "Choose a unit vector along the diagonal. Its length is one, so a dot product measures distance along it."
      },
      {
        "label": "Measure the component",
        "name": "MeasureTheComponent",
        "time": 13.066666666666666,
        "end": 18.4,
        "frames": 160,
        "narration": "The dot product is seven divided by the square root of two, about four point nine five."
      },
      {
        "label": "Build the projection",
        "name": "BuildTheProjection",
        "time": 18.4,
        "end": 25.133333333333333,
        "frames": 202,
        "narration": "Multiply this distance by the unit direction. The projection ends at three point five, three point five."
      },
      {
        "label": "Predict the residual",
        "name": "PredictTheResidual",
        "time": 25.133333333333333,
        "end": 33.266666666666666,
        "frames": 244,
        "narration": "The projection misses the original tip. What vector joins them? Predict its coordinates, then pause before the answer."
      },
      {
        "label": "Find the residual",
        "name": "FindTheResidual",
        "time": 33.266666666666666,
        "end": 41.4,
        "frames": 244,
        "narration": "Subtract the projection from the original vector. The residual is minus one half, one half, perpendicular to the diagonal."
      },
      {
        "label": "Rebuild the vector",
        "name": "RebuildTheVector",
        "time": 41.4,
        "end": 49.86666666666667,
        "frames": 254,
        "narration": "Projection plus residual rebuilds the original vector. One part follows the chosen direction; the other is perpendicular."
      }
    ]
  },
  {
    "id": "fframes-descent",
    "key": "descent",
    "title": "Gradient descent follows slope",
    "module": 8,
    "lesson": 29,
    "experiment": "optimization",
    "duration": 50.7,
    "src": "media/fframes/descent.mp4?v=b876176d7479",
    "poster": "media/fframes/descent.png?v=b876176d7479",
    "captions": "media/fframes/descent.vtt?v=b876176d7479",
    "chapters": [
      {
        "label": "Read the loss",
        "name": "ReadTheLoss",
        "time": 0.0,
        "end": 6.433333333333334,
        "frames": 193,
        "narration": "This curve shows loss as the weight changes. Start at zero, with loss nine. The minimum is at three."
      },
      {
        "label": "Find the slope",
        "name": "FindTheSlope",
        "time": 6.433333333333334,
        "end": 13.966666666666667,
        "frames": 226,
        "narration": "The gradient is twice the difference between the weight and three. At zero it is minus six. The curve slopes down to the right."
      },
      {
        "label": "Predict the direction",
        "name": "PredictTheDirection",
        "time": 13.966666666666667,
        "end": 21.833333333333332,
        "frames": 236,
        "narration": "We subtract the gradient times a learning rate. With a negative gradient, should the weight move left or right? Pause here."
      },
      {
        "label": "Take one step",
        "name": "TakeOneStep",
        "time": 21.833333333333332,
        "end": 29.766666666666666,
        "frames": 238,
        "narration": "Use learning rate zero point two. Subtracting a negative moves right to one point two. Loss falls to three point two four."
      },
      {
        "label": "Recompute the gradient",
        "name": "RecomputeTheGradient",
        "time": 29.766666666666666,
        "end": 35.9,
        "frames": 184,
        "narration": "Recompute the slope at the new weight: minus three point six. The next weight is one point nine two."
      },
      {
        "label": "Repeat and compare",
        "name": "RepeatAndCompare",
        "time": 35.9,
        "end": 42.2,
        "frames": 189,
        "narration": "A third update reaches two point three five two. The steps shrink as the weight approaches the minimum."
      },
      {
        "label": "Choose the step size",
        "name": "ChooseTheStepSize",
        "time": 42.2,
        "end": 50.7,
        "frames": 255,
        "narration": "Step size matters. A learning rate of one point two jumps past the minimum and increases the loss to seventeen point six four."
      }
    ]
  }
];
