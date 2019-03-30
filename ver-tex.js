"use strict";

function VerTex(vertixS, triangleS) {

    const triangles = [];

    for (let [corners, texCoords] of triangleS) {

        const triangle = [];

        for (let i=0; i<3; i++) {

            const vertix = vertixS[corners[i]];
            if (!vertix) throw new Error(`undefined index ${corners[i]} in vertices`);

            triangle.push([vertix, texCoords[i] || texCoords[i-1] || texCoords[i-2]]);
        }

        triangles.push(triangle);
    }

    return triangles;
}
