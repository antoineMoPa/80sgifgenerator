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

vec4 lines(vec2 pos){
    vec4 col = vec4(0.0);

    float size = 80.0;
    
    if(cos(size * pos.x) > 0.95){
        col = grid_col;
        col.rgb *= cos(size * 4.0 * pos.x);
    }
    
    return col;
}

vec4 grid(vec2 pos){
    vec4 col = vec4(0.0);
    
    col += lines(pos);
    col += lines(vec2(pos.y,pos.x));
    
    return col;
}

vec4 grid_with_angle(vec2 pos, float t){
    vec4 col = vec4(0.0);

    float line_y = 0.33;
    
    float intensity = 0.8 + 0.2 * cos(PI2 * time) * cos(20.0 * pos.y);
    
    if(pos.y > 0.6){
        return col;
    }
    
    // The line at the middle of the screen
    if(pos.y > line_y - 0.05){
        float fac = 1.0 - pow((pos.y - line_y + 0.005)/0.025, 2.0);

        fac *= 0.8;
        
        if(fac > 0.0){
            fac = 0.5 * fac + 6.0 * pow(fac, 8.0);
            col = 0.8 * grid_col * fac;
        }
    }

    // The grid
    if(pos.y < line_y){
        pos.x -= 0.5;
        pos.x *= pos.y + 0.5;
        pos.y += t/16.0;
        
        col += grid(pos) * intensity;
    }
    
    return col;
}

vec4 stars(vec2 pos, float t){
    vec4 col = vec4(0.0);
    
    float fac = sin(-2.0 * (cos(143.0 * pos.x) + sin(20.0 * pos.y)));
    fac *= sin(-2.0 * (cos(43.4 * pos.x) + sin(132.0 * pos.y)));
    fac *= sin(-2.0 * (tan(23.4 * pos.x) + sin(12.0 * pos.y)));
    fac *= sin(-2.0 * (cos(3.2 * pos.x + 0.2 * cos(PI2 * time)) + sin(22.0 * pos.y)));
    fac *= cos(50.0 * pos.x + 70.0 * pos.y);
    fac = pow(fac,4.0);
    
    float fac2 = abs(pow(fac, 2.0) + 0.1);
    
    col += fac2 * vec4(1.0);
    
    
    return col;
}

vec4 line(vec2 pos, vec2 pt1, vec2 pt2, float width, float t){
    vec4 col = vec4(0.0);
    
    width /= 2.0;
    
    vec2 ab = pt2 - pt1;
    vec2 ac = pos - pt1;
    
    vec2 perp = vec2(-ab.y, ab.x);
    float dotp = dot(perp,ac);
    float dotab = dot(ac,ab)/length(ab);
    
    if(dotp < width && dotp > -width){
        if(dotab > 0.0 && dotab < length(ab)){
            float timefac = abs(0.2 * cos(PI * time + 4.0 * dotab));
            col +=
                grid_col * (1.0 - pow(dotp/width,2.0)) * timefac;
        }
    }
    
    return col;
}

vec4 triangle(vec2 pos, float t){
    vec4 col = vec4(0.0);
    
    pos.x += 0.01 * cos(PI2 * time);
    
    pos.y = 1.0 - pos.y;
    
    col += line(pos, vec2(0.2,0.3), vec2(0.5,0.8), 0.01, t);
    col += line(pos, vec2(0.5,0.8), vec2(0.8,0.3), 0.01, t);
    col += line(pos, vec2(0.8,0.3), vec2(0.2,0.3), 0.01, t);
    
    return col;
}

vec4 triangles(vec2 pos, float t){
    vec4 col = vec4(0.0);

    float scale = 0.7;
    // Scale text
    pos.x -= 0.5;
    pos.y -= 0.5;
    pos *= 1.0/scale;
    pos.x += 0.5;
    pos.y += 0.5;

    pos.y -= 0.3;
    
    col += triangle(pos, t);
    pos.x *= (1.0 + 0.01 * cos(PI2 * time));
    pos.y *= (1.0 + 0.01 * cos(PI2 * time + 3.0 * pos.x));
    col += triangle(1.3 * pos + vec2(-0.2, -0.2) * pos.x, t);
    col += triangle(1.1 * pos + vec2(-0.03, -0.1)* pos.x, t);
    
    return col;
}


void main(void){
    float x = UV.x * ratio;
    float y = UV.y;
    
    vec4 col = vec4(0.0);
    
    col += stars(vec2(x,y), time);
    col += 0.9 * grid_with_angle(vec2(x,y), time);
    col += triangles(vec2(x,y),time);

    col += texture2D(text_tex, vec2(x, y));
    
    col.a = 1.0;
    
    gl_FragColor = col;
}
