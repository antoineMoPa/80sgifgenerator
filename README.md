# 80's animated gif generator

A gif generator coded in javascript & glsl.

The text is created with a hidden `<canvas>` element. It is then stored in a texture and color coded by the text position (top = r / middle = g / bottom=b). This texture is used to create nice text effects. The background is also rendered in the fragment shader where the grid, triangles, stars & vignette effects are created.

![Example](http://67.media.tumblr.com/2a9c4960d1f491d018d76e85e723dd6e/tumblr_ofts9tdjNK1svno9go1_540.gif)

Try it here https://antoinemopa.github.io/80sgifgenerator/

# Want to code things like this?

Start with shadergif http://a-mo-pa.com/stuff/shadergif/
