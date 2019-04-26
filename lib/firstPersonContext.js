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


    // frame

    var frame = ()=>{};

    function setRender(frameFn) {
        frame = frameFn;
    }

    // animation

    var animation = false;


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


    // render

    var keybAnimation = false;
    var keySet = new Set();

    const dt = 20, da = 0.05, dak = 0.5;

    var then = 0;


    function render(now) {
        if (canvas.width !== canvas.clientWidth ||
            canvas.height !== canvas.clientHeight) {
            updatePerspective();
            updateProjection();
        }

        if (keySet.size) {
            for (let key of keySet) switch (key) {
                case "a": translate([ dt,   0,   0]); break;
                case "d": translate([-dt,   0,   0]); break;
                case "w": translate([  0,   0,  dt]); break;
                case "s": translate([  0,   0, -dt]); break;
                case "q": translate([  0, -dt,   0]); break;
                case "e": translate([  0,  dt,   0]); break;
                case "j": pan(-dak); break;
                case "l": pan( dak); break;
                case "i": tilt( dak); break;
                case "k": tilt(-dak); break;
            }
            updateProjection();
        }

        if (!now || !animation) then = now = performance.now();
        frame(now - then);
        then = now;

        if (animation || keybAnimation) requestAnimationFrame(render);
    }


    // resize event
    window.addEventListener("resize", function (event) {
        if (!animation) render();
    });


    // keyboard mappings

    if (options.mouseView) {

        window.addEventListener("keydown", function (event) {
            switch(event.key) {

                case "a": case "d": case "w": case "s": case "q": case "e":
                case "j": case "l": case "i": case "k":
                    keySet.add(event.key);
                    if (!keybAnimation) {
                        keybAnimation = true;
                        if (!animation) render();
                    }
                    break;

                case "Enter": case " ": case "p":
                    if (animation) stopAnimation(); else startAnimation();
                    break;
            }
        });

        window.addEventListener("keyup", function (event) {
            switch(event.key) {
                case "a": case "d": case "w": case "s": case "q": case "e":
                case "j": case "l": case "i": case "k":
                    keySet.delete(event.key);
                    if (!keySet.size) keybAnimation = false;
                    break;
            }
        });
    }

    // mouse mappings

    if (options.mouseView) {

        function onMouseMove(event) {

            pan(event.movementX * da);
            tilt(event.movementY * da);

            updateProjection();
            if (!animation && !keybAnimation) render();
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
        setRender, render, startAnimation, stopAnimation, keySet,
        translationMatrix, panMatrix, /*tiltMatrix,*/ viewMatrix, perspectiveMatrix, projectionMatrix,
        updatePerspective, updateProjection,
        translate, pan, tilt
    }
}