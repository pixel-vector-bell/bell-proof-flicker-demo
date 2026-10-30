// Customer proof watermark - the hidden screenshot layer.
//
// Each protected proof renders two stacked frames inside its .image-stage: frame A (the proof
// plus a hidden collage of face parts) and frame B (the proof minus the same collage). The eye
// averages them back to the plain proof, while a screenshot freezes one frame and comes out
// covered in the hidden layer.
//
// Without this script the CSS leaves frame B at 50% opacity, which composites to exactly the
// plain proof - so a customer with JavaScript blocked still sees a correct image.
(function () {
    "use strict";

    var running = false;
    var show = false;

    function prefersReducedMotion() {
        return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    function tick() {
        if (!running) return;

        var frames = document.querySelectorAll(".proof-frame-b");
        if (frames.length === 0) {
            // Nothing protected on screen right now (page changed); stop burning frames.
            running = false;
            document.documentElement.classList.remove("proof-flicker-active");
            return;
        }

        show = !show;
        for (var i = 0; i < frames.length; i++) {
            frames[i].setAttribute("data-proof-hidden", show ? "0" : "1");
        }

        window.requestAnimationFrame(tick);
    }

    function start() {
        if (running) return;
        if (prefersReducedMotion()) return;
        if (document.querySelectorAll(".proof-frame-b").length === 0) return;

        running = true;
        document.documentElement.classList.add("proof-flicker-active");
        window.requestAnimationFrame(tick);
    }

    // Blazor Server swaps the gallery in after the first render, so watch for it instead of
    // relying on DOMContentLoaded alone.
    function observe() {
        start();
        if (!window.MutationObserver) return;
        var observer = new MutationObserver(function () { start(); });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", observe);
    } else {
        observe();
    }

    // Pause while the tab is in the background - no point animating what nobody is looking at.
    document.addEventListener("visibilitychange", function () {
        if (document.hidden) {
            running = false;
            document.documentElement.classList.remove("proof-flicker-active");
        } else {
            start();
        }
    });

    window.bellProofFlicker = { start: start };
})();
