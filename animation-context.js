"use strict";

function AnimationContext(gl) {

    const renderer = gl.canvas;

    const deg = Math.PI / 180; // deg to rad


    // matrixes
    const worldMatrix = mat4.create();
    const cameraMatrix = mat4.fromTranslation(mat4.create(), [0, 0, -2000]);
    const perspectiveMatrix = mat4.create();
    const projectionMatrix = mat4.create();


    // tmp
    const tmpMat = mat4.create();


    // projection

    function updatePerspective(w=renderer.clientWidth, h=renderer.clientHeight, fov=20) {

        renderer.setAttribute("width", w);
        renderer.setAttribute("height", h);

        gl.viewport(0, 0, w, h);

        const fieldOfView = fov * deg;
        const aspect = w / h;
        const zNear = 1;
        const zFar = 2000000;

        mat4.perspective(perspectiveMatrix, fieldOfView, aspect, zNear, zFar);
    }

    function updateProjection() {
        return mat4.multiply(projectionMatrix, perspectiveMatrix, mat4.multiply(tmpMat, cameraMatrix, worldMatrix));
    }


    // camera

    function translateWorld(by) {
        return mat4.multiply(worldMatrix, mat4.fromTranslation(tmpMat, by), worldMatrix);
    }

    function revolveWorld(by) {
        return mat4.multiply(worldMatrix, mat4.fromYRotation(tmpMat, by*deg), worldMatrix);
    }

    function panWorld(by) {
        return mat4.rotateX(cameraMatrix, cameraMatrix, by*deg);
    }

    function zoomWorld(by) {
        return mat4.multiply(cameraMatrix, mat4.fromTranslation(tmpMat, [0, 0, by]), cameraMatrix);
    }

    /*function rotateCam(axis) {
        translateWorld(vec3.negate(tmpVec, mat4.getTranslation(tmpVec, viewMat)));
        mat4.multiply(viewMat, mat4.fromRotation(tmpMat, da, axis), viewMat);
        translateWorld(vec3.negate(tmpVec, tmpVec));
        return viewMat;
    }*/


    // animation

    var frame = ()=>{};

    function setRender(frameFn) {
        frame = frameFn;
    }


    var animation = false;
    var then = 0;


    function render(now) {
        if (!now) then = now = performance.now();

        const deltaAnimationTime = now - then;
        then = now;

        frame(deltaAnimationTime);

        if (animation) requestAnimationFrame(render);
    }


    function startAnimation() {
        animation = true;
        render();
    }

    function stopAnimation() {
        animation = false;
    }

    function inAnimation() {
        return animation;
    }


    // resize event
    window.addEventListener("resize", function (event) {
        updatePerspective(w, h);
        updateProjection();
        if (!animation) render();
    });


    // keyboard mappings
    const dd = 50;
    const da = 3;

    window.addEventListener("keydown", function (event) {
        switch(event.which) {
            case 65: translateWorld([-dd,   0,   0]); break; // a
            case 68: translateWorld([ dd,   0,   0]); break; // d
            case 87: translateWorld([  0,   0, -dd]); break; // w
            case 83: translateWorld([  0,   0,  dd]); break; // s
            case 81: translateWorld([  0,  dd,   0]); break; // q
            case 69: translateWorld([  0, -dd,   0]); break; // e

            case 74: revolveWorld(-da); break; // j
            case 76: revolveWorld( da); break; // l
            case 73: panWorld(-da); break; // i
            case 75: panWorld( da); break; // k
            case 85: zoomWorld(-dd); break; // u
            case 79: zoomWorld( dd); break; // o

            case 13: // Enter
            case 32: // Space

            case 80: if (animation) stopAnimation(); else startAnimation(); break; // p
        }

        updateProjection();
        if (!animation) render();
    });


    // mouse mappings

    function mousePan(event) {
        revolveWorld(event.movementX * da/10);
        panWorld(event.movementY * da/10);

        updateProjection();
        if (!animation) render();
    }

    function toggleMousePan(direction, event) {
        if (event.button === 0) switch (direction) {
            case "down": window.addEventListener("mousemove", mousePan); break;
            case "up": window.removeEventListener("mousemove", mousePan); break;
        }
    }

    renderer.addEventListener("mousedown", toggleMousePan.bind(null, "down"));
    window.addEventListener("mouseup", toggleMousePan.bind(null, "up"));

    renderer.addEventListener("wheel", function (event) {
        zoomWorld(-event.deltaY * dd);
        updateProjection();
        if (!animation) render();
    });


    // go
    updatePerspective();
    updateProjection();

    return {
        setRender, render, startAnimation, stopAnimation,
        worldMatrix, cameraMatrix, perspectiveMatrix, projectionMatrix,
        updatePerspective, updateProjection,
        translateWorld, revolveWorld, panWorld, zoomWorld
    }
}