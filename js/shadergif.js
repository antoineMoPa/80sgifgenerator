/*
  Resources: 
  
  * https://gist.github.com/mbostock/5440492
  * http://memfrag.se/blog/simple-vertex-shader-for-2d
  * https://www.opengl.org/wiki/Data_Type_%28GLSL%29#Vector_constructors
  * https://www.opengl.org/wiki/Built-in_Variable_%28GLSL%29
  * https://www.khronos.org/registry/gles/specs/2.0/GLSL_ES_Specification_1.0.17.pdf
  * http://webglfundamentals.org/webgl/lessons/webgl-text-texture.html
  
  */

var anim_len = 10;
var anim_delay = 100;
var frame = 0;

var text_canvas = qsa(".text-canvas")[0];
var text_ctx = text_canvas.getContext("2d");

var filename = "shaders/fragment.glsl";

var ratio = 1;

var size = 512;

// Canvas for making gifs
var gif_canvas = qsa(".gif-canvas")[0];
gif_canvas.width = size;
gif_canvas.height = size;

text_canvas.width = size;
text_canvas.height = size;

var gif_ctx = gif_canvas.getContext("webgl");

var fragment_error_pre = qsa(".fragment-error-pre")[0];
var vertex_error_pre = qsa(".vertex-error-pre")[0];

// Text texture
var text_tex;

init_ctx(gif_ctx);
init_text_texture(text_canvas, gif_ctx);
                                        
function init_text_texture(text_canvas, gif_ctx){
    var gl = gif_ctx;
    
    text_tex = gl.createTexture();
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); 

    load_text_texture(text_canvas, gl);
    
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);

    gl.bindTexture(gl.TEXTURE_2D, null);
}

function load_text_texture(can, gl){
    gl.bindTexture(gl.TEXTURE_2D, text_tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, can);
}

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
var fragment_code = "";

init_updater(qsa(".settings input"));

var data = {
    text_top : "",
    text_top_size : 0,
    text_middle : "",
    text_middle_size : 0,
    text_bottom : "",
    text_bottom_size : 0
};

window.addEventListener("load", update_text);
update_text();

function init_updater(inputs){
    // Add some event listeners
    for(var i = 0; i < inputs.length; i++){
        input = inputs[i];
        input.addEventListener("change",update_text);
        input.addEventListener("keydown",update_text);
        input.addEventListener("keyup",update_text);
    }
}

function update_text(){
    // Fetch values in inputs
    data.text_top = qsa("input[name=top-text]")[0].value;
    data.text_top_size = qsa("input[name=top-text-size]")[0].value;
    data.text_middle = qsa("input[name=middle-text]")[0].value.toUpperCase();
    data.text_middle_size = qsa("input[name=middle-text-size]")[0].value;
    data.text_bottom = qsa("input[name=bottom-text]")[0].value.toUpperCase();
    data.text_bottom_size = qsa("input[name=bottom-text-size]")[0].value;
    render_text();
}

function render_text(){
    var ctx = text_ctx;

    ctx.clearRect(0,0,size,size);
    
    ctx.textAlign = "center";

    // TOP TEXT
    // Set font size & style
    var tsize = data.text_top_size;

    ctx.fillStyle = "#ff0000";

    ctx.font = tsize +
        "px Kaushan Script";

    // Translate, rotate and render
    ctx.save();
    ctx.translate(250, size*1/6 + tsize/2);
    ctx.rotate(-0.1);
    ctx.fillText(data.text_top, 0, 0);
    ctx.restore();

    // MIDDLE TEXT
    ctx.fillStyle = "#00ff00";
    var tsize = data.text_middle_size;

    ctx.font = tsize +
        "px Monoton";
    
    ctx.fillText(data.text_middle,250,size*1/3 + tsize/2);

    // BOTTOM TEXT
    ctx.fillStyle = "#0000ff";
    var tsize = data.text_bottom_size;
    ctx.font = tsize +
        "px Contrail One";

    ctx.fillText(data.text_bottom,250,size*1/2 + tsize/2);

    // Put it in the opengl texture
    load_text_texture(text_canvas, gif_ctx);
}

// Fetch file and put it in textarea
if(filename != ""){
    try{
        var xhr = new XMLHttpRequest;
        xhr.open('GET', "./" + filename, true);
        xhr.onreadystatechange = function(){
            if (4 == xhr.readyState) {
                var val = xhr.responseText;
                fragment_code = val;
                update_shader();
            }
        };
        xhr.send();
    } catch (e){
        // Do nothing
    }
}

function update_shader(){
    init_program(gif_ctx);
}

function init_program(ctx){
    ctx.program = ctx.createProgram();
        
    var vertex_shader =
        add_shader(ctx.VERTEX_SHADER, vertex_code);
    
    var fragment_shader =
        add_shader(ctx.FRAGMENT_SHADER, fragment_code);
    
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


    var texUniformAttribute =
        ctx.getUniformLocation(ctx.program, "TEXTURE0");
    
    ctx.activeTexture(ctx.TEXTURE0);
    ctx.bindTexture(ctx.TEXTURE_2D, text_tex);
    ctx.uniform1i(texUniformAttribute, 0);
    
    ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, 4);

    ctx.viewport(0, 0, can.width, can.height);

}

var rendering_gif = false;

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
