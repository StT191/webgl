"use strict";

function parseWavObj(raw) {

    const vertices = [];
    const vertexTexCoords = [];
    const normals = [];
    const faces = [];

    for (let line of raw.split("\n")) {
        line = line.trim().split(" ");

        switch (line[0]) {
            case "v": vertices.push(line.slice(1).map(Number)); break;
            case "vt": vertexTexCoords.push(line.slice(1).map(Number)); break;
            case "vn": normals.push(line.slice(1).map(Number)); break;
            case "f": faces.push(line.slice(1).map(c => c.split("/").map(n => Number(n)-1))); break;
        }
    }

    const triangles = [];

    for (let face of faces) {
        face = face.map(([v,t,n]) => [vertices[v], vertexTexCoords[t]||[0,0], normals[n]]);
        triangles.push([face[0], face[1], face[2]]);
        if (face.length === 4) triangles.push([face[0], face[2], face[3]]);
    }

    return triangles;
}