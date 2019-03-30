"use strict";

function RoTex(corners, segments=3, startAngle=0, stopAngle=360) {

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

    return triangles;
}