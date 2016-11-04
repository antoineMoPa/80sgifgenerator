/*
  Resources: 
  
  * https://gist.github.com/mbostock/5440492
  * http://memfrag.se/blog/simple-vertex-shader-for-2d
  * https://www.opengl.org/wiki/Data_Type_%28GLSL%29#Vector_constructors
  * https://www.opengl.org/wiki/Built-in_Variable_%28GLSL%29
  * https://www.khronos.org/registry/gles/specs/2.0/GLSL_ES_Specification_1.0.17.pdf
  * http://webglfundamentals.org/webgl/lessons/webgl-text-texture.html
  
  */

var utils = {};

// Tool to load google webfonts with title
utils.loaded_gfonts = {};
utils.load_gfont = function(name_in){
    // Was font already loaded
    if(typeof utils.loaded_gfonts[name_in] != "undefined"){
	return;
    }

    utils.loaded_gfonts[name_in] = "loading";
    
    // Format name
    var name = name_in.replace(" ","+");
    var url = "https://fonts.googleapis.com/css?family="+name;
    var l = document.createElement("link");

    // Add attributes
    l.setAttribute("rel", "stylesheet");
    l.setAttribute("href", url);

    // Add element to page
    document.head.appendChild(l);
    
    // Set as loaded
    utils.loaded_gfonts[name_in] = "loaded";
}

// Animation parameters
var anim_len = 10;
var anim_delay = 100;
var frame = 0;
var anim_started = false;

// Will contain the current style from the selector
var style = "";

// Canvas for rendering text & other stuff
// (used in a glsl texture)
var text_canvas = qsa(".text-canvas")[0];
var text_ctx = text_canvas.getContext("2d");

var ratio = 1;

var size = 512;

// Canvas for making gifs
var gif_canvas = qsa(".gif-canvas")[0];

// Preview canvas
gif_canvas.width = size;
gif_canvas.height = size;
text_canvas.width = size;
text_canvas.height = size;

var gif_ctx = gif_canvas.getContext("webgl");

// Errror displayx
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

var data = {
    text_top : "",
    text_top_size : 0,
    text_middle : "",
    text_middle_size : 0,
    text_bottom : "",
    text_bottom_size : 0
};

init_updater(qsa(".settings input"));
init_style_updater();
update_style();

window.addEventListener("load", update_settings);
update_settings();

function init_updater(inputs){
    // Add some event listeners
    for(var i = 0; i < inputs.length; i++){
        input = inputs[i];
        input.addEventListener("change",update_settings);
        input.addEventListener("keydown",update_settings);
        input.addEventListener("keyup",update_settings);
    }
}

function update_settings(){
    // Fetch values in inputs
    data.text_top = qsa("input[name=top-text]")[0].value;
    data.text_top_size = qsa("input[name=top-text-size]")[0].value;
    data.text_middle = qsa("input[name=middle-text]")[0].value.toUpperCase();
    data.text_middle_size = qsa("input[name=middle-text-size]")[0].value;
    data.text_bottom = qsa("input[name=bottom-text]")[0].value.toUpperCase();
    data.text_bottom_size = qsa("input[name=bottom-text-size]")[0].value;
    render_text();
}

function init_style_updater(){
    var select = qsa("select[name='style']")[0];

    select.addEventListener("change",update_style);
}

function update_style(){
    var select = qsa("select[name='style']")[0];
    style = select.value;

    // Reset style
    {
	var grayed_els = qsa(".grayed_out");
	for(var i = 0; i < grayed_els.length; i++){
	    grayed_els[i].classList.remove("grayed_out");
	}
    }

    switch(style){
    case "2001":
        load_shader("shaders/2001.glsl");
        break;
    case "youtried":
        load_shader("shaders/youtried.glsl");
	
	// "hide" top and bottom text
	qsa(".top-text")[0].classList.add("grayed_out");
	qsa(".bottom-text")[0].classList.add("grayed_out");
        break;
    default:
        load_shader("shaders/80.glsl");
        break;
    }
    
    render_text();
}


// Render periodically
// in case some font is loaded
// TODO: watch for fonts to be loaded
// (Don't do if it requires a huge library
//  or a ugly hack)
setInterval(render_text, 500);

function render_text(){
    if(style == "youtried"){
        render_youtried();
    } else {
	render_default();
    }
}

function render_default(){
    var ctx = text_ctx;
    
    // Load some fonts
    utils.load_gfont("Kaushan Script");
    utils.load_gfont("Monoton");
    utils.load_gfont("Contrail One");
    
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

function render_youtried(){
    var ctx = text_ctx;

    // Load this font
    utils.load_gfont("The Girl Next Door");
    
    // Fill screen with white
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0,0,size,size);
    
    ctx.save();

    // Star color
    ctx.fillStyle = "#ffdd22";
    ctx.strokeStyle = "#ffffff";

    ctx.translate(size/2,size/2);
    ctx.scale(1,-1);
    ctx.translate(-size/2,-size/2);
    ctx.scale(size/10,size/10);

    // Draw a star
    ctx.beginPath();
    ctx.moveTo(2,6);
    ctx.lineTo(5,6);
    ctx.lineTo(5.5,8);
    ctx.lineTo(6,6);
    ctx.lineTo(8,6);
    ctx.lineTo(6.2,5);
    ctx.lineTo(7.5,2.5);
    ctx.lineTo(5.5,4);
    ctx.lineTo(3,2.5);
    ctx.lineTo(4.5,5);

    ctx.fill();

    ctx.restore();
    
    ctx.textAlign = "center";

    // MIDDLE TEXT
    ctx.fillStyle = "#000000";
    var tsize = data.text_middle_size;

    ctx.font = tsize +
        "px The Girl Next Door";
    
    ctx.fillText(data.text_middle,size/2,size*1/2 + tsize/2.0);

    // Put it in the opengl texture
    load_text_texture(text_canvas, gif_ctx);
}

// Fetch file and put it in textarea
function load_shader(filename){
    if(filename != ""){
        try{
            var xhr = new XMLHttpRequest;
            xhr.open('GET', "./" + filename, true);
            xhr.onreadystatechange = function(){
                if (4 == xhr.readyState) {
                    var val = xhr.responseText;
                    fragment_code = val;
                    update_shader();
                    start_anim();
                }
            };
            xhr.send();
        } catch (e){
            // Do nothing
        }
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

function start_anim(){
    if(anim_started){
        return;
    }

    anim_started = true;
    
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
}
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
