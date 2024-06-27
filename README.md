# Style Transfer
An image style transfer website using TensorFlow.js

Based on this project: https://github.com/reiinakano/arbitrary-image-stylization-tfjs

# How to use
Run locally or go to our live website: [Website](https://hexovn-rnd.github.io/museum_2.0/)

Select the camera you want to use, you can reselect anytime by pressing the camera button.

Change some settings if you'd like.

Press anywhere on the screen (except those buttons, duh) to capture an image.

Press Transfer and wait for a few seconds. The style-transfered image will pop up.

If you have an error yelling about device's not compatible, try reducing the size of output/style images in the settings.

# Note

The input and output image dimension might be cropped/altered a bit to fit the algorithm.

You can change the input and output image dimension (Y only, X will try to scale to match aspect ratio),
this will affect how the algorithm "sees" the image and consequentially alter the output image.
