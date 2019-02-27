"use strict";


function GradedShape(vertixS, texture, triangleS, minShade = 0.06) {

    const dx = GradedShape.dx;

    const tmpV0 = vec3.create();
    const tmpV1 = vec3.create();

    const size = triangleS.length * 3;
    let vertices = [], vertexTexCoords = [], normals = [];

    for (let [corners, texCoords] of triangleS) {

        const delta1 = vec3.subtract(tmpV0, vertixS[corners[1]], vertixS[corners[0]]);
        const delta2 = vec3.subtract(tmpV1, vertixS[corners[2]], vertixS[corners[0]]);

        const normal = vec3.normalize(tmpV0, vec3.cross(tmpV0, delta1, delta2));

        if (vec3.dot(normal, vertixS[corners[0]]) < 0) vec3.negate(normal, normal);


        for (let i=0; i<3; i++) {

            const vertix = vertixS[corners[i]];
            if (!vertix) throw new Error(`undefined index ${corners[i]} in vertices`);

            vertices.push(...vertix);

            vertexTexCoords.push(...texCoords[i]);

            normals.push(...normal);
        }
    }

    vertices = dx.initBuffer(vertices);
    vertexTexCoords = dx.initBuffer(vertexTexCoords);
    normals = dx.initBuffer(normals);

    if (texture.constructor === Array) texture = dx.createTexture(...texture);

    return {size, vertices, texture, vertexTexCoords, normals, vertixS, texture, triangleS, minShade};
}


GradedShape.init = function (dx) {
    GradedShape.dx = dx;
}




const gradedProgram = {
    init: function (dx) {

        Object.assign(this, dx.createProgram(
            `
                attribute vec4 aVertexPosition;
                attribute vec2 aTextureCoord;
                attribute vec4 aNormal;

                uniform sampler2D uTexture;

                uniform mat4 uProjectionMatrix;
                uniform mat4 uNormalMatrix;

                uniform float minShade;

                varying lowp vec4 vColor;

                void main(void) {
                    gl_Position  = uProjectionMatrix * aVertexPosition;

                    vColor = texture2D(uTexture, aTextureCoord);

                    if (minShade < 1.0) {
                        vec4 normal = uNormalMatrix * aNormal;

                        float f = normal[2];

                        f = minShade + (1.0-minShade) * (1.0+f)/2.0;

                        vColor[0] *= f;
                        vColor[1] *= f;
                        vColor[2] *= f;
                    }
                }

            `,
            `
                varying lowp vec4 vColor;

                void main(void) {
                    gl_FragColor = vColor;
                }
            `,
            {
                vertices: ['aVertexPosition', 3],
                vertexTexCoords: ['aTextureCoord', 2],
                normals: ['aNormal', 3],
            },
            {
                projectionMatrix: ['uProjectionMatrix', 'mat4'],
                texture: ['uTexture', 'texture0'],
                normalMatrix: ['uNormalMatrix', 'mat4'],
                minShade: ['minShade', 'float'],
            }
        ));

        delete this.init;
    }
}
