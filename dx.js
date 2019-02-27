"use strict";

function DX(gl) {
// begin


gl.clearColor(0.0, 0.0, 0.0, 0.0); // transparent
gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.LEQUAL);



// shader
var gradedShader;

{
    const gradedVShader = vShader(`
        attribute vec4 aVertexPosition;
        attribute vec2 aTextureCoord;
        attribute vec4 aNormal;

        uniform sampler2D uTexture;

        uniform mat4 uProjectionMatrix;
        uniform mat4 uNormalMatrix;

        varying lowp vec4 vColor;

        void main(void) {
            gl_Position  = uProjectionMatrix * aVertexPosition;

            vColor = texture2D(uTexture, aTextureCoord);

            vec4 normal = uNormalMatrix * aNormal;
            float f = normal[2];

            if (f < 0.0) f = 0.0;

            f = 0.9 * f + 0.1;


            vColor[0] *= f;
            vColor[1] *= f;
            vColor[2] *= f;
        }

    `);

    const gradedFShader = fShader(`
        varying lowp vec4 vColor;

        void main(void) {
            gl_FragColor = vColor;
        }
    `);

    const program = initShaderProgram(gradedVShader, gradedFShader);

    const attributes = {
        vertexPosition: gl.getAttribLocation(program, 'aVertexPosition'),
        vertexTexCoord: gl.getAttribLocation(program, 'aTextureCoord'),
        normal: gl.getAttribLocation(program, 'aNormal')
    }

    const uniforms = {
        projectionMatrix: gl.getUniformLocation(program, 'uProjectionMatrix'),
        texture: gl.getUniformLocation(program, 'uTexture'),
        normalMatrix: gl.getUniformLocation(program, 'uNormalMatrix')
    }

    gradedShader = {program, attributes, uniforms};
}


const tmpVec0 = vec3.create();
const tmpVec1 = vec3.create();

// shapes

function GradedShape(vertixS, texture, triangleS) {

    const size = triangleS.length * 3;
    let vertices = [], vertexTexCoords = [], normals = [];

    for (let [corners, texCoords] of triangleS) {
        vec3.subtract(tmpVec0, vertixS[corners[1]], vertixS[corners[0]]);
        vec3.subtract(tmpVec1, vertixS[corners[2]], vertixS[corners[0]]);

        const normal = vec3.normalize(tmpVec0, vec3.cross(tmpVec0, tmpVec0, tmpVec1));

        for (let i=0; i<3; i++) {

            const vertix = vertixS[corners[i]];
            if (!vertix) throw new Error(`undefined index ${corners[i]} in vertices`);

            vertices.push(...vertix);

            vertexTexCoords.push(...texCoords[i]);

            normals.push(...normal);
        }
    }

    vertices = initBuffer(vertices);
    vertexTexCoords = initBuffer(vertexTexCoords);
    normals = initBuffer(normals);

    if (texture.constructor === Array) texture = createTexture(...texture);

    return {size, vertices, texture, vertexTexCoords, normals};
}





// drawing
var lastProgram, lastShape;


function clear() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clear the canvas
}

const pjMat = mat4.create();
const nmMat = mat4.create();

function draw(shape, projectionMatrix, objectMatrix) {
    mat4.multiply(pjMat, projectionMatrix, objectMatrix);
    mat4.getRotationMatrix(nmMat, objectMatrix);

    const {program, attributes, uniforms} = gradedShader;
    const {size, vertices, texture, vertexTexCoords, normals} = shape;

    if (lastProgram !== program) {
        gl.useProgram(program);
        lastProgram = program;
    }

    if (lastShape !== shape) {
        setAttrPointer(vertices, attributes.vertexPosition, 3);
        setAttrPointer(vertexTexCoords, attributes.vertexTexCoord, 2);
        setAttrPointer(normals, attributes.normal, 3);
        setTexture(texture, uniforms.texture, 0);
        lastShape = shape;
    }

    gl.uniformMatrix4fv(uniforms.projectionMatrix, false, pjMat);
    gl.uniformMatrix4fv(uniforms.normalMatrix, false, nmMat);

    gl.drawArrays(gl.TRIANGLES, 0, size);
}





// helpers
function createTexture(pixels, width, height) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    const level = 0;
    const internalFormat = gl.RGBA;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;

    pixels = new Uint8Array(([]).concat(...pixels));  // opaque blue

    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixels);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    return texture;
}




// Initialize a shader program, so WebGL knows how to draw our data
function initShaderProgram(vertexShader, fragmentShader) {
    if (typeof vertexShader === "string") vertexShader = vShader(vertexShader);
    if (typeof fragmentShader === "string") fragmentShader = fShader(fragmentShader);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
}




// creates a shader of the given type, uploads the source and
// compiles it
function vShader(source) {
    return loadShader(gl.VERTEX_SHADER, source);
}

function fShader(source) {
    return loadShader(gl.FRAGMENT_SHADER, source);
}

//
function loadShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

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




function setAttrPointer(buffer, attributeLocation, size, type=null, normalize=null, stride=0, offset=0) {
    type = type || gl.FLOAT;    // the data in the buffer is 32bit floats

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(attributeLocation, size, type, normalize, stride, offset);
    gl.enableVertexAttribArray(attributeLocation);
}



function setTexture(texture, textureLocation, unit) {
    gl.activeTexture(gl["TEXTURE" + unit]);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(textureLocation, unit);
}



// util

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}








return { gl, GradedShape, clear, draw };

// end
};