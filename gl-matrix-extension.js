"use strict";

// add functionality to gl-matrix
{

    // getRotationMatrix
    const tVec = vec3.create();

    mat4.getRotationMatrix = function(out, mat) {
        mat4.scale(out, mat, vec3.inverse(tVec, mat4.getScaling(tVec, mat)));
        out[12] = out[13] = out[14] = 0;
        return out;
    }


    // apply
    const taMat = mat4.create();

    mat4.apply = function(out, mat, transform, ...args) {
        return mat4.multiply(out, transform(taMat, mat4.identity(taMat), ...args), mat);
    }


    // transformation within another
    const twMat = mat4.create();
    const tiMat = mat4.create();

    mat4.with = function(out, mat, withMat, transform, ...args) {
        mat4.multiply(twMat, withMat, mat);

        mat4.apply(twMat, twMat, transform, ...args);

        return mat4.multiply(out, mat4.invert(tiMat, withMat), twMat);
    }


    // get normal
    const tmpV0 = vec3.create();
    const tmpV1 = vec3.create();

    vec3.getNormal = function (out, vecA, vecB, vecC) {
        return vec3.normalize(out, vec3.cross(tmpV0,
            vec3.subtract(tmpV0, vecB, vecA),
            vec3.subtract(tmpV1, vecC, vecA)
        ));
    }
}