var VSHADER = "\n\tattribute vec4 a_Position;\n\tuniform vec2 u_Resolution;\n\tuniform float u_Time;\n\tuniform vec3 u_Color;\n\tvarying vec2 v_Resolution;\n\tvarying float v_Time;\n\tvarying vec3 v_Color;\n\tvoid main() {\n\t\tv_Resolution = u_Resolution;\n\t\tv_Time = u_Time;\n\t\tgl_Position = a_Position;\n\t}\n";
var FSHADER = "\n\t#ifdef GL_ES\n\tprecision mediump float;\n\t#endif\n\tvarying vec2 v_Resolution;\n\tvarying float v_Time;\n\tvarying vec3 v_Color;\n\n\tvec3 palette(float t) {\n\t    vec3 a = vec3(0.5,0.5,0.5);\n\t    vec3 b = vec3(0.5,0.5,0.5);\n\t    vec3 c = vec3(1.0,1.0,1.0);\n\t    vec3 d = vec3(0.263,0.416,0.557);\n\t    \n\t    return a + b*cos(6.28318*(c*t*d) );\n\t}\n\n\tvec4 mainImage(vec2 fragCoord){\n\t\tvec2 uv = 2.0*fragCoord/v_Resolution.xy - 1.0;\n\t\tuv.x *= v_Resolution.x / v_Resolution.y; \n\n\t\tvec3 finalCol = vec3(0.0);\n\t\tvec2 uv0 = uv;\n\n\t\tfor(float i=0.0; i < 3.0; i++){\n\t\t\tuv = fract(uv * 1.6) - 0.5;\n\n\t\t\tfloat d = length(uv) * exp(-length(uv0));\n\n\t\t\tvec3 col = palette(length(uv0) + i*.4 + v_Time*.4);\n\n\t\t\td = sin(d*8.0 + v_Time)/8.0;\n\t\t\td = abs(d);\n\n\t\t\t//d = smoothstep(0.0,0.1,d);\n\t\t\td = pow(0.02 / d, 1.2);\n\n\t\t\tfinalCol += col * d;\n\t\t}\n\n\t\t// Output to screen\n\t\treturn vec4(finalCol,1.0);\n\t} \n\n\tvoid main() {\n\t\tgl_FragColor = mainImage(gl_FragCoord.xy);\n\t}\n";
var SHADER = "vec3 palette(float t) {\n    vec3 a = vec3(0.5,0.5,0.5);\n    vec3 b = vec3(0.5,0.5,0.5);\n    vec3 c = vec3(1.0,1.0,1.0);\n    vec3 d = vec3(0.263,0.416,0.557);\n    \n    return a + b*cos(6.28318*(c*t*d) );\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    // Normalized pixel coordinates (from 0 to 1)\n    vec2 uv = 2.0*fragCoord/iResolution.xy - 1.0;\n    uv.x *= iResolution.x / iResolution.y; \n    \n    vec3 finalCol = vec3(0.0);\n    \n    vec2 uv0 = uv;\n    \n    \n\n    for(float i=0.0; i < 3.0; i++){\n        uv = fract(uv * 2.7) - 0.5;\n    \n        float d = length(uv) * exp(-length(uv0));\n    \n        vec3 col = palette(length(uv0) + i*.4 + iTime*.4);\n\n        d = sin(d*8.0 + iTime)/8.0;\n        d = abs(d);\n\n        //d = smoothstep(0.0,0.1,d);\n        d = pow(0.02 / d, 1.2);\n\n        finalCol += col * d;\n    }\n    \n\n    \n\n    // Output to screen\n    fragColor = vec4(finalCol,1.0);\n}";
//a quad to cover the entire view
//no need for a camera, we draw on this
var QUAD = new Float32Array([
    -1.0, -1.0, 0.0,
    -1.0, 1.0, 0.0,
    1.0, -1.0, 0.0,
    1.0, 1.0, 0.0
]);
function compileShaderProgram(gl, vSource, fSource) {
    var program = gl.createProgram();
    var vShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vShader, vSource);
    gl.compileShader(vShader);
    if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS))
        console.log("compilation of vertex shader failed: " + gl.getShaderInfoLog(vShader));
    var fShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fShader, fSource);
    gl.compileShader(fShader);
    if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS))
        console.log("compilation of fragment shader failed: " + gl.getShaderInfoLog(fShader));
    //link program
    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        alert("Unable to link program, check console for details.");
    }
    return program;
}
function prepareProgramVariables(gl, program, uniforms, attributes) {
    for (var i = 0; i < uniforms.length; i++) {
        program[uniforms[i]] = gl.getUniformLocation(program, uniforms[i]);
        if (program[uniforms[i]] === null) {
            console.log("failed to init " + uniforms[i]);
        }
    }
    for (var i = 0; i < attributes.length; i++) {
        program[attributes[i]] = gl.getAttribLocation(program, attributes[i]);
        if (program[attributes[i]] === -1) {
            console.log("failed to init " + attributes[i]);
        }
    }
}
function initUI() {
    //setup callbacks for compile button
}
function boundedTime(bound) {
    return ((new Date()).getTime() % bound) / bound; //repeats on a visible seam
}
function loopedTime() {
    return Math.cos((new Date()).getTime() / 1000); //divide by 1000 to slow it down, remove if you like seizures
}
function sinceEpoch(epoch) {
    return ((new Date()).getTime() - epoch) / 1000; //divide by 1000 to slow it down, remove if you like seizures
}
function renderLoop(gl, program, epoch) {
    gl.uniform1f(program["u_Time"], sinceEpoch(epoch)); //loopedTime());//boundedTime(10000));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, QUAD.length / 3);
}
function initialize(fshader) {
    var EPOCH = (new Date()).getTime(); //used to compute time for u_Time
    var canvas = document.getElementById("canvas");
    var gl = canvas.getContext("webgl");
    console.log(gl.getParameter(gl.VERSION));
    console.log(gl.getParameter(gl.SHADING_LANGUAGE_VERSION));
    var shader = compileShaderProgram(gl, VSHADER, fshader);
    prepareProgramVariables(gl, shader, ["u_Resolution", "u_Time", "u_Color"], ["a_Position"]);
    //setup vertex array buffer
    shader.vbo = gl.createBuffer(); //buffer for holding vertex data
    //set our program as active
    gl.useProgram(shader);
    //init uniform values
    gl.uniform2f(shader["u_Resolution"], canvas.width, canvas.height);
    gl.uniform1f(shader["u_Time"], sinceEpoch(EPOCH)); //loopedTime());
    gl.uniform3f(shader["u_Color"], 0.8, 0.5, 0.19);
    //attempt draw
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); //probably cult cargo, don't need since we're texturing a quad
    //bind and draw
    gl.bindBuffer(gl.ARRAY_BUFFER, shader.vbo); //bind the vertex array buffer
    gl.bufferData(gl.ARRAY_BUFFER, QUAD, gl.STATIC_DRAW); //load the QUAD vertices into the buffer
    gl.vertexAttribPointer(shader["a_Position"], 3, gl.FLOAT, false, 0, 0); //describe the vertex array structure to gl (3 floats per vertex, no interleaving)
    gl.enableVertexAttribArray(shader["a_Position"]); //set this array as ready for a drawArrrays() call
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, QUAD.length / 3);
    return setInterval(function () {
        renderLoop(gl, shader, EPOCH);
    }, 1 / 30);
}
document.addEventListener("DOMContentLoaded", function () {
    //TODO add textarea for editing the frag shader
    //making this a complete ripoff of shadertoy, but worse...
    //It is cool to see how much gl code goes into making the
    //minimum apparatus to run a fragment shader art toy though.
    var textarea = document.getElementById("shader-src");
    textarea.value = FSHADER;
    var ctl = initialize(FSHADER);
    var compileButton = document.getElementById("compile");
    compileButton.addEventListener("click", function () {
        //get text area
        var content = document.getElementById("shader-src").value;
        //compile new shader, hand it off to the render loop...
        clearInterval(ctl);
        ctl = initialize(content);
    });
});
