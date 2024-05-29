// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
    `precision mediump float;
    attribute vec4 a_Position;
    attribute vec2 a_UV;
    attribute vec3 a_Normal;
    varying vec2 v_UV;
    varying vec3 v_Normal;
    varying vec4 v_VertPos;
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_GlobalRotateMatrix;
    uniform mat4 u_ViewMatrix;
    uniform mat4 u_ProjectionMatrix;
    void main() {
      gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
      v_UV = a_UV;
      v_Normal = a_Normal;
      v_VertPos = u_ModelMatrix * a_Position;
    }`

// Fragment shader program
var FSHADER_SOURCE =
    `precision mediump float;
     varying vec2 v_UV;
     varying vec3 v_Normal;
     uniform vec4 u_FragColor;
     uniform sampler2D u_Sampler0;
     uniform sampler2D u_Sampler1;
     uniform sampler2D u_Sampler2;
     uniform int u_whichTexture;
     uniform vec3 u_cameraPos;
     uniform vec3 u_lightColor;
     uniform vec3 u_lightPos;
     uniform vec3 u_spotLightPos;
     varying vec4 v_VertPos;
     uniform bool u_lightOn;
     void main() {
       if(u_whichTexture == -3) { 
         gl_FragColor = vec4((v_Normal+1.0) / 2.0,1.0); // Use color
       } else if (u_whichTexture == -2) { 
         gl_FragColor = u_FragColor; // Use color
       } else if (u_whichTexture == -1) { 
         gl_FragColor = vec4(v_UV,1.0,1.0); // Use UV debug color
       } else if (u_whichTexture == 0) { 
         gl_FragColor = texture2D(u_Sampler0,v_UV); // Use Texture0
       } else if (u_whichTexture == 1) { 
         gl_FragColor = texture2D(u_Sampler1,v_UV); // Use Texture1
       } else if (u_whichTexture == 2) { 
         gl_FragColor = texture2D(u_Sampler2,v_UV); // Use Texture1
       } else { 
         gl_FragColor = vec4(1,0.2,0.2,1);  // Error, put redish
       } 

       vec3 lightVector = u_lightPos - vec3(v_VertPos);
       float r = length(lightVector);

       vec3 spotVector = u_spotLightPos - vec3(v_VertPos);
       float r_spot = length(spotVector);

       // N dot L
       vec3 L = normalize(lightVector);
       vec3 N = normalize(v_Normal);
       float nDotL = max(dot(N,L),0.0);

       // Reflection
       vec3 R = reflect(-L,N);

       // Eye
       vec3 E = normalize(u_cameraPos-vec3(v_VertPos));

       // Specular
       float specular = pow(max(dot(E,R),0.0),64.0) * 0.8;

       vec3 diffuse = u_lightColor * vec3(gl_FragColor) * nDotL * 0.7;
       vec3 ambient = vec3(gl_FragColor) * 0.2;

       if(u_lightOn){
        if(r_spot < 2.0){
            gl_FragColor = vec4(vec3(gl_FragColor)*0.7 + specular + diffuse + ambient,1);
        }else if(u_whichTexture == -2 || u_whichTexture == -3){
            gl_FragColor = vec4(specular + diffuse + ambient,1.0);
        }else{
            gl_FragColor = vec4(diffuse + ambient,1.0);
        }
       }
    }`

// Globals
let canvas;
let gl;
let a_Position;
let a_UV;
let a_Normal;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_GlobalRotateMatrix;
let u_Sampler0;
let u_Sampler1;
let u_Sampler2;
let u_lightPos;
let u_whichTexture;
let u_ProjectionMatrix;
let u_ViewMatrix;
let global_camera;
let u_cameraPos;
let u_lightOn;
let u_lightColor;
let u_spotLightPos;

const map = [
    // First row with all 4s
        [1, 1, 1, 1, 1, 1, 1, 1,1 , 1,1, 1, 4, 1, 1, 4, 4, 1, 4, 1, 4, 1, 4, 1, 4, 1, 4, 1, 1, 4],
        
    
        // Remaining rows with border 4s and inner 0s
        ...Array(13).fill().map(() => [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]),
    
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 3, 3, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 3, 5, 4, 4, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    
         // Remaining rows with border 4s and inner 0s
         ...Array(13).fill().map(() => [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]),
    
        // Last row with all 4s
        [1, 1, 1, 1, 1, 1, 1, 1,1 , 1,1, 1, 1, 1, 1, 1, 4, 1, 1, 1, 4, 1, 1, 1, 4, 1, 4, 1, 1, 4]
    
      ];
    
function drawMap(){

// Draw out 4 chunks!
    for(x=0;x<32;x++){
        for(y=0;y<32;y++){
            if(map[x][y]>= 1){
                for(z=0;z<map[x][y];z++){
                    var body = new Cube();
                    body.color = [1,1,1,1];
                    if(g_normalOn){ body.textureNum = -3}else{body.textureNum = 2};
                    body.matrix.translate(x-16,-0.75 + z,y-16);
                    body.render();
                }
            }
        }
    }

}


function setupWebGl() {
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    //gl = getWebGLContext(canvas);
    gl = canvas.getContext("webgl", { preserveDrawingBuffer: true })
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    gl.enable(gl.DEPTH_TEST);
}

function setupGLSL() {
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // // Get the storage location of a_Position
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }

    a_UV = gl.getAttribLocation(gl.program, 'a_UV');
    if (a_UV < 0) {
        console.log('Failed to get the storage location of a_UV');
        return;
    }

    a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
    if (a_Normal < 0) {
        console.log('Failed to get the storage location of a_Normal');
        return;
    }

    // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }

    u_lightOn = gl.getUniformLocation(gl.program, 'u_lightOn');
    if (!u_lightOn) {
        console.log('Failed to get the storage location of u_lightOn');
        return;
    }
 

    u_lightColor = gl.getUniformLocation(gl.program, 'u_lightColor');
    if (!u_lightColor) {
        console.log('Failed to get the storage location of u_lightColor');
        return;
    }

    // Get the storage location of u_whichTexture
    u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
    if (!u_whichTexture) {
        console.log('Failed to get the storage location of u_whichTexture');
        return;
    }

    // Connect up u_ModelMatrix variable
    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
        console.log('Failed to get the storage location of u_ModelMatrix');
        return;
    }

    // Connect up   u_lightPos variable
    u_lightPos = gl.getUniformLocation(gl.program, 'u_lightPos');
    if (!u_lightPos) {
        console.log('Failed to get the storage location of u_lightPos');
        return;
    }

    // Connect up u_cameraPos variable
    u_cameraPos = gl.getUniformLocation(gl.program, 'u_cameraPos');
    if (!u_cameraPos) {
        console.log('Failed to get the storage location of u_cameraPos');
        return;
    }
    
    // Connect up   u_lightPos variable
    u_spotLightPos = gl.getUniformLocation(gl.program, 'u_spotLightPos');
    if (!u_spotLightPos) {
        console.log('Failed to get the storage location of u_spotLightPos');
        return;
    }

    // Connect up u_Sampler0 variable
    u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
    if (!u_Sampler0) {
        console.log('Failed to get the storage location of u_Sampler0');
        return;
    }

     // Connect up u_Sampler1 variable
     u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
     if (!u_Sampler1) {
         console.log('Failed to get the storage location of u_Sampler1');
         return;
     }

     
     u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
     if (!u_Sampler2) {
         console.log('Failed to get the storage location of u_Sampler2');
         return;
     }
    
    // Connect up u_ProjectionMatrix variable
    u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
    if (!u_ProjectionMatrix) {
        console.log('Failed to get the storage location of u_ProjectionMatrix');
        return;
    }

    // Connect up u_ViewMatrix variable
    u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    if (!u_ViewMatrix) {
        console.log('Failed to get the storage location of u_ViewMatrix');
        return;
    }

    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    if (!u_GlobalRotateMatrix) {
        console.log('Failed to get the storage location of u_GlobalRotateMatrix');
        return;
    }

    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

// Globals for HTML UI
let g_main_rotation_x = 0;
let g_main_rotation_y = 0;
let g_normalOn = false;
let g_lightPos =[0,5,2];
let g_spotLightPos = [1,4,2];
let g_lightColor =[0.2,0.7,0.2];
let g_lightOn = true;

function addActionsForHTMLUI(){
    document.getElementById('normalOn').onclick = function(){g_normalOn = true;};
    document.getElementById('normalOff').onclick = function(){g_normalOn = false;};
    document.getElementById('lightToggle').onclick = function(){g_lightOn = !g_lightOn;};

    document.getElementById('lightSlideX').addEventListener('mousemove', function(ev){if(ev.buttons == 1){g_lightPos[0] = this.value / 100; renderAllShapes();}});
    document.getElementById('lightSlideY').addEventListener('mousemove', function(ev){if(ev.buttons == 1){g_lightPos[1] = this.value / 100; renderAllShapes();}});
    document.getElementById('lightSlideZ').addEventListener('mousemove', function(ev){if(ev.buttons == 1){g_lightPos[2] = this.value / 100; renderAllShapes();}});

    document.getElementById('lightSliderR').addEventListener('mousemove', function(ev){if(ev.buttons == 1){g_lightColor[0] = this.value / 100; renderAllShapes();}});
    document.getElementById('lightSliderG').addEventListener('mousemove', function(ev){if(ev.buttons == 1){g_lightColor[1] = this.value / 100; renderAllShapes();}});
    document.getElementById('lightSliderB').addEventListener('mousemove', function(ev){if(ev.buttons == 1){g_lightColor[2] = this.value / 100; renderAllShapes();}});
}

function main() {

    setupWebGl();
    setupGLSL();

    addActionsForHTMLUI();
    // Setup actions for HTML elements

    global_camera = new Camera();
    document.onkeydown = keydown;

    document.addEventListener("mousemove", function(event) {
        if(g_lockCamera== false){
            global_camera.panHorizontal(-1 * event.movementX);
            global_camera.panVertical(-1 *event.movementY );
        }
    });

    initTextures(gl,0);

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    renderAllShapes();

    requestAnimationFrame(tick);
}

var g_startTime = performance.now() / 1000.0;
var g_seconds = performance.now() / 1000.0 - g_startTime;

function tick() {

    g_seconds = performance.now() / 1000.0 - g_startTime;
    //console.log(g_seconds);

    g_lightPos[1] = Math.cos(g_seconds) * 2 + 2;

    renderAllShapes();

    requestAnimationFrame(tick);
}

function initTextures(){

    let image = new Image(); // Create an image object
    let scary_image = new Image();
    let ice = new Image();

    // Pass image to GPU once image loaded
    image.onload = function () { sendTextureToGLSL(image); };
    image.src = './img/sky.jpg';

    scary_image.onload = function () { sendTextureToGLSL2(scary_image); };
    scary_image.src = './img/enemy.png';

    ice.onload = function () { sendTextureToGLSL3(ice); };
    ice.src = './img/ice.jpg';

    // Add more textures here!

    return true;
}

// Would need to make new version for each texture or make edits to some things!
function sendTextureToGLSL(imageA) {

    var textureA = gl.createTexture(); // Create a texture object

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis

    // Enable the texture unit 0
    gl.activeTexture(gl.TEXTURE0);

    // Bind the texture object to the target
    gl.bindTexture(gl.TEXTURE_2D, textureA);

    // Set the texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    
    // Set the texture image
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, imageA);

    // Set the texture unit 0 to the sampler
    gl.uniform1i(u_Sampler0, 0);
}

// Would need to make new version for each texture or make edits to some things!
function sendTextureToGLSL2(imageB) {

    var textureB = gl.createTexture(); // Create a texture object

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis

    // Enable the texture unit 1
    gl.activeTexture(gl.TEXTURE1);

    // Bind the texture object to the target
    gl.bindTexture(gl.TEXTURE_2D, textureB);

    // Set the texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    
    // Set the texture image
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, imageB);

    // Set the texture unit 0 to the sampler
    gl.uniform1i(u_Sampler1, 1);
}


// Would need to make new version for each texture or make edits to some things!
function sendTextureToGLSL3(imageC) {

    var textureC = gl.createTexture(); // Create a texture object

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis

    // Enable the texture unit 1
    gl.activeTexture(gl.TEXTURE2);

    // Bind the texture object to the target
    gl.bindTexture(gl.TEXTURE_2D, textureC);

    // Set the texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    
    // Set the texture image
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, imageC);

    // Set the texture unit 0 to the sampler
    gl.uniform1i(u_Sampler2, 2);
}

let g_lockCamera = true;

function keydown(ev){

    switch(ev.keyCode){
        case 87: global_camera.moveForward(); break;
        case 65: global_camera.moveLeft(); break;
        case 68: global_camera.moveRight(); break;
        case 83: global_camera.moveBackwards(); break;
        case 81: global_camera.panHorizontal(1); break;
        case 69: global_camera.panHorizontal(-1); break;
        case 32: g_lockCamera = !g_lockCamera; break;
    }

    if(ev.keyCode == 39){ // Right arrow
        global_camera.panHorizontal(-1);
    }else if(ev.keyCode == 37){ // Left arrow
        global_camera.panHorizontal(1);
    }

    renderAllShapes();
}


function renderAllShapes() {

    var startTime = performance.now();

    var viewMatrix = new Matrix4();
    viewMatrix.setLookAt(global_camera.eye.elements[0],global_camera.eye.elements[1],global_camera.eye.elements[2], 
        global_camera.at.elements[0],global_camera.at.elements[1],global_camera.at.elements[2], 
        global_camera.up.elements[0],global_camera.up.elements[1],global_camera.up.elements[2]);

    var projectionMatrix = new Matrix4();
    projectionMatrix.setPerspective(global_camera.fov,canvas.width/canvas.height,0.1,100);

    gl.uniformMatrix4fv(u_ProjectionMatrix,false,projectionMatrix.elements);

    gl.uniformMatrix4fv(u_ViewMatrix,false,viewMatrix.elements);

    gl.uniform3f(u_lightPos,g_lightPos[0],g_lightPos[1],g_lightPos[2]);

    gl.uniform3f(u_spotLightPos,g_spotLightPos[0],g_spotLightPos[0],g_spotLightPos[0]);
 
    gl.uniform3f(u_lightColor,g_lightColor[0],g_lightColor[1],g_lightColor[2]);

    gl.uniform3f(u_cameraPos,global_camera.eye.elements[0],global_camera.eye.elements[1],global_camera.eye.elements[2]);

     gl.uniform1i(u_lightOn,g_lightOn);
    
    var globalRotMat = new Matrix4().rotate(g_main_rotation_x, 0, 1, 0);
    globalRotMat.rotate(g_main_rotation_y,1,0,0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clear(gl.COLOR_BUFFER_BIT);
    

    var light = new Cube();
    light.color = [2,2,0,1];
    light.textureNum =-1 ;
    light.matrix.translate(g_lightPos[0],g_lightPos[1],g_lightPos[2]);
    light.matrix.scale(-0.1,-0.1,-0.1);
    light.matrix.translate(-0.5,-0.5,-0.5);
    light.render();

    
    var spotLight = new Cube();
    spotLight.color = [2,2,0,1];
    spotLight.textureNum =-1 ;
    spotLight.matrix.translate(g_spotLightPos[0],g_spotLightPos[1],g_spotLightPos[2]);
    spotLight.matrix.scale(-0.1,-0.1,-0.1);
    spotLight.matrix.translate(-0.5,-0.5,-0.5);
    spotLight.render();

    var body = new Cube();
    body.color = [1, 1, 1, 1];
    if(g_normalOn) body.textureNum = -3;
    body.matrix.scale(0.5, 0.4, 0.5);
    body.matrix.translate(-0.5, -0.5, -0.5);
    body.render();

    var scary_cube = new Cube();
    scary_cube.color = [1, 1, 1, 1];
    if(g_normalOn) scary_cube.textureNum = -3;
    scary_cube.matrix.scale(0.5, 0.4, 0.5);
    scary_cube.matrix.translate(1, -0.5, -0.5);
    scary_cube.render();

    var scary_cube = new Cube();
    scary_cube.color = [1, 1, 1, 1];
    if(g_normalOn) scary_cube.textureNum = -3;
    scary_cube.matrix.scale(0.5, 0.4, 0.5);
    scary_cube.matrix.translate(14, -0.5, -0.5);
    scary_cube.render();

    var ground = new Cube();
    ground.color = [1, 1, 0, 1];
    if(g_normalOn){ ground.textureNum = -3}else{ground.textureNum = -3};
    ground.matrix.scale(16,1, 16);
    ground.matrix.translate(-0.5, -1.25, -0.5);
    ground.render();

    var sky = new Cube();
    sky.color = [1, 1, 1, 1];
    if(g_normalOn) {sky.textureNum = -3}else{sky.textureNum = 0};
    sky.matrix.scale(-50, -50, -50);
    sky.matrix.translate(-0.5, -0.5, -0.5);
    sky.render();

    var sphere = new Sphere();
    sphere.color = [1, 1, 1, 1];
    sphere.matrix.translate(0,5,0);
    if(g_normalOn) {sphere.textureNum = -3}else{sphere.textureNum = -3};
    sphere.render();

    var duration = performance.now() - startTime;
    sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(10000 / duration) / 10, "numdot");

    drawMap();
}

function sendTextToHTML(text, htmlID) {
    var htmlElm = document.getElementById(htmlID);
    if (!htmlElm) {
        console.log("Failed to get " + htmlID + " from HTML");
        return;
    }
    htmlElm.innerHTML = text;
}

function convertCordEventToGL(ev) {
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
    y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

    return ([x, y]);
}