/*
  Resources: 
  
  * https://gist.github.com/mbostock/5440492
  * http://memfrag.se/blog/simple-vertex-shader-for-2d
  * https://www.opengl.org/wiki/Data_Type_%28GLSL%29#Vector_constructors
  * https://www.opengl.org/wiki/Built-in_Variable_%28GLSL%29
  * https://www.khronos.org/registry/gles/specs/2.0/GLSL_ES_Specification_1.0.17.pdf

  */

var anim_len = 10;
var anim_delay = 100;
var frame = 0;
var mouse = [0.0, 0.0];
var smooth_mouse = [0.0, 0.0];

// The main canvas
var canvas = qsa(".result-canvas")[0];
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var matches =
    window.location.href.match(
            /\?file\=([a-zA-Z0-9\/]+\.glsl)/
    );

var filename = "";

if(matches != null){
    filename = matches[1] || "";
}

var ratio = canvas.width / window.height;

// Canvas for making gifs
var gif_canvas = qsa(".gif-canvas")[0];
gif_canvas.width = 500;
gif_canvas.height = 500;

var res_ctx = canvas.getContext("webgl");
var gif_ctx = gif_canvas.getContext("webgl");

var fragment_error_pre = qsa(".fragment-error-pre")[0];
var vertex_error_pre = qsa(".vertex-error-pre")[0];

enable_mouse(canvas);
enable_mouse(gif_canvas);

function enable_mouse(can){
    can.hover = false;
    
    mouse = [can.width / 2.0, can.height / 2.0];
    smooth_mouse = [0.5, 0.5];

    can.addEventListener("mouseenter", function(e){
        can.hover = true;
        mouse = [can.width / 2.0, can.height / 2.0];
    });
    
    can.addEventListener("mousemove", setMouse);
    
    function setMouse(e){
        var x, y;
        
        x = e.clientX
            - can.offsetLeft
            - can.offsetParent.offsetLeft
            + window.scrollX;
        y = e.clientY
            - can.offsetTop
            - can.offsetParent.offsetTop
            + window.scrollY;
        
        mouse = [x, y];
    }
    
    can.addEventListener("mouseleave", function(){
        can.hover = false;
        mouse = [can.width / 2.0, can.height / 2.0];
    });
}

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
});

// Fetch file and put it in textarea
if(filename != ""){
    try{
        var xhr = new XMLHttpRequest;
        xhr.open('GET', "./" + filename, true);
        xhr.onreadystatechange = function(){
            if (4 == xhr.readyState) {
                var val = xhr.responseText;
                f_editor.setValue(val);
            }
        };
        xhr.send();
    } catch (e){
        // Do nothing
    }
}

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

function draw_ctx(can, ctx, time){
    // Set time attribute
    var tot_time = anim_len * anim_delay;

    var time = time ||
        parseFloat(
            ((new Date()).getTime() % tot_time)
                /
                tot_time
        );
    
    var timeAttribute = ctx.getUniformLocation(ctx.program, "time");
    ctx.uniform1f(timeAttribute, time);
    
    // Screen ratio
    var ratio = can.width / can.height;

    var ratioAttribute = ctx.getUniformLocation(ctx.program, "ratio");
    ctx.uniform1f(ratioAttribute, ratio);

    // Mouse
    var x = mouse[0] / can.width * ratio;
    var y = - mouse[1] / can.height;
    var mouseAttribute = ctx.getUniformLocation(ctx.program, "mouse");
    ctx.uniform2fv(mouseAttribute, [x, y]);

    // Smooth mouse
    if(can.hover == true){
        smooth_mouse[0] = 0.9 * smooth_mouse[0] + 0.1 * x;
        smooth_mouse[1] = 0.9 * smooth_mouse[1] + 0.1 * y;
    }

    var smAttribute = ctx.getUniformLocation(
        ctx.program, "smooth_mouse"
    );
    
    ctx.uniform2fv(smAttribute, smooth_mouse);
    
    ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4);

    ctx.viewport(0, 0, can.width, can.height);

}

var rendering_gif = false;

function draw(){
    draw_ctx(canvas, res_ctx);

    window.requestAnimationFrame(draw);
}

window.requestAnimationFrame(draw);

setInterval(
    function(){
        frame++;
        frame = frame % (anim_len);
        
        window.requestAnimationFrame(function(){
            // When rendering gif, draw is done elsewhere
            if(!rendering_gif){
                draw_ctx(gif_canvas, gif_ctx, (frame + 1)/(anim_len));
            }
        });
    }
    , anim_delay
);

var gif_button = qsa("button[name='make-gif']")[0];

gif_button.addEventListener("click", make_gif);

// Render all the frames
function make_gif(){
    var to_export = {};
    
    to_export.delay = anim_delay;
    to_export.data = [];
    
    rendering_gif = true;
    
    for(var i = 0; i < anim_len; i++){
        draw_ctx(gif_canvas, gif_ctx, (i + 1)/anim_len);
        
        to_export.data.push(gif_canvas.toDataURL());
    }

    rendering_gif = false;
    
    export_gif(to_export);
}

// Make the gif from the frames
function export_gif(to_export){
    var gif = new GIF({
        workers: 2,
        quality: 10,
        workerScript: "gif-export/lib/gifjs/gif.worker.js"
    });
    
    data = to_export.data;
    
    var images = [];
    
    for(var i = 0; i < data.length; i++){
        var image = new Image();
        image.src = data[i];
        image.onload = imageLoaded;
        images.push(image);
    }
    
    var number_loaded = 0;
    function imageLoaded(){
        number_loaded++;
        if(number_loaded == data.length){
            convert();
        }
    }
    
    function convert(){
        for(var i = 0; i < images.length; i++){    
            gif.addFrame(images[i],{delay: to_export.delay});
        }
        
        gif.render();

        var images_div = qsa(".result-images")[0];
        
        gif.on('finished',function(blob){
            // Create image
            var img = dom("<img>");
            img.src = URL.createObjectURL(blob);

            // Add it to the body
            images_div.insertBefore(img, images_div.firstChild)
        })
    }
}
