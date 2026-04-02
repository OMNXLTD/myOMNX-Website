// ---- OMGO Simulation Script ----
(() => {
    const section = document.querySelector(".section--try-omgo");
    if (!section) return;

    if (window.__OMGO_SIM_STARTED) return;
    window.__OMGO_SIM_STARTED = false;

    const start = () => {
        if (window.__OMGO_SIM_STARTED) return;
        window.__OMGO_SIM_STARTED = true;


        const root = document.querySelector("[data-try-omgo]");
        if (!root) return;

        const scene = root.querySelector("[data-omgo-scene]");
        const heroImg = scene?.querySelector(".omgo-scene__img");
        const ledsHost = root.querySelector("[data-leds-src]");
        const hotspot = root.querySelector("[data-omgo-hotspot]");

        function makeHotspotAnchor({ scene, heroImg, ledsHost, hotspot }) {
            const TARGET_ID = "#omgoHotspotTarget";
            let raf = 0;

            const readFitIsCover = () => {
                const fit = heroImg ? getComputedStyle(heroImg).objectFit : "cover";
                return fit === "cover";
            };

            const position = () => {
                raf = 0;

                const svg = ledsHost.querySelector("svg");
                const target = svg?.querySelector(TARGET_ID);
                if (!svg || !target) return;

                const sceneRect = scene.getBoundingClientRect();
                const svgRect = svg.getBoundingClientRect();

                const vb = svg.viewBox?.baseVal;
                if (!vb || !vb.width || !vb.height) return;

                const cx = parseFloat(target.getAttribute("cx") || "0");
                const cy = parseFloat(target.getAttribute("cy") || "0");
                const r = parseFloat(target.getAttribute("r") || "40");

                const isCover = readFitIsCover();
                const vbW = vb.width, vbH = vb.height;

                const scale = isCover
                    ? Math.max(svgRect.width / vbW, svgRect.height / vbH)
                    : Math.min(svgRect.width / vbW, svgRect.height / vbH);

                const drawnW = vbW * scale;
                const drawnH = vbH * scale;

                const offX = isCover ? (drawnW - svgRect.width) / 2 : (svgRect.width - drawnW) / 2;
                const offY = isCover ? (drawnH - svgRect.height) / 2 : (svgRect.height - drawnH) / 2;

                const xInSvg = isCover ? (cx * scale - offX) : (offX + cx * scale);
                const yInSvg = isCover ? (cy * scale - offY) : (offY + cy * scale);

                const x = (svgRect.left - sceneRect.left) + xInSvg;
                const y = (svgRect.top - sceneRect.top) + yInSvg;

                // Apply (slightly inflate for easier tapping)
                const hit = (r * scale) * 2 * 1.15; // 15% bigger than SVG circle
                hotspot.style.left = `${x}px`;
                hotspot.style.top = `${y}px`;
                hotspot.style.width = `${hit}px`;
                hotspot.style.height = `${hit}px`;
            };

            const schedule = () => {
                if (raf) return;
                raf = requestAnimationFrame(position);
            };

            const onResize = () => schedule();

            const attach = () => {
                schedule();
                window.addEventListener("resize", onResize, { passive: true });
                window.visualViewport?.addEventListener("resize", onResize, { passive: true });
                heroImg?.addEventListener("load", onResize);
            };

            const detach = () => {
                if (raf) cancelAnimationFrame(raf);
                raf = 0;
                window.removeEventListener("resize", onResize);
                window.visualViewport?.removeEventListener("resize", onResize);
                heroImg?.removeEventListener("load", onResize);
            };

            return { attach, detach, schedule };
        }

        const modeEl = root.querySelector("[data-try-mode]");
        const tipEl = root.querySelector("[data-try-tip]");
        const shakeBtn = root.querySelector("[data-try-shake]");
        const stopBtn = root.querySelector("[data-try-stop]");

        function syncHeroUrl() {
            if (!heroImg) return;
            const url = heroImg.currentSrc || heroImg.src;
            if (url) scene.style.setProperty("--hero-url", `url("${url}")`);
        }
        syncHeroUrl();
        heroImg?.addEventListener("load", syncHeroUrl);

        if (!scene || !ledsHost || !hotspot || !modeEl || !shakeBtn) return;

        // Inline SVG so CSS can target #led1/#led2/#led3 and we can inject a glow gradient.
        async function inlineSvg(host) {
            const src = host.getAttribute("data-leds-src");
            if (!src) return;

            const res = await fetch(src);
            const text = await res.text();
            if (!text.includes("<svg")) return;

            host.innerHTML = text;

            const svg = host.querySelector("svg");
            if (!svg) return;

            // Make SVG behave like the hero image (cover vs contain) so LEDs stay perfectly aligned.
            const fit = heroImg ? getComputedStyle(heroImg).objectFit : "contain";
            svg.setAttribute("preserveAspectRatio", fit === "cover" ? "xMidYMid slice" : "xMidYMid meet");

            // Ensure a viewBox exists (Illustrator exports sometimes omit it); without it, scaling can drift.
            if (!svg.getAttribute("viewBox")) {
                const wAttr = (svg.getAttribute("width") || "").replace(/[^\d.]/g, "");
                const hAttr = (svg.getAttribute("height") || "").replace(/[^\d.]/g, "");
                const w = parseFloat(wAttr) || (heroImg?.naturalWidth || 1000);
                const h = parseFloat(hAttr) || (heroImg?.naturalHeight || 1000);
                svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
            }

            // Let CSS size it; keep internal coordinates via viewBox.
            svg.removeAttribute("width");
            svg.removeAttribute("height");


            let defs = svg.querySelector("defs");
            if (!defs) {
                defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
                svg.insertBefore(defs, svg.firstChild);
            }

            // Radial glow gradient that uses CSS var(--led-color)
            if (!svg.querySelector("#omgoLedGlow")) {
                const grad = document.createElementNS("http://www.w3.org/2000/svg", "radialGradient");
                grad.setAttribute("id", "omgoLedGlow");
                grad.setAttribute("cx", "50%");
                grad.setAttribute("cy", "50%");
                grad.setAttribute("r", "60%");

                const mkStop = (offset, opacity) => {
                    const s = document.createElementNS("http://www.w3.org/2000/svg", "stop");
                    s.setAttribute("offset", offset);
                    s.setAttribute("stop-color", "var(--led-color, #fff)");
                    s.setAttribute("stop-opacity", String(opacity));
                    return s;
                };

                grad.appendChild(mkStop("0%", 1));
                grad.appendChild(mkStop("45%", 0.55));
                grad.appendChild(mkStop("100%", 0));

                defs.appendChild(grad);
            }
        }

        function positionHotspotFromSvg() {
            if (!scene || !hotspot || !ledsHost) return;

            const svg = ledsHost.querySelector("svg");
            const target = svg?.querySelector("#omgoHotspotTarget");
            if (!svg || !target) return;

            const sceneRect = scene.getBoundingClientRect();
            const svgRect = svg.getBoundingClientRect();

            // cx/cy/r from SVG (viewBox coordinates)
            const cx = parseFloat(target.getAttribute("cx") || "0");
            const cy = parseFloat(target.getAttribute("cy") || "0");
            const r = parseFloat(target.getAttribute("r") || "40");

            const vb = svg.viewBox?.baseVal;
            if (!vb || !vb.width || !vb.height) return;

            const vbW = vb.width;
            const vbH = vb.height;

            // Decide cover vs contain based on the hero image
            const fit = heroImg ? getComputedStyle(heroImg).objectFit : "cover";
            const isCover = fit === "cover";

            // Scale (same rule as preserveAspectRatio slice/meet)
            const scale = isCover
                ? Math.max(svgRect.width / vbW, svgRect.height / vbH)  // cover (slice)
                : Math.min(svgRect.width / vbW, svgRect.height / vbH); // contain (meet)

            const drawnW = vbW * scale;
            const drawnH = vbH * scale;

            // Offsets:
            // - cover: image is bigger than box, so we subtract the cropped part
            // - contain: image is smaller than box, so we add the letterbox margins
            const offX = isCover
                ? (drawnW - svgRect.width) / 2
                : (svgRect.width - drawnW) / 2;

            const offY = isCover
                ? (drawnH - svgRect.height) / 2
                : (svgRect.height - drawnH) / 2;

            // Convert viewBox coords -> position inside svgRect
            const xInSvg = isCover ? (cx * scale - offX) : (offX + cx * scale);
            const yInSvg = isCover ? (cy * scale - offY) : (offY + cy * scale);
            const rPx = r * scale;

            // Convert svgRect space -> scene space (safe even if tiny rounding differences exist)
            const x = (svgRect.left - sceneRect.left) + xInSvg;
            const y = (svgRect.top - sceneRect.top) + yInSvg;

            // Apply
            hotspot.style.left = `${x}px`;
            hotspot.style.top = `${y}px`;

            // Make target size match your SVG r (feel free to multiply by 1.1–1.4 for easier tapping)
            hotspot.style.width = `${rPx * 2}px`;
            hotspot.style.height = `${rPx * 2}px`;
        }

        const states = {
            0: { id: 0, label: "Off", vib: null, tip: "Tip: Tap the spade button to start." },
            1: { id: 1, label: "Speed 1", vib: { speed: "240ms" }, tip: "Tip: Tap again for stronger." },
            2: { id: 2, label: "Speed 2", vib: { speed: "105ms" }, tip: "Tip: Tap again for stronger." },
            3: { id: 3, label: "Speed 3", vib: { speed: "75ms" }, tip: "Tip: Tap again for the MAX mode." },
            4: { id: 4, label: "Speed MAX", vib: { speed: "45ms" }, tip: "Tip: Tap again for Pulse mode." },
            5: { id: 5, label: "Pulse Mode", vib: null, tip: "Tip: Tap the record button to capture a rhythm (10s)." },
        };

        let stateId = 0;

        // Pulse mode sub-state
        const RECORD_MS = 10_000;
        const PAD_MS = 250; // silence before/after playback window when recording stops early
        let pulsePhase = "idle"; // "idle" | "recording" | "playback"
        let recordStart = 0;
        let recordTaps = [];
        let recordTick = null;

        let savedPattern = null;
        let savedLoopMs = RECORD_MS + PAD_MS * 2;

        let pulseImpulseCleanup = null;
        let playbackLoop = null;
        let playbackTimeouts = [];

        let shakeCleanupTimer = null;

        function setTip(text) {
            if (tipEl) tipEl.textContent = text || "";
        }

        function setShakeButton(label, { disabled = false, salmon = false } = {}) {
            shakeBtn.textContent = label;
            shakeBtn.disabled = disabled;
            shakeBtn.classList.toggle("is-salmon", !!salmon && !disabled);
        }

        function setRecordingUI(on) {
            root.classList.toggle("is-recording", !!on);
        }

        function stopContinuousVibration() {
            scene.classList.remove("is-vibrating");
            scene.style.removeProperty("--vib-speed");
            scene.style.removeProperty("--vib-amp");
            scene.style.removeProperty("--vib-rot");
        }

        function setContinuousVibration(speed) {
            scene.classList.add("is-vibrating");
            scene.style.setProperty("--vib-speed", speed);
        }

        function tapVibrationImpulse() {
            // A short, punchy impulse so the user can clearly see a “pulse”.
            scene.classList.add("is-vibrating");
            scene.style.setProperty("--vib-speed", "62ms");
            scene.style.setProperty("--vib-amp", "5px");
            scene.style.setProperty("--vib-rot", "1.2deg");

            if (pulseImpulseCleanup) clearTimeout(pulseImpulseCleanup);
            pulseImpulseCleanup = window.setTimeout(() => {
                // Only stop if we're still in pulse playback (continuous modes handle their own vibration)
                if (stateId === 5 && pulsePhase === "playback") stopContinuousVibration();
            }, 220);
        }

        function triggerShakeImpulse() {
            // IMPORTANT: `is-shaking` sets CSS `animation:` too; if it stays on, it overrides vibration.
            scene.classList.remove("is-shaking");
            void scene.offsetWidth;
            scene.classList.add("is-shaking");

            if (shakeCleanupTimer) clearTimeout(shakeCleanupTimer);
            shakeCleanupTimer = window.setTimeout(() => {
                scene.classList.remove("is-shaking");
            }, 360);
        }

        function clearPlayback() {
            if (playbackLoop) {
                clearTimeout(playbackLoop);
                playbackLoop = null;
            }
            playbackTimeouts.forEach((t) => clearTimeout(t));
            playbackTimeouts = [];
        }

        function normalizeTaps(taps, maxMs = RECORD_MS) {
            const sorted = [...taps]
                .filter((t) => Number.isFinite(t) && t >= 0 && t < maxMs)
                .sort((a, b) => a - b);

            const out = [];
            let last = -999;
            for (const t of sorted) {
                if (t - last < 120) continue;
                out.push(t);
                last = t;
            }
            return out;
        }

        function startPlayback(pattern, loopMs = RECORD_MS + PAD_MS * 2) {
            clearPlayback();

            if (!pattern || pattern.length === 0) {
                pulsePhase = "idle";
                scene.dataset.pulse = "idle";
                stopContinuousVibration();
                setTip("Tip: No rhythm recorded. Tap “Start recording” and add a few shakes.");
                setShakeButton("Start recording", { disabled: false, salmon: true });
                return;
            }

            pulsePhase = "playback";
            scene.dataset.pulse = "playback";
            setTip("Tip: Playing your rhythm. Tap “Start recording” to record again.");
            setShakeButton("Record again", { disabled: false, salmon: true });

            const scheduleOneLoop = () => {
                // schedule each pulse inside the loop window
                playbackTimeouts = pattern
                    .filter((ms) => ms >= 0 && ms < loopMs)
                    .map((ms) =>
                        setTimeout(() => {
                            if (stateId !== 5 || pulsePhase !== "playback") return;
                            tapVibrationImpulse();
                        }, ms)
                    );

                playbackLoop = setTimeout(() => {
                    if (stateId !== 5 || pulsePhase !== "playback") return;
                    scheduleOneLoop();
                }, loopMs);
            };

            scheduleOneLoop();
        }

        function stopRecording({ startPlaybackAfter = true, save = true } = {}) {
            if (recordTick) {
                clearInterval(recordTick);
                recordTick = null;
            }

            setRecordingUI(false);
            hotspot.disabled = false;

            const elapsed = performance.now() - recordStart;
            const windowMs = Math.max(0, Math.min(RECORD_MS, elapsed));

            const normalized = normalizeTaps(recordTaps, windowMs);

            // If user didn’t tap anything, keep previous saved pattern (if any) and just go idle.
            if (save && normalized.length > 0) {
                savedPattern = normalized.map((t) => t + PAD_MS); // add pre-silence
                savedLoopMs = windowMs + PAD_MS * 2;              // pre + post silence
            }

            recordTaps = [];

            pulsePhase = "idle";
            scene.dataset.pulse = "idle";

            if (startPlaybackAfter) startPlayback(savedPattern, savedLoopMs);
            else {
                setShakeButton("Start recording", { disabled: false, salmon: true });
                setTip("Tip: Tap the record button to capture a rhythm (10s).");
            }
        }

        function startRecording() {
            clearPlayback();

            pulsePhase = "recording";
            scene.dataset.pulse = "recording";

            recordStart = performance.now();
            recordTaps = [];

            hotspot.disabled = true;
            stopContinuousVibration();
            setRecordingUI(true);

            setTip("Recording… tap “Shake me” to set your rhythm.");
            setShakeButton("Shake me (10s)", { disabled: false, salmon: false });

            recordTick = setInterval(() => {
                const elapsed = performance.now() - recordStart;
                const remaining = Math.max(0, RECORD_MS - elapsed);
                const sec = Math.ceil(remaining / 1000);
                shakeBtn.textContent = `Shake me (${sec}s)`;

                if (remaining <= 0) stopRecording({ startPlaybackAfter: true });
            }, 120);
        }

        function applyState() {
            const s = states[stateId];
            scene.dataset.state = String(s.id);
            modeEl.textContent = s.label;

            // Leaving pulse mode: stop any pulse activity, but KEEP the last saved recording until page reload.
            if (s.id !== 5) {
                if (pulsePhase === "recording") {
                    // user scrolled/clicked away mid-recording → discard partial
                    stopRecording({ startPlaybackAfter: false, save: false });
                } else {
                    setRecordingUI(false);
                    hotspot.disabled = false;
                    clearPlayback();
                    pulsePhase = "idle";
                    scene.dataset.pulse = "idle";
                }
            } else {
                scene.dataset.pulse = pulsePhase;
            }

            setTip(s.tip);

            if (s.vib?.speed) setContinuousVibration(s.vib.speed);
            else stopContinuousVibration();

            // Button availability
            if (s.id !== 5) {
                setShakeButton("Start recording", { disabled: true });
            } else {
                if (pulsePhase === "recording") {
                    setShakeButton("Shake me (10s)", { disabled: false });
                    setTip("Recording… tap “Shake me” to set your rhythm.");
                } else if (pulsePhase === "playback") {
                    setShakeButton("Record again", { disabled: false, salmon: true });
                    setTip("Tip: Playing your rhythm. Tap “Start recording” to record again.");
                } else {
                    setShakeButton("Start recording", { disabled: false, salmon: true });
                    setTip("Tip: Tap the record button to capture a rhythm (10s).");
                }

                // If the user already recorded a rhythm earlier, resume it when re-entering Mode 5.
                if (s.id === 5 && pulsePhase === "idle" && savedPattern && savedPattern.length) {
                    startPlayback(savedPattern, savedLoopMs);
                }
            }
        }

        function nextState() {
            if (stateId === 0) stateId = 1;
            else {
                stateId += 1;
                if (stateId > 5) stateId = 1;
            }
            applyState();
        }

        function stopNow() {
            stateId = 0;
            scene.classList.remove("is-shaking");
            applyState();
        }

        // Hotspot long press
        let longPressTimer = null;
        let longPressed = false;

        hotspot.addEventListener("pointerdown", (e) => {
            e.preventDefault();
            if (hotspot.disabled) return;

            longPressed = false;
            longPressTimer = window.setTimeout(() => {
                longPressed = true;
                stopNow();
            }, 380);
        });

        hotspot.addEventListener("pointerup", (e) => {
            e.preventDefault();
            if (hotspot.disabled) return;

            if (longPressTimer) clearTimeout(longPressTimer);
            if (!longPressed) nextState();
        });

        hotspot.addEventListener("pointerleave", () => {
            if (longPressTimer) clearTimeout(longPressTimer);
        });

        // Pulse button
        shakeBtn.addEventListener("click", () => {
            if (stateId !== 5) return;

            if (pulsePhase === "recording") {
                const ms = performance.now() - recordStart;
                recordTaps.push(ms);
                triggerShakeImpulse();
                return;
            }

            startRecording();
        });

        stopBtn?.addEventListener("click", () => {
            if (stateId !== 5 || pulsePhase !== "recording") return;
            stopRecording({ startPlaybackAfter: true });
        });

        // Init
        inlineSvg(ledsHost).finally(() => {
            const svg = ledsHost.querySelector("svg");
            if (svg) svg.style.pointerEvents = "none";

            const hotspotAnchor = makeHotspotAnchor({ scene, heroImg, ledsHost, hotspot });
            hotspotAnchor.attach();

            scene.dataset.pulse = "idle";
            applyState();
        });

    };

    // If already in/near view, start immediately.
    const nearNow = () => {
        const rect = section.getBoundingClientRect();
        const vh = (window.visualViewport && window.visualViewport.height) || window.innerHeight;
        return rect.top < (vh + 200) && rect.bottom > -200;
    };

    if (nearNow()) {
        start();
        return;
    }

    // Lazy init on first approach
    if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    start();
                    io.disconnect();
                }
            },
            { rootMargin: "250px 0px 250px 0px", threshold: 0.01 }
        );
        io.observe(section);
    } else {
        start();
    }
})();