"use strict";


function RoTexShape(corners, texture, segments=3, startAngle=0, stopAngle=360, shade=[0.4,0.3]) {

    const deg = Math.PI / 180;
    const dx = RoTexShape.dx;

    const tmpVec = vec3.create();

    var vertices = [], vertexTexCoords = [], normals = [];

    startAngle *= deg;
    stopAngle *= deg;
    const segAngle = (stopAngle-startAngle) / segments;

    var size = 0;

    for (let a = 0; a < segments; a++) {

        const sinA = Math.sin(a*segAngle);
        const cosA = Math.cos(a*segAngle);
        const sinO = Math.sin((a+1)*segAngle);
        const cosO = Math.cos((a+1)*segAngle);

        for (let i=1; i < corners.length; i++) {

            const [x0, y0, tc0d] = corners[i-1];
            const tc0 = tc0d[1] || tc0d[0];

            const [x1, y1, [tc1]] = corners[i];

            if (x0 === 0 && x1 === 0) continue;

            const A0 = [x0 * cosA, y0, x0 * sinA];
            const A1 = [x1 * cosA, y1, x1 * sinA];
            const O0 = [x0 * cosO, y0, x0 * sinO];
            const O1 = [x1 * cosO, y1, x1 * sinO];

            let thisSize, normal;

            if (x0 === 0) normal = vec3.getNormal(tmpVec, A0, O1, A1);
            else  normal = vec3.getNormal(tmpVec, A0, O0, A1);

            vertices.push(...A0); vertexTexCoords.push(...tc0);

            if (x0 === 0) { vertices.push(...O1); vertexTexCoords.push(...tc1); }
            else { vertices.push(...O0); vertexTexCoords.push(...tc0); }

            vertices.push(...A1); vertexTexCoords.push(...tc1);

            if (x0 === 0 || x1 === 0) thisSize = 3;
            else {
                thisSize = 6;

                vertices.push(...O0); vertexTexCoords.push(...tc0);
                vertices.push(...O1); vertexTexCoords.push(...tc1);
                vertices.push(...A1); vertexTexCoords.push(...tc1);
            }

            size += thisSize;

            for (let n=0; n<thisSize; n++) normals.push(...normal);
        }
    }

    vertices = dx.initBuffer(vertices);
    vertexTexCoords = dx.initBuffer(vertexTexCoords);
    normals = dx.initBuffer(normals);

    if (texture.constructor === Array) texture = dx.createTexture(...texture);

    return {size, vertices, texture, vertexTexCoords, normals, corners, segments, startAngle, stopAngle, shade};
}


RoTexShape.init = function (dx) {
    RoTexShape.dx = dx;
}