"use strict";

function Shape(attributes={}) {

    const dx = Shape.dx;

    var {vertices, vertexTexCoords, normals} = attributes;

    const size = vertices.length / 3;

    if (!normals) {

        normals = new Float32Array(vertices.length);

        const tmpVec = vec3.create();

        for (let n=0; n<vertices.length; n+=9) {

            const normal = vec3.getNormal(tmpVec,
                vertices.subarray(n+0, n+3),
                vertices.subarray(n+3, n+6),
                vertices.subarray(n+6, n+9)
            );

            for (let i=0; i<3; i++) for (let j=0; j<3; j++)
                normals[n + i*3 + j] = normal[j];
        }
    }

    vertices = dx.Buffer(vertices);
    vertexTexCoords = dx.Buffer(vertexTexCoords);
    normals = dx.Buffer(normals);

    return Object.assign({shade: [0.3, 0.4]}, attributes, {size, vertices, vertexTexCoords, normals});
}


Shape.init = function (dx) {
    Shape.dx = dx;
}


Shape.Triangles = function (triangles, attributes) {

    const size = triangles.length * 3;

    const vertices = new Float32Array(size*3);
    const vertexTexCoords = new Float32Array(size*2);

    for (let i=0; i<triangles.length; i++) {

        const triangle = triangles[i];

        for (let j=0; j<3; j++) for (let k=0; k<3; k++) {
            vertices[i*9 + j*3 + k] = triangle[j][0][k];
            if (k<2) vertexTexCoords[i*6 + j*2 +k] = triangle[j][1][k];
        }
    }

    return Shape(Object.assign({vertices, vertexTexCoords}, attributes));
}


Shape.VerTex = function (vertixS, triangleS, attributes) {

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

    return Shape.Triangles(triangles, attributes);
}


Shape.RoTex = function(corners, segments=3, startAngle=0, stopAngle=360, attributes) {

    const deg = Math.PI / 180;

    startAngle *= deg;
    stopAngle *= deg;
    const segAngle = (stopAngle-startAngle) / segments;

    const triangles = [];

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

            triangles.push([
                [A0, tc0],
                (x0 === 0) ? [O1, tc1] : [O0, tc0],
                [A1, tc1]
            ]);

            if (x0 !== 0 && x1 !== 0) triangles.push([
                [O0, tc0], [O1, tc1], [A1, tc1]
            ]);
        }
    }

    return Shape.Triangles(triangles, attributes);
}