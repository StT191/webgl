"use strict";

function AnimationContext(gl, options) {

    const canvas = gl.canvas;

    const deg = Math.PI / 180; // deg to rad


    // matrixes
    const translationMatrix = mat4.create();
    const panMatrix = mat4.create();
    //const tiltMatrix = mat4.create();
    var tiltValue = 0;
    const viewMatrix = mat4.create();
    const perspectiveMatrix = mat4.create();
    const projectionMatrix = mat4.create();


    // tmp
    const tmpMat = mat4.create();


    // projection

    function updatePerspective(w=canvas.clientWidth, h=canvas.clientHeight, fov=20) {

        canvas.setAttribute("width", w);
        canvas.setAttribute("height", h);

        gl.viewport(0, 0, w, h);

        const fieldOfView = fov * deg;
        const aspect = w / h;
        const zNear = 1;
        const zFar = 2000000;

        mat4.perspective(perspectiveMatrix, fieldOfView, aspect, zNear, zFar);
    }

    function updateProjection() {
        mat4.multiply(viewMatrix, panMatrix, translationMatrix)
        mat4.apply(viewMatrix, viewMatrix, mat4.rotateX, tiltValue*deg);
        return mat4.multiply(projectionMatrix, perspectiveMatrix, viewMatrix);
    }


    // camera

    function translate(by) {
        return mat4.with(translationMatrix, translationMatrix, panMatrix, mat4.translate, by);
    }


    function pan(by) {
        mat4.rotateY(panMatrix, panMatrix, by*deg);
    }

    function tilt(by) {
        tiltValue += by;
        if (tiltValue > 90) tiltValue = 90;
        if (tiltValue < -90) tiltValue = -90;
    }


    // move to a good spot
    translate([0, 0, -2000]);


    // animation

    var frame = ()=>{};

    function setRender(frameFn) {
        frame = frameFn;
    }


    var animation = false;
    var then = 0;


    function render(now) {
        if (canvas.width !== canvas.clientWidth ||
            canvas.height !== canvas.clientHeight) {
            updatePerspective();
            updateProjection();
        }

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
        if (!animation) render();
    });


    // keyboard mappings
    const dd = 50;

    if (options.keyboardView) window.addEventListener("keydown", function (event) {
        switch(event.key) {
            case "a": translate([ dd,   0,   0]); break;
            case "d": translate([-dd,   0,   0]); break;
            case "w": translate([  0,   0,  dd]); break;
            case "s": translate([  0,   0, -dd]); break;
            case "q": translate([  0, -dd,   0]); break;
            case "e": translate([  0,  dd,   0]); break;

            /*case "j": revolveWorld(-da); break;
            case "l": revolveWorld( da); break;
            case "i": panWorld(-da); break;
            case "k": panWorld( da); break;
            case "u": zoomWorld(-dd); break;
            case "o": zoomWorld( dd); break;*/

            case "Enter":
            case " ":
            case "p": if (animation) stopAnimation(); else startAnimation(); break; // p
        }

        updateProjection();
        if (!animation) render();
    });


    // mouse mappings
    const da = 1/10;

    if (options.mouseView) {

        function onMouseMove(event) {

            pan(event.movementX * da);
            tilt(event.movementY * da);

            updateProjection();
            if (!animation) render();
        }

        canvas.addEventListener("mouseup", function () {
            if (document.pointerLockElement !== canvas)
                canvas.requestPointerLock();
            else
                document.exitPointerLock();
        });

        document.addEventListener('pointerlockchange', function() {
             if (document.pointerLockElement === canvas)
                window.addEventListener("mousemove", onMouseMove);
             else
                window.removeEventListener("mousemove", onMouseMove);
        });

        /*canvas.addEventListener("wheel", function (event) {
            zoomWorld(-event.deltaY * dd);
            updateProjection();
            if (!animation) render();
        });*/
    }


    // go
    updatePerspective();
    updateProjection();

    return {
        setRender, render, startAnimation, stopAnimation,
        translationMatrix, panMatrix, /*tiltMatrix,*/ viewMatrix, perspectiveMatrix, projectionMatrix,
        updatePerspective, updateProjection,
        translate, pan, tilt
    }
}