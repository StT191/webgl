"use strict";





function initBuffers(gl) {

    const positions = [
        // Front face
        -1.0, -1.0,  1.0,
         1.0, -1.0,  1.0,
         1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,

        // Back face
        -1.0, -1.0, -1.0,
        -1.0,  1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0, -1.0, -1.0,

        // Top face
        -1.0,  1.0, -1.0,
        -1.0,  1.0,  1.0,
         1.0,  1.0,  1.0,
         1.0,  1.0, -1.0,

        // Bottom face
        -1.0, -1.0, -1.0,
         1.0, -1.0, -1.0,
         1.0, -1.0,  1.0,
        -1.0, -1.0,  1.0,

        // Right face
         1.0, -1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0,  1.0,  1.0,
         1.0, -1.0,  1.0,

        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0,  1.0,
        -1.0,  1.0,  1.0,
        -1.0,  1.0, -1.0,
    ];

    const positionBuffer = initBuffer(gl, positions);


    const colors = [
        1.0,  1.0,  0.0,  1.0,    // yellow
        1.0,  0.0,  0.0,  1.0,    // red
        0.0,  1.0,  0.0,  1.0,    // green
        0.0,  0.0,  1.0,  1.0,    // blue
    ];

    const clordings = ([]).concat(colors, colors, colors, colors, colors, colors);

    const colorBuffer = initBuffer(gl, clordings);



    const indices = [
        //0,  1,  2,      0,  2,  3,    // front
        //4,  5,  6,      4,  6,  7,    // back
        8,  9,  10,     8,  10, 11,   // top
        12, 13, 14,     12, 14, 15,   // bottom
        16, 17, 18,     16, 18, 19,   // right
        20, 21, 22,     20, 22, 23,   // left
    ];

    // Now send the element array to GL
    const indexBuffer = initBuffer(gl, indices, "ELEMENT_ARRAY_BUFFER");


    return { position: positionBuffer, color: colorBuffer, indices: indexBuffer };
}


function drawScene(gl, programInfo, buffers, deltaTime) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

    // Clear the canvas before we start drawing on it.

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    gl.useProgram(programInfo.program);



    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);


    initAttrPointer(gl, buffers.position, programInfo.attribLocations.vertexPosition, 3);
    // initAttrPointer(gl, buffers.color, programInfo.attribLocations.vertexColor, 4);
    // initAttrPointer(gl, buffers.normal, programInfo.attribLocations.vertexNormal, 3);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);


    {
        // const offset = 0;
        // const vertexCount = 4;
        // gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);

        const vertexCount = 24;
        const type = gl.UNSIGNED_SHORT;
        const offset = 0;
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }
}