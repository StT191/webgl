"use strict";

const gradedProgram = {
    init: function (dx) {

        Object.assign(this, dx.Program(
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
