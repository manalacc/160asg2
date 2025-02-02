// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =`
    attribute vec4 a_Position;
    uniform mat4 u_ModelMatrix;
    uniform mat4 u_GlobalRotateMatrix;
    void main() {
        gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    }`
  
// Fragment shader program
var FSHADER_SOURCE =`
    precision mediump float;
    uniform vec4 u_FragColor;  
    void main() {
      gl_FragColor = u_FragColor;
    }`


// Glb vars
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;
let u_ModelMatrix;


function setupWebGL() {
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    // gl = getWebGLContext(canvas)
    gl = canvas.getContext('webgl', {preserveDrawingBuffer: true});
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
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

    // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }    
    

    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
        console.log('Failed to get the storage location of u_ModelMatrix');
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

// UI globals
let g_selectedColor=[1.0,1.0,1.0,1.0];
let g_selectedSize = 10;
let g_selectedSegments = 10;
let g_globalAngle = 0;
let g_mouseDragging = false;
let g_lastMouseX = null;
let g_lastMouseY = null;
let g_globalAngleX = 0;
let g_globalAngleY = 0;
let g_globalAngleZ = 0;

function addActionsForHtmlUI() {
    document.getElementById('angleSlider').addEventListener('mousemove', function() {g_globalAngleY = this.value; renderAllShapes();})
    document.getElementById('slider').addEventListener('mousemove', function() {g_mouthPosY = this.value; renderAllShapes();})
    document.getElementById('reset_cam').addEventListener('mouseup', function() {
        g_globalAngleX = 0;
        g_globalAngleY = 0;
        g_globalAngleZ = 0;
    })
}

function main() {

    setupWebGL();

    connectVariablesToGLSL();
    
    // Register function (event handler) to be called on a mouse press
    canvas.onmousedown = function(ev) {
        g_mouseDragging = true;
        [g_lastMouseX, g_lastMouseY] = [ev.clientX, ev.clientY];

        if (ev.shiftKey) {
            startAnimation();
        }
    };
    
    canvas.onmousemove = function(ev) { if(ev.buttons == 1) { click(ev) }};

    canvas.onmouseup = function() {
        g_mouseDragging = false;
    };
    addActionsForHtmlUI();

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //renderAllShapes();
    requestAnimationFrame(tick);
}

var g_startTime=performance.now()/1000.0;
var g_seconds=performance.now()/1000.0-g_startTime;
let g_lastFrameTime = performance.now();
let g_fps = 0;

function tick() {
    //console.log(performance.now());
    let now = performance.now();
    let deltaTime = now - g_lastFrameTime;
    g_lastFrameTime = now;

    g_fps = Math.round(1000 / deltaTime);

    document.getElementById("fps").innerText = `FPS: ${g_fps}`;

    g_seconds=performance.now()/1000.0 - g_startTime;

    renderAllShapes();

    requestAnimationFrame(tick);
}

var g_shapesList = [];

function click(ev) {

    if (g_mouseDragging) {
        let dx = ev.clientX - g_lastMouseX;
        let dy = ev.clientY - g_lastMouseY;

        if (Math.abs(dx) > Math.abs(dy)) {
            // Horizontal movement: rotate around Y-axis
            g_globalAngleY += dx * 0.5;
        } else {
            // Vertical movement: rotate around X-axis
            g_globalAngleX += dy * 0.5;
        }

        if (Math.abs(dx) > 10 && Math.abs(dy) > 10) {
            g_globalAngleZ += (dx + dy) * 0.2;
        }

        [g_lastMouseX, g_lastMouseY] = [ev.clientX, ev.clientY];
        renderAllShapes();
    }

}

function convertCoordinatesEventToGL(ev) {
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
    
    return([x, y])
}

const ORANGE = [1.0, 0.5, 0.0, 1.0];
const ORANGE2 = [.95, 0.49, 0.1, 1.0];

let g_animationActive = false;
let g_animationTime = 0;
let g_legAngle = -10;
let g_direction = 1;  // 1 = forward, -1 = backward
let g_tuftAngle = 45;
let g_body2Angle = 45;
let g_legPosZ = 0;
let g_legPosY = -0.7;
let g_mouthPosY = 0.035;

function startAnimation() {
    if (!g_animationActive) {
        g_animationActive = true;
        g_animationTime = 0;
        animate();
    }
}

function animate() {
    if (!g_animationActive) return;

    g_legAngle += g_direction * 1;
    g_legPosY += g_direction * .005;
    g_legPosZ += g_direction * -.005;

    if (g_legAngle > 90 ) {
        g_direction *= -1;
    } else if (g_legAngle < -10) {
        g_direction *= -1;
        g_animationActive = false;
    }

    renderAllShapes();

    requestAnimationFrame(animate)
}

function renderAllShapes() {

    var globalRotMat = new Matrix4();
    globalRotMat.rotate(g_globalAngleX, 1, 0, 0);
    globalRotMat.rotate(g_globalAngleY, 0, 1, 0);
    globalRotMat.rotate(g_globalAngleZ, 0, 0, 1);
    globalRotMat.scale(0.75, 0.75, 0.75);
    globalRotMat.translate(0, .25, 0)
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);
    
    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    //gl.clear(gl.COLOR_BUFFER_BIT);

    var body = new Cube();
    body.color = [1,1,1,1];
    body.matrix.translate(-.25, -.25, 0.0);
    body.matrix.scale(0.5, .5, .5);
    body.render();

    var body2 = new Cube();
    body2.color = ORANGE;
    body2.matrix.translate(-.275, -0.55, 1.025);
    body2.matrix.rotate(180, 1, 0, 0);
    body2.matrix.rotate(g_body2Angle, 1, 0, 0);
    body2.matrix.scale(0.55, .5, 1);
    body2.render();

    var body3 = new Cube();
    body3.color = ORANGE;
    body3.matrix.translate(-.275, -0.55, .525);
    body3.matrix.rotate(90, 1, 0, 0);
    body3.matrix.scale(0.55, .5, .55);
    body3.render();

    var tuft = new TriPrism();
    tuft.matrix.translate(-.125, -.21, -0.05);
    tuft.matrix.rotate(g_tuftAngle, 1, 0, 0);
    tuft.matrix.scale(0.25,.15,.75);
    tuft.render();

    var head = new Cube();
    head.color = ORANGE;
    head.matrix.translate(-.275, -0.05, -0.05);
    head.matrix.scale(0.55, .5, .57);
    head.render();

    var mouth = new Cube();
    mouth.matrix.translate(-0.15, 0, -0.1);
    mouth.matrix.rotate(10, 0, 0, 1);
    mouth.matrix.scale(0.2, .1, .1);
    mouth.render();

    var mouth2 = new Cube();
    mouth2.matrix.translate(-0.05, 0.035, -0.1);
    mouth2.matrix.rotate(-10, 0, 0, 1);
    mouth2.matrix.scale(0.2, .1, .1);
    mouth2.render();

    var mouth3 = new TriPrism();
    mouth3.matrix.translate(-0.05, g_mouthPosY, -0.1);
    mouth3.matrix.rotate(90, 1, 0, 0);
    mouth3.matrix.scale(0.1, .1, .1);
    mouth3.render();

    var ear = new TriPrism();
    ear.color = ORANGE2; 
    ear.matrix.translate(-0.24, 0.4, 0.425);
    ear.matrix.scale(0.2, 0.25, 0.2);
    ear.matrix.rotate(-90, 1, 0, 0);
    ear.matrix.rotate(9, 0, 0, 1);
    ear.render();

    var ear2 = new TriPrism();
    ear2.color = ORANGE; 
    ear2.matrix.translate(0.045, 0.4, 0.39);
    ear2.matrix.scale(0.2, 0.25, 0.2);
    ear2.matrix.rotate(-90, 1, 0, 0);
    ear2.matrix.rotate(-8.5, 0, 0, 1);
    ear2.render();

    var eye = new Cube();
    eye.color = [1,1,1,1];
    eye.matrix.translate(0.05, 0.3, -0.06)
    eye.matrix.scale(0.125, 0.09, .1);
    eye.matrix.rotate(-45, 0, 0, 1);
    eye.render();

    var eye2 = new Cube();
    eye2.color = [1,1,1,1];
    eye2.matrix.translate(-0.225, 0.3, -0.06)
    eye2.matrix.scale(0.125, 0.09, .1);
    eye2.matrix.rotate(-45, 0, 0, 1);
    eye2.render();

    var pupil1 = new Cube();
    pupil1.color = [0,0,0,1];
    pupil1.matrix.translate(0.1, 0.3, -0.07)
    pupil1.matrix.scale(0.05, 0.09, .1);
    pupil1.matrix.rotate(-45, 0, 0, 1);
    pupil1.render();

    var pupil2 = new Cube();
    pupil2.color = [0,0,0,1];
    pupil2.matrix.translate(-0.175, 0.3, -0.07)
    pupil2.matrix.scale(0.05, 0.09, .1);
    pupil2.matrix.rotate(-45, 0, 0, 1);
    pupil2.render();

    var frontleg_left = new Cube();
    frontleg_left.color = ORANGE;
    frontleg_left.matrix.translate(0.14, g_legPosY, g_legPosZ)
    frontleg_left.matrix.rotate(g_legAngle, 1, 0, 0);
    frontleg_leftMat = new Matrix4(frontleg_left.matrix);
    frontleg_left.matrix.scale(0.15, 0.5, 0.2)
    frontleg_left.render();

    var frontleg_left_joint = new Cube();
    frontleg_left_joint.color = ORANGE;
    frontleg_left_joint.matrix = frontleg_leftMat;
    frontleg_left_joint.matrix.translate(0, 0, 0.20)
    frontleg_left_joint.matrix.rotate(-170, 1, 0, 0);
    frontleg_left_jointMat = new Matrix4(frontleg_left_joint.matrix)
    frontleg_left_joint.matrix.scale(0.15, 0.35, 0.19)
    frontleg_left_joint.render();

    var frontleg_left_joint2 = new Cube();
    frontleg_left_joint2.color = [1,1,1, 1.0];
    frontleg_left_joint2.matrix = frontleg_left_jointMat;
    frontleg_left_joint2.matrix.translate(0, 0.35, 0)
    frontleg_left_joint2.matrix.rotate(0, 1, 0, 0);
    frontleg_left_joint2.matrix.scale(0.15, 0.09, 0.2)
    frontleg_left_joint2.render();

    var frontleg_right = new Cube();
    frontleg_right.color = ORANGE;
    frontleg_right.matrix.translate(-0.285,-0.2, -0.3)
    frontleg_right.matrix.rotate(75, 1, 0, 0);
    frontleg_right.matrix.rotate(5, 0, 0.5, 0.6);
    var frontleg_rightMat = new Matrix4(frontleg_right.matrix);
    frontleg_right.matrix.scale(0.15, 0.35, 0.2)
    frontleg_right.render();

    var frontleg_right_joint = new Cube();
    frontleg_right_joint.color = ORANGE;
    frontleg_right_joint.matrix = frontleg_rightMat;
    frontleg_right_joint.matrix.translate(0.1, -0.1, -0)
    frontleg_right_joint.matrix.rotate(-90, 0.5, 0.5, 0);
    frontleg_right_joint.matrix.rotate(20 * Math.sin(g_seconds), 0.1, 0, 0.1);
    var frontleg_right_jointMat = new Matrix4(frontleg_right_joint.matrix)
    frontleg_right_joint.matrix.scale(0.15, 0.35, 0.19)
    frontleg_right_joint.render();

    var frontleg_right_joint2 = new Cube();
    frontleg_right_joint2.color = [1,1,1, 1.0];
    frontleg_right_joint2.matrix = frontleg_right_jointMat;
    frontleg_right_joint2.matrix.translate(-0, .35, -0)
    frontleg_right_joint2.matrix.rotate(0, 1, 0, 0);
    frontleg_right_joint2.matrix.scale(0.15, 0.09, 0.2)
    frontleg_right_joint2.render();

    var hindleg_left = new Cube();
    hindleg_left.color = ORANGE2;
    hindleg_left.matrix.translate(0.175,-1.1, 0.65)
    hindleg_left.matrix.rotate(-45, 1, 0, 0);
    hindleg_left.matrix.scale(0.15, 0.4, 0.4)
    hindleg_left.render();

    var hindleg_left_joint = new Cube();
    hindleg_left_joint.color = ORANGE2;
    hindleg_left_joint.matrix.translate(0.175,-1.1, 0.65)
    hindleg_left_joint.matrix.scale(0.15, 0.15, -0.35)
    hindleg_left_joint.render();

    var hindleg_left_foot = new Cube();
    hindleg_left_foot.color = [1,1,1, 1.0];
    hindleg_left_foot.matrix.translate(0.175,-1.1, 0.3)
    hindleg_left_foot.matrix.scale(0.15, 0.15, -0.1)
    hindleg_left_foot.render();

    var hindleg_right = new Cube();
    hindleg_right.color = ORANGE2;
    hindleg_right.matrix.translate(-0.325,-1.1, 0.65)
    hindleg_right.matrix.rotate(-45, 1, 0, 0);
    hindleg_right.matrix.scale(0.15, 0.4, 0.4)
    hindleg_right.render();

    var hindleg_right_joint = new Cube();
    hindleg_right_joint.color = ORANGE2;
    hindleg_right_joint.matrix.translate(-0.325,-1.1, 0.65)
    hindleg_right_joint.matrix.scale(0.15, 0.15, -0.35)
    hindleg_right_joint.render();

    var hindleg_right_foot = new Cube();
    hindleg_right_foot.color = [1,1,1, 1.0];
    hindleg_right_foot.matrix.translate(-0.325,-1.1, 0.3)
    hindleg_right_foot.matrix.scale(0.15, 0.15, -0.1)
    hindleg_right_foot.render();

    var tail1 = new Cube();
    tail1.color = ORANGE2;
    tail1.matrix.translate(-0.05,-1.1,1.01);
    tail1.matrix.rotate(60,0, 1, 0);
    tail1.matrix.scale(.1,.1,.45)
    tail1.render(1, 0.55, 0.1);

    var tail2 = new Cube();
    tail2.color = ORANGE;
    tail2.matrix.translate(0.35,-1.1, 1.25);
    tail2.matrix.rotate(120,0, 1, 0);
    tail2.matrix.scale(.1,.1,.45)
    tail2.render(1, 0.55, 0.1);

    var tail3 = new Cube();
    tail3.color = ORANGE2;
    tail3.matrix.translate(0.75,-1.1, 1);
    tail3.matrix.rotate(Math.abs(10 * Math.sin(g_seconds)), 1, 0, 0);
    var tail3_Mat = new Matrix4(tail3.matrix);
    tail3.matrix.rotate(180,0, 1, 0);
    tail3.matrix.scale(.1,.1,.2);
    tail3.render();

    var tail4 = new Cube();
    tail4.color = ORANGE;
    tail4.matrix = new Matrix4(tail3_Mat);
    tail4.matrix.translate(0, 0, -0.2);
    tail4.matrix.rotate(Math.abs(20 * Math.sin(g_seconds)), 1, 0, 0);
    var tail4_Mat = new Matrix4(tail4.matrix);
    tail4.matrix.rotate(190, 0, 1, 0);
    tail4.matrix.scale(.1,.1,.2);
    tail4.render();

    var tail5 = new Cube();
    tail5.color = [1, 1, 1, 1.0];
    tail5.matrix = new Matrix4(tail4_Mat);
    tail5.matrix.translate(-0.025, 0, -0.2);
    tail5.matrix.rotate(Math.abs(50 * Math.sin(g_seconds)), 1, 0, 0);
    //var tail5_Mat = new Matrix4(tail4.matrix);
    tail5.matrix.rotate(190, 0, 1, 0);
    tail5.matrix.scale(.1,.1,.2);
    tail5.render();

}
