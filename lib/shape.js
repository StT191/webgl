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
    const normals = new Float32Array(size*3);

    const tmpVec = vec3.create();

    for (let i=0; i<triangles.length; i++) {

        const triangle = triangles[i];

        const normal = triangle[0][2] || vec3.getNormal(tmpVec,
            triangle[0][0],
            triangle[1][0],
            triangle[2][0]
        );

        for (let j=0; j<3; j++) {
            if (!triangle[j][2]) triangle[j][2] = normal;

            for (let k=0; k<3; k++) {
                vertices[i*9 + j*3 + k] = triangle[j][0][k];
                if (k<2) vertexTexCoords[i*6 + j*2 +k] = triangle[j][1][k];
                normals[i*9 + j*3 + k] = triangle[j][2][k];
            }
        }
    }

    return Shape(Object.assign({vertices, vertexTexCoords, normals}, attributes));
}



Shape.VerTex = function (vertixS, triangleS, attributes) {

    const triangles = Array(triangleS.length);

    for (let j=0; j<triangleS.length; j++) {

        const [corners, texCoords, normals] = triangleS[j];
        const triangle = triangles[j] = Array(3);

        for (let i=0; i<3; i++) {
            const vertix = vertixS[corners[i]];
            if (!vertix) throw new Error(`undefined index ${corners[i]} in vertices`);

            triangle[i] = [
                vertix,
                texCoords[i] || texCoords[i-1] || texCoords[i-2],
                (normals) ? normals[i] || normals[i-1] || normals[i-2] : undefined
            ];
        }
    }

    return Shape.Triangles(triangles, attributes);
}



Shape.RoTex = function(corners, segments=3, startAngle=0, stopAngle=360, rotateNormals=false, attributes) {

    const deg = Math.PI / 180;

    startAngle *= deg;
    stopAngle *= deg;
    const segAngle = (stopAngle-startAngle) / segments;

    const or = vec3.create();

    const triangles = [];

    for (let a = 0; a < segments; a++) {
        const angleA = startAngle + a*segAngle;
        const angleO = startAngle + (a+1)*segAngle;

        const dA = a/segments;
        const dO = (a+1)/segments;

        const sinA = Math.sin(angleA);
        const cosA = Math.cos(angleA);
        const sinO = Math.sin(angleO);
        const cosO = Math.cos(angleO);

        for (let i=1; i < corners.length; i++) {

            const [[x0, y0], tc0d, npd0] = corners[i-1];
            const tc0y = tc0d[1] || tc0d[0];
            const np0 = npd0[1] || npd0[0];

            const [[x1, y1], [tc1y], [np1]] = corners[i];

            const tc0 = [dA, tc0y];
            const tc1 = [dO, tc1y];

            if (x0 === 0 && x1 === 0) continue;

            const A0 = [x0 * cosA, y0, x0 * sinA];
            const A1 = [x1 * cosA, y1, x1 * sinA];
            const O0 = [x0 * cosO, y0, x0 * sinO];
            const O1 = [x1 * cosO, y1, x1 * sinO];

            const n0 = np0 || vec3.getNormal(vec3.create(), A0, (x0 === 0) ? O1 : O0, A1);
            const n1 = np1 || n0;

            const nA0 = (rotateNormals) ? vec3.rotateY(vec3.create(), n0, or, segAngle/2) : n0;
            const nA1 = (rotateNormals) ? vec3.rotateY(vec3.create(), n1, or, segAngle/2) : n1;
            const nO0 = (rotateNormals) ? vec3.rotateY(vec3.create(), n0, or, -segAngle/2) : n0;
            const nO1 = (rotateNormals) ? vec3.rotateY(vec3.create(), n1, or, -segAngle/2) : n1;

            triangles.push([
                [A0, tc0, (x0 === 0) ? n0 : nA0],
                (x0 === 0) ? [O1, tc1, nO1] : [O0, tc0, nO0],
                [A1, tc1, (x1 === 0) ? n1 : nA1]
            ]);

            if (x0 !== 0 && x1 !== 0) triangles.push([
                [O0, tc0, nO0],
                [O1, tc1, nO1],
                [A1, tc1, nA1]
            ]);
        }
    }

    return Shape.Triangles(triangles, attributes);
}