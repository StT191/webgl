"use strict";

const fs = require("fs");


// go

const raw = fs.readFileSync("a380.obj", "utf8");


// parse data
const vertices = [];
const faces = [];

for (let line of raw.split("\n")) {
    line = line.trim().split(" ");

    switch (line[0]) {
        case "v": vertices.push(line.slice(1, 4).map(Number)); break;
        case "f": faces.push(line.slice(1, 5).map(c => c.split("/").map(Number))); break;
    }
}

// build triangles

// const triangles = faces.map(f => f.map(c => [vertices[c[0]/*-1*/], [1,1]]));


function flatten (outA, inA) {
    if (Array.isArray(inA)) inA.reduce(flatten, outA);
    else outA.push(inA);
    return outA;
}

const fVertices = Float32Array.from(flatten([], vertices));
const iFaces = Uint32Array.from(flatten([], faces.map(f => f.map(c => c[0]-1))));

const head = Uint32Array.from([fVertices.byteLength, 0, iFaces.byteLength]);

const data = Buffer.concat(([head, fVertices, iFaces]).map(b=>Buffer.from(b.buffer)));

fs.writeFileSync("a380.raw", data);


// console.log(triangles);
// export
// fs.writeFileSync("deer.json", JSON.stringify(triangles, null, 4));

/*const str = `const mx = [
    ${triangles.map(JSON.stringify).join(",\n    ")}
];`;

fs.writeFileSync("mx.js", str);*/