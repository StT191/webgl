"use strict";

const fs = require("fs");


// go

const raw = fs.readFileSync("deer.obj", "utf8");


// parse data
const vertices = [];
const faces = [];

for (let line of raw.split("\n")) {
    line = line.trim().split(" ");

    switch (line[0]) {
        case "v": vertices.push(line.slice(1).map(Number)); break;
        case "f": faces.push(line.slice(1).map(c => c.split("/").map(Number))); break;
    }
}

// build triangles

const triangles = faces.map(f => f.map(c => [vertices[c[0]-1], [1,1]]));

// export
// fs.writeFileSync("deer.json", JSON.stringify(triangles, null, 4));

const str = `const deer = [
    ${triangles.map(JSON.stringify).join(",\n    ")}
];`;

fs.writeFileSync("deer.js", str);