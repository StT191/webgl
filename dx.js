"use strict";

// add functionality to mat4;
{
    const tVec = vec3.create();

    mat4.getRotationMatrix = function(out, mat) {
        mat4.scale(out, mat, vec3.inverse(tVec, mat4.getScaling(tVec, mat)));
        out[12] = out[13] = out[14] = 0;
        return out;
    }

    const tMat = mat4.create();

    mat4.apply = function(out, mat, transform, ...args) {
        return mat4.multiply(out, transform(tMat, mat4.identity(tMat), ...args), mat);
    }
}


//go
function DX(gl) {

    // init

    gl.clearColor(0.0, 0.0, 0.0, 0.0); // transparent
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);



    // program
    function createProgram(vertexShader, fragmentShader, attrDefs, uniDefs) {

        const program = initShaderProgram(vertexShader, fragmentShader);

        const attributes = Object.entries(attrDefs).reduce((attributes, [key, [varName, ...args]]) => {

            const location = gl.getAttribLocation(program, varName);

            attributes[key] = atr => setAttrPointer(atr, location, ...args);

            attributes[key].l = location;

            return attributes;
        }, {});

        const uniforms = Object.entries(uniDefs).reduce((uniforms, [key, [varName, type]]) => {

            const location = gl.getUniformLocation(program, varName);

            var set;

            if (type.startsWith("texture")) {
                const unit = type.substr(7);
                set = texture => setTexture(location, texture, unit);
            }

            else switch (type) {
                case "Matrix2fv":  case "Matrix3fv":  case "Matrix4fv":
                    set = mat => gl["uniform"+type](location, false, mat); break;

                case "2f": case "3f": case "4f": case "2i": case "3i": case "4i":
                    set = value => gl["uniform"+type](location, ...value); break;

                case "1f": case "1i":
                case "1fv": case "2fv": case "3fv": case "4fv":
                case "1iv": case "2iv": case "3iv": case "4iv":
                default:
                    set = value => gl["uniform"+type](location, value); break;

            }

            set.l = location;

            uniforms[key] = set;
            return uniforms;
        }, {});

        return {program, attributes, uniforms};
    }



    // shader
    function initShaderProgram(vertexShader, fragmentShader) {
        if (typeof vertexShader === "string") vertexShader = VertexShader(vertexShader);
        if (typeof fragmentShader === "string") fragmentShader = FragmentShader(fragmentShader);

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

    function VertexShader(source) {
        return loadShader(gl.VERTEX_SHADER, source);
    }

    function FragmentShader(source) {
        return loadShader(gl.FRAGMENT_SHADER, source);
    }

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



    // texture
    function createTexture(pixels, width, height) {

        pixels = new Uint8Array(([]).concat(...pixels));

        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        const level = 0, internalFormat = gl.RGBA, border = 0, srcFormat = gl.RGBA, srcType = gl.UNSIGNED_BYTE;

        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixels);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        return texture;
    }

    function setTexture(textureLocation, texture, unit=0) {
        gl.activeTexture(gl["TEXTURE" + unit]);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(textureLocation, unit);
    }



    // buffer
    function initBuffer(data, bufferType=null, drawType=null) {
        bufferType = bufferType || "ARRAY_BUFFER";
        drawType = drawType || gl.STATIC_DRAW;
        const TypedArray = {"ARRAY_BUFFER": Float32Array, "ELEMENT_ARRAY_BUFFER": Uint16Array}[bufferType];

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl[bufferType], buffer);
        gl.bufferData(gl[bufferType], new TypedArray(data), drawType);
        return buffer;
    }


    // attribute Pointer
    function setAttrPointer(buffer, attributeLocation, size, type=gl.FLOAT, normalize=false, stride=0, offset=0) {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.vertexAttribPointer(attributeLocation, size, type, normalize, stride, offset);
        gl.enableVertexAttribArray(attributeLocation);
    }



    // drawing
    var lastProgram, lastShape;


    function clear() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clear the canvas
    }



    var lastProgram;

    function draw(shape, {program, attributes, uniforms}, state) {

        const data = Object.assign({}, shape, state);

        if (lastProgram !== program) {
            gl.useProgram(program);
            lastProgram = program;
        }

        const x = Object.entries(attributes).concat(Object.entries(uniforms));

        for (let [key, set] of Object.entries(attributes).concat(Object.entries(uniforms))) {
            set(data[key]);
        }

        gl.drawArrays(gl.TRIANGLES, 0, data.size);
    }



    // util
    function isPowerOf2(value) {
      return (value & (value - 1)) == 0;
    }




    //return

    return {
        gl, clear, draw,
        createProgram, createTexture, VertexShader, FragmentShader, initBuffer
    };
};