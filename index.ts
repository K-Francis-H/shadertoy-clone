const VSHADER = `
	attribute vec4 a_Position;
	uniform vec2 u_Resolution;
	uniform float u_Time;
	uniform vec3 u_Color;
	varying vec2 v_Resolution;
	varying float v_Time;
	varying vec3 v_Color;
	void main() {
		v_Resolution = u_Resolution;
		v_Time = u_Time;
		gl_Position = a_Position;
	}
`;

const FSHADER = `
#ifdef GL_ES
precision mediump float;
#endif
varying vec2 v_Resolution;
varying float v_Time;
varying vec3 v_Color;

vec3 palette(float t) {
    vec3 a = vec3(0.5,0.5,0.5);
    vec3 b = vec3(0.5,0.5,0.5);
    vec3 c = vec3(1.0,1.0,1.0);
    vec3 d = vec3(0.263,0.416,0.557);
    
    return a + b*cos(6.28318*(c*t*d) );
}

vec4 mainImage(vec2 fragCoord){
	vec2 uv = 2.0*fragCoord/v_Resolution.xy - 1.0;
	uv.x *= v_Resolution.x / v_Resolution.y; 

	vec3 finalCol = vec3(0.0);
	vec2 uv0 = uv;

	for(float i=0.0; i < 3.0; i++){
		uv = fract(uv * 1.6) - 0.5;

		float d = length(uv) * exp(-length(uv0));

		vec3 col = palette(length(uv0) + i*.4 + v_Time*.4);

		d = sin(d*8.0 + v_Time)/8.0;
		d = abs(d);

		//d = smoothstep(0.0,0.1,d);
		d = pow(0.02 / d, 1.2);

		finalCol += col * d;
	}

	// Output to screen
	return vec4(finalCol,1.0);
} 

void main() {
	gl_FragColor = mainImage(gl_FragCoord.xy);
}
`;

const SHADER = `vec3 palette(float t) {
    vec3 a = vec3(0.5,0.5,0.5);
    vec3 b = vec3(0.5,0.5,0.5);
    vec3 c = vec3(1.0,1.0,1.0);
    vec3 d = vec3(0.263,0.416,0.557);
    
    return a + b*cos(6.28318*(c*t*d) );
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = 2.0*fragCoord/iResolution.xy - 1.0;
    uv.x *= iResolution.x / iResolution.y; 
    
    vec3 finalCol = vec3(0.0);
    
    vec2 uv0 = uv;
    
    

    for(float i=0.0; i < 3.0; i++){
        uv = fract(uv * 2.7) - 0.5;
    
        float d = length(uv) * exp(-length(uv0));
    
        vec3 col = palette(length(uv0) + i*.4 + iTime*.4);

        d = sin(d*8.0 + iTime)/8.0;
        d = abs(d);

        //d = smoothstep(0.0,0.1,d);
        d = pow(0.02 / d, 1.2);

        finalCol += col * d;
    }
    

    

    // Output to screen
    fragColor = vec4(finalCol,1.0);
}`;

//a quad to cover the entire view
//no need for a camera, we draw on this
const QUAD = new Float32Array([
	-1.0,-1.0, 0.0,
	-1.0, 1.0, 0.0,
	 1.0,-1.0, 0.0,
	 1.0, 1.0, 0.0
]);

function compileShaderProgram(gl, vSource, fSource){
   var program = gl.createProgram();

   var vShader = gl.createShader(gl.VERTEX_SHADER);
   gl.shaderSource(vShader, vSource);
   gl.compileShader(vShader);
   if(!gl.getShaderParameter(vShader, gl.COMPILE_STATUS))
      console.log("compilation of vertex shader failed: "+gl.getShaderInfoLog(vShader));

   var fShader = gl.createShader(gl.FRAGMENT_SHADER);
   gl.shaderSource(fShader, fSource);
   gl.compileShader(fShader);
   if(!gl.getShaderParameter(fShader, gl.COMPILE_STATUS))
      console.log("compilation of fragment shader failed: "+gl.getShaderInfoLog(fShader));

   //link program
   gl.attachShader(program, vShader);
   gl.attachShader(program, fShader);
   gl.linkProgram(program);

   if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
       alert("Unable to link program, check console for details.");
   }

   return program;
}

function prepareProgramVariables(gl, program, uniforms, attributes){
   for(var i=0; i < uniforms.length; i++){
      program[uniforms[i]] = gl.getUniformLocation(program, uniforms[i]);
      if(program[uniforms[i]] === null){
         console.log("failed to init "+uniforms[i]);
      }
   }
   for(var i=0; i < attributes.length; i++){
      program[attributes[i]] = gl.getAttribLocation(program, attributes[i]);
      if(program[attributes[i]] === -1){
         console.log("failed to init "+attributes[i]);
      }
   }
}

function initUI(){
	//setup callbacks for compile button
	
}

function boundedTime(bound){
	return ((new Date()).getTime() % bound)/bound; //repeats on a visible seam
}

function loopedTime(){//goes back and forth like the cycle of sin/cos
	return Math.cos((new Date()).getTime()/1000); //divide by 1000 to slow it down, remove if you like seizures
}

function sinceEpoch(epoch){
	return ( (new Date()).getTime() - epoch )/1000;  //divide by 1000 to slow it down, remove if you like seizures
}

function renderLoop(gl, program, epoch){
	gl.uniform1f(program["u_Time"], sinceEpoch(epoch));//loopedTime());//boundedTime(10000));
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, QUAD.length/3);
}

function initialize(fshader){
	const EPOCH = (new Date()).getTime(); //used to compute time for u_Time
	const canvas = document.getElementById("canvas") as HTMLCanvasElement;
	const gl = canvas.getContext("webgl");

	console.log(gl.getParameter(gl.VERSION));
	console.log(gl.getParameter(gl.SHADING_LANGUAGE_VERSION));

	const shader = compileShaderProgram(gl, VSHADER, fshader);
	prepareProgramVariables(gl, shader,
		["u_Resolution", "u_Time", "u_Color"],
		["a_Position"]
	);

	//setup vertex array buffer
	shader.vbo = gl.createBuffer();							//buffer for holding vertex data
	

	//set our program as active
	gl.useProgram(shader);

	//init uniform values
	gl.uniform2f(shader["u_Resolution"], canvas.width, canvas.height);
	gl.uniform1f(shader["u_Time"], sinceEpoch(EPOCH));//loopedTime());
	gl.uniform3f(shader["u_Color"], 0.8,0.5,0.19); 

	//attempt draw
	gl.clearColor(0,0,0,1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);				//probably cult cargo, don't need since we're texturing a quad

	//bind and draw
	gl.bindBuffer(gl.ARRAY_BUFFER, shader.vbo);					//bind the vertex array buffer
	gl.bufferData(gl.ARRAY_BUFFER, QUAD, gl.STATIC_DRAW);				//load the QUAD vertices into the buffer
	gl.vertexAttribPointer(shader["a_Position"], 3, gl.FLOAT, false, 0, 0);		//describe the vertex array structure to gl (3 floats per vertex, no interleaving)
	gl.enableVertexAttribArray(shader["a_Position"]);				//set this array as ready for a drawArrrays() call

	gl.drawArrays(gl.TRIANGLE_STRIP, 0, QUAD.length/3);

	return setInterval(function(){
		renderLoop(gl, shader, EPOCH);
	}, 1/30)

	
}

document.addEventListener("DOMContentLoaded", function(){

	//TODO add textarea for editing the frag shader
	//making this a complete ripoff of shadertoy, but worse...
	//It is cool to see how much gl code goes into making the
	//minimum apparatus to run a fragment shader art toy though.
	

	const textarea = document.getElementById("shader-src") as HTMLInputElement;
	textarea.value = FSHADER;

	var ctl = initialize(FSHADER);
	
	const compileButton = document.getElementById("compile");
	compileButton.addEventListener("click", function(){
		//get text area
		let content = (document.getElementById("shader-src") as HTMLInputElement).value;
		//compile new shader, hand it off to the render loop...
		clearInterval(ctl);
		ctl = initialize(content);
	});

	
	
});
