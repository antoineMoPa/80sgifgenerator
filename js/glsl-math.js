/*
  Resources: 
  
  * https://gist.github.com/mbostock/5440492
  * http://memfrag.se/blog/simple-vertex-shader-for-2d
  * https://www.opengl.org/wiki/Data_Type_%28GLSL%29#Vector_constructors
  * https://www.opengl.org/wiki/Built-in_Variable_%28GLSL%29
  * https://www.khronos.org/registry/gles/specs/2.0/GLSL_ES_Specification_1.0.17.pdf

  */


// The main canvas
var canvas = qsa(".result-canvas")[0];
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Canvas for making gifs
var gif_canvas = qsa(".gif-canvas")[0];
gif_canvas.width = 500;
gif_canvas.height = 500;

var res_ctx = canvas.getContext("webgl");
var gif_ctx = gif_canvas.getContext("webgl");

var fragment_error_pre = qsa(".fragment-error-pre")[0];
var vertex_error_pre = qsa(".vertex-error-pre")[0];

init_ctx(res_ctx);
init_ctx(gif_ctx);

function init_ctx(ctx){
    ctx.clearColor(0.0, 0.0, 0.0, 1.0);
    ctx.enable(ctx.DEPTH_TEST);
    ctx.depthFunc(ctx.LEQUAL);
    ctx.clear(ctx.COLOR_BUFFER_BIT | ctx.DEPTH_BUFFER_BIT);

    // Triangle strip for whole screen square
    var vertices = [
            -1,-1,0,
            -1,1,0,
        1,-1,0,
        1,1,0,
    ];
    
    var tri = ctx.createBuffer();
    ctx.bindBuffer(ctx.ARRAY_BUFFER,tri);
    ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array(vertices), ctx.STATIC_DRAW);
}

var vertex_code = load_script("vertex-shader");
var fragment_code = qsa("textarea[name='fragment']")[0];

// Enable codemirror

var f_editor = CodeMirror.fromTextArea(fragment_code, {
    lineNumbers: true,
    viewportMargin: Infinity
});

f_editor.on("change", update_shader);

update_shader();

function update_shader(){
    init_program(res_ctx);
    init_program(gif_ctx);
}

function init_program(ctx){
    ctx.program = ctx.createProgram();
        
    var vertex_shader =
        add_shader(ctx.VERTEX_SHADER, vertex_code);
    
    var fragment_shader =
        add_shader(ctx.FRAGMENT_SHADER, f_editor.getValue());
    
    function add_shader(type,content){
        var shader = ctx.createShader(type);
        ctx.shaderSource(shader,content);
        ctx.compileShader(shader);

        // Find out right error pre
        var type_pre = type == ctx.VERTEX_SHADER ?
            vertex_error_pre:
            fragment_error_pre;
        
        if(!ctx.getShaderParameter(shader, ctx.COMPILE_STATUS)){
            var err = ctx.getShaderInfoLog(shader);

            // Find shader type
            var type_str = type == ctx.VERTEX_SHADER ?
                "vertex":
                "fragment";
            
            type_pre.textContent =
                "Error in " + type_str + " shader.\n" +
                err;
        } else {
            type_pre.textContent = "";
        }
        
        ctx.attachShader(ctx.program, shader);
        return shader;
    }
    
    ctx.linkProgram(ctx.program);
    
    if(!ctx.getProgramParameter(ctx.program, ctx.LINK_STATUS)){
        console.log(ctx.getProgramInfoLog(ctx.program));
    }
    
    ctx.useProgram(ctx.program);

    var positionAttribute = ctx.getAttribLocation(ctx.program, "position");
    
    ctx.enableVertexAttribArray(positionAttribute);
    ctx.vertexAttribPointer(positionAttribute, 3, ctx.FLOAT, false, 0, 0);
    
}

function draw_ctx(can, ctx){
    var timeAttribute = ctx.getUniformLocation(ctx.program, "time");
    ctx.uniform1f(timeAttribute, parseFloat((new Date()).getTime() % 10000));
    
    ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4);

    ctx.viewport(0, 0, can.width, can.height);
}

function draw(){
    draw_ctx(canvas, res_ctx);
    draw_ctx(gif_canvas, gif_ctx);
    
    window.requestAnimationFrame(draw);
}

window.requestAnimationFrame(draw);
