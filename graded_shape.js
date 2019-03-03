"use strict";


function VerTexShape(vertixS, texture, triangleS, shade=[0.4,0.3]) {

    const dx = VerTexShape.dx;

    const tmpV0 = vec3.create();
    const tmpV1 = vec3.create();

    const size = triangleS.length * 3;
    let vertices = [], vertexTexCoords = [], normals = [];

    for (let [corners, texCoords] of triangleS) {

        const delta1 = vec3.subtract(tmpV0, vertixS[corners[1]], vertixS[corners[0]]);
        const delta2 = vec3.subtract(tmpV1, vertixS[corners[2]], vertixS[corners[0]]);

        const normal = vec3.normalize(tmpV0, vec3.cross(tmpV0, delta1, delta2));

        for (let i=0; i<3; i++) {

            const vertix = vertixS[corners[i]];
            if (!vertix) throw new Error(`undefined index ${corners[i]} in vertices`);

            vertices.push(...vertix);

            vertexTexCoords.push(...(texCoords[i]||texCoords[i-1]||texCoords[i-2]));

            normals.push(...normal);
        }
    }

    vertices = dx.initBuffer(vertices);
    vertexTexCoords = dx.initBuffer(vertexTexCoords);
    normals = dx.initBuffer(normals);

    if (texture.constructor === Array) texture = dx.createTexture(...texture);

    return {size, vertices, texture, vertexTexCoords, normals, vertixS, texture, triangleS, shade};
}


VerTexShape.init = function (dx) {
    VerTexShape.dx = dx;
}



const gradedProgram = {
    init: function (dx) {

        Object.assign(this, dx.createProgram(
            `
                attribute vec4 aVertexPosition;
                attribute vec4 aNormal;

                attribute vec2 aTextureCoord;

                uniform sampler2D uTexture;

                uniform mat4 uProjectionMatrix;
                uniform mat4 uLightMatrix;

                varying lowp float fi;
                varying lowp vec4 vColor;

                void main(void) {
                    gl_Position  = uProjectionMatrix * aVertexPosition;

                    vColor = texture2D(uTexture, aTextureCoord);

                    vec4 lightNormal = uLightMatrix * aNormal;
                    fi = lightNormal[2];
                }
            `,
            `
                uniform lowp vec2 shade;

                varying lowp float fi;
                varying lowp vec4 vColor;

                void main(void) {
                    gl_FragColor = vColor;

                    if (shade[0] < 1.0) {
                        lowp float f = fi;

                        if (!gl_FrontFacing) f *= -1.0;

                        lowp float q = 0.1;

                        f = shade[0] + (f>0.0 ? shade[1]+(1.0-shade[1])*f : (1.0+f)*shade[1]) * (1.0-shade[0]);

                        gl_FragColor.rgb *= f;
                    }
                }
            `,
            {
                vertices: ['aVertexPosition', 3],
                vertexTexCoords: ['aTextureCoord', 2],
                normals: ['aNormal', 3],
            },
            {
                projectionMatrix: ['uProjectionMatrix', 'Matrix4fv'],
                texture: ['uTexture', 'texture0'],
                lightMatrix: ['uLightMatrix', 'Matrix4fv'],
                shade: ['shade', '2f'],
            }
        ));

        delete this.init;
    }
}
