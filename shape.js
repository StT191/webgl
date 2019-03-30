"use strict";

function Shape(triangles, texture, shade=[0.4,0.3]) {

    const dx = Shape.dx;

    // go
    const size = triangles.length * 3;
    var vertices = [], vertexTexCoords = [], normals = [];

    const tmpVec = vec3.create();

    for (let [[A, cA], [B, cB], [C, cC]] of triangles) {

        const normal = vec3.getNormal(tmpVec, A, B, C);

        vertices.push(...A, ...B, ...C);
        vertexTexCoords.push(...cA, ...cB, ...cC);
        normals.push(...normal, ...normal, ...normal);
    }

    vertices = dx.initBuffer(vertices);
    vertexTexCoords = dx.initBuffer(vertexTexCoords);
    normals = dx.initBuffer(normals);

    if (texture.constructor === Array) texture = dx.createTexture(...texture);

    return {size, vertices, texture, vertexTexCoords, normals, triangles, shade};
}


Shape.init = function (dx) {
    Shape.dx = dx;
}



