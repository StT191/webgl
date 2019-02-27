"use strict";

function DX(gl) {
// begin

gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);


// shader

var gradedShader;

{
    const program = initShaderProgram(
        `
            attribute vec4 aVertexPosition;
            attribute vec4 aVertexColor;

            uniform mat4 uModelViewMatrix;
            uniform mat4 uProjectionMatrix;
            uniform mat4 uNormalMatrix;

            varying lowp vec4 vColor;

            void main(void) {
                gl_Position  = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
                vColor = aVertexColor;
            }

        `,
        `
            varying lowp vec4 vColor;

            void main(void) {
                gl_FragColor = vColor;
            }
        `
    );

    gradedShader = {
        program,
        attributes: {
            vertexPosition: gl.getAttribLocation(program, 'aVertexPosition'),
            vertexColor: gl.getAttribLocation(program, 'aVertexColor')
        },
        uniforms: {
            projectionMatrix: gl.getUniformLocation(program, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(program, 'uModelViewMatrix'),
            //normalMatrix: gl.getUniformLocation(program, 'uNormalMatrix')
        }
    };
}


// shapes

function GradedShape(vertixS, colorS, triangleS) {

    let vertices = [], colors = [];

    for (let triangle of triangleS) {
        const corners = triangle.slice(0, 3);
        const cColors = triangle.slice(3);
        let colorI;

        for (let i=0; i<3; i++) {

            const vertix = vertixS[corners[i]];
            if (!vertix) throw new Error(`undefined index ${corners[i]} in vertices`);

            vertices.push(...vertix);

            colorI = cColors[i] || colorI;
            const cColor = colorS[colorI];
            if (!cColor) throw new Error(`undefined index ${colorI} in colors`);

            colors.push(...cColor);
        }
    }

    return {
        size: triangleS.length * 3,
        vertices: initBuffer(vertices),
        colors: initBuffer(colors)
    }
}


// drawing

function clear() {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clear the canvas
}


function draw(shape, modelViewMatrix, projectionMatrix) {
    const {program, attributes, uniforms} = gradedShader;
    const {size, vertices, colors} = shape;

    gl.useProgram(program);

    gl.uniformMatrix4fv(uniforms.projectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv(uniforms.modelViewMatrix, false, modelViewMatrix);


    initAttrPointer(vertices, attributes.vertexPosition, 3);
    initAttrPointer(colors, attributes.vertexColor, 4);

    gl.drawArrays(gl.TRIANGLES, 0, size);
}




// helpers

//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(vsSource, fsSource) {
    const vertexShader = loadShader(gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl.FRAGMENT_SHADER, fsSource);

    // Create the shader program

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // If creating the shader program failed, alert

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(type, source) {
    const shader = gl.createShader(type);

    // Send the source to the shader object

    gl.shaderSource(shader, source);

    // Compile the shader program

    gl.compileShader(shader);

    // See if it compiled successfully

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}


function initBuffer(data, bufferType=null, drawType=null) {
    bufferType = bufferType || "ARRAY_BUFFER";
    drawType = drawType || gl.STATIC_DRAW;
    const TypedArray = {"ARRAY_BUFFER": Float32Array, "ELEMENT_ARRAY_BUFFER": Uint16Array}[bufferType];

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl[bufferType], buffer);
    gl.bufferData(gl[bufferType], new TypedArray(data), drawType);
    return buffer;
}


function initAttrPointer(buffer, attributeLocation, size, type=null, normalize=null, stride=0, offset=0) {
    type = type || gl.FLOAT;    // the data in the buffer is 32bit floats

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(attributeLocation, size, type, normalize, stride, offset);
    gl.enableVertexAttribArray(attributeLocation);

}


return { gl, GradedShape, clear, draw };

// end
};