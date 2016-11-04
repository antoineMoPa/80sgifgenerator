// Fragment shader
precision highp float;

varying vec2 UV;
varying vec3 v_position;
uniform float time;
uniform float ratio;
uniform vec2 mouse;
uniform sampler2D text_tex;

#define PI 3.1416
#define PI2 (3.1416 * 2.0)
#define grid_col vec4(0.8,0.2,0.7,1.0)

void main(void){
    float x = UV.x * ratio;
    float y = UV.y;

    // Background
    vec4 col = vec4(0.02);

    vec2 pos = UV;

    pos.x += 0.03 * cos(PI2 * time + 4.0 * x);
    pos.y += 0.03 * cos(PI2 * time + 4.0 * y);
    
    col += texture2D(text_tex, pos);
    
    col.a = 1.0;
    
    gl_FragColor = col;
}
