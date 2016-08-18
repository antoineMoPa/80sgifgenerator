/*
  Resources: 
  
  * https://gist.github.com/mbostock/5440492
  * http://memfrag.se/blog/simple-vertex-shader-for-2d
  * https://www.opengl.org/wiki/Data_Type_%28GLSL%29#Vector_constructors
  * https://www.opengl.org/wiki/Built-in_Variable_%28GLSL%29
  * https://www.khronos.org/registry/gles/specs/2.0/GLSL_ES_Specification_1.0.17.pdf

  */



var canvas = qsa(".result-canvas")[0];
canvas.height = window.innerHeight;
canvas.width = window.innerWidth;


var ctx = canvas.getContext("webgl");

var fragment_error_pre = qsa(".fragment-error-pre")[0];
var vertex_error_pre = qsa(".vertex-error-pre")[0];

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

var vertex_code = qsa("textarea[name='vertex']")[0];
var fragment_code = qsa("textarea[name='fragment']")[0];

// Enable codemirror

var v_editor = CodeMirror.fromTextArea(vertex_code, {
    lineNumbers: true
});

var f_editor = CodeMirror.fromTextArea(fragment_code, {
    lineNumbers: true
});

v_editor.on("change", init_program);
f_editor.on("change", init_program);

init_program();

var program;

function init_program(){
    program = ctx.createProgram();
        
    var vertex_shader =
        add_shader(ctx.VERTEX_SHADER, v_editor.getValue());
    
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
        
        ctx.attachShader(program, shader);
        return shader;
    }
    
    ctx.linkProgram(program);
    
    if(!ctx.getProgramParameter(program, ctx.LINK_STATUS)){
        console.log(ctx.getProgramInfoLog(program));
    }
    
    ctx.useProgram(program);

    var positionAttribute = ctx.getAttribLocation(program, "position");
    
    ctx.enableVertexAttribArray(positionAttribute);
    ctx.vertexAttribPointer(positionAttribute, 3, ctx.FLOAT, false, 0, 0);

    draw();
}
    
function draw(){
    var timeAttribute = ctx.getUniformLocation(program, "time");
    ctx.uniform1f(timeAttribute, parseFloat((new Date()).getTime() % 10000));
    
    ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4);

    ctx.viewport(0, 0, canvas.width, canvas.height);

    window.requestAnimationFrame(draw);
}

window.requestAnimationFrame(draw);
