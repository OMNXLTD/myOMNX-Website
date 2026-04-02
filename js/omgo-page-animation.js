const __omgoAfterScrollRestore = (cb, { timeoutMs = 700 } = {}) => {
    let lastY = null;
    let stableFrames = 0;
    const t0 = performance.now();

    const tick = () => {
        const y = window.scrollY || 0;
        if (y === lastY) stableFrames++;
        else { stableFrames = 0; lastY = y; }

        if (stableFrames >= 2 || (performance.now() - t0) > timeoutMs) cb(y);
        else requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
};

// ============== OMGO Pilot / Hero (video plays once + cinematic reveal) ==============
(() => {
    const section = document.querySelector('[data-omgo-pilot]');
    if (!section) return;

    const video = section.querySelector('[data-pilot-video]');
    const revealEls = Array.from(section.querySelectorAll('[data-pilot-reveal]'));

    // Keep the DOM accessible, but hide until reveal.
    revealEls.forEach((el) => el.setAttribute('aria-hidden', 'true'));

    let revealed = false;
    function reveal() {
        if (revealed) return;
        revealed = true;
        section.classList.add('is-revealed');
        revealEls.forEach((el) => el.setAttribute('aria-hidden', 'false'));
    }

    function safePlay() {
        if (!video) {
            reveal();
            return;
        }
        try {
            video.loop = false;
            video.muted = true;        // autoplay friendly
            video.playsInline = true;  // iOS
            video.currentTime = 0;

            const p = video.play();
            if (p && typeof p.catch === 'function') {
                p.catch(() => reveal()); // if autoplay is blocked, just reveal the content
            }
        } catch (_) {
            reveal();
        }
    }

    // Start the reveal slightly before the end so it feels “cinematic”.
    function revealNearEnd() {
        if (revealed || !video) return;
        const d = video.duration;
        const t = video.currentTime;
        if (!Number.isFinite(d) || d <= 0) return;

        // Trigger at ~80% progress OR within the last ~0.45s.
        if (t / d >= 0.8 || (d - t) <= 1.4) reveal();
    }

    // Play ONCE after the page finishes loading (video is the cover behind the hero copy).
    window.addEventListener(
        'load',
        () => {
            // Ensure initial CSS has painted so transitions are visible.
            requestAnimationFrame(() => safePlay());
        },
        { once: true }
    );

    if (video) {
        video.addEventListener('timeupdate', revealNearEnd);
        video.addEventListener('ended', reveal);
        video.addEventListener('error', reveal);
    }

    // Fallback: never leave the hero blank.
    setTimeout(() => {
        if (!revealed) reveal();
    }, 4500);
})();

// ============== OMGO: KARAOKE SCROLL HERO ==============
(() => {
    const section = document.querySelector("[data-karaoke]");
    if (!section) return;

    const sticky = section.querySelector(".karaoke__sticky");
    const bgWrap = section.querySelector(".karaoke__bg");
    const lines = Array.from(section.querySelectorAll(".karaoke__line"));
    const body = section.querySelector(".karaoke__body");
    const progressFill = section.querySelector("[data-karaoke-progress]");
    const skipBtn = section.querySelector("[data-karaoke-skip]");

    if (!sticky || !bgWrap || lines.length === 0) return;

    // Set stable “screen count” ONCE (CSS handles height with 100svh)
    section.style.setProperty("--karaoke-screens", String(lines.length));

    // Build background layers from data-bg
    bgWrap.innerHTML = "";
    const layers = lines.map((line) => {
        const url = line.getAttribute("data-bg");
        const layer = document.createElement("div");
        layer.className = "karaoke__bgLayer";
        if (url) layer.style.backgroundImage = `url("${url}")`;
        bgWrap.appendChild(layer);
        return layer;
    });

    const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

    // Use current viewport height for *math* only (doesn't change layout anymore)
    const getVH = () => (window.visualViewport?.height || window.innerHeight || 0);

    function update() {
        const rect = section.getBoundingClientRect();
        const vh = getVH();

        const tRaw = (-rect.top) / Math.max(1, vh);
        const t = clamp(tRaw, 0, lines.length - 1);

        const progress01 = lines.length <= 1 ? 0 : t / (lines.length - 1);
        if (body) body.style.setProperty("--karaoke-progress", progress01.toFixed(4));
        if (progressFill) progressFill.style.setProperty("--karaoke-progress", progress01.toFixed(4));

        if (skipBtn) {
            const inView = rect.bottom > vh * 0.9 && rect.top < vh * 0.8;
            const showSkip = inView && progress01 >= 0.01;
            skipBtn.classList.toggle("is-visible", showSkip);
            skipBtn.setAttribute("aria-hidden", showSkip ? "false" : "true");
        }

        const idx = Math.floor(t);
        const frac = t - idx;

        const linesWrap = section.querySelector(".karaoke__lines");
        const anchorIndex = 2;

        if (linesWrap) {
            const firstLine = lines[0];
            const secondLine = lines[1];

            let step = 0;
            if (firstLine && secondLine) step = secondLine.offsetTop - firstLine.offsetTop;
            else if (firstLine) step = firstLine.getBoundingClientRect().height;

            const shiftStepsRaw = Math.max(0, t - anchorIndex);
            const maxShiftSteps = Math.max(0, (lines.length - 1) - anchorIndex);
            const shiftSteps = Math.min(shiftStepsRaw, maxShiftSteps);

            linesWrap.style.transform = `translate3d(0, ${-shiftSteps * step}px, 0)`;
        }

        lines.forEach((el, i) => el.classList.toggle("is-active", i === idx));

        // Cross-fade backgrounds
        layers.forEach((layer) => (layer.style.opacity = "0"));

        const FADE_WINDOW = 0.08;
        const start = 1 - FADE_WINDOW;

        let blend = 0;
        if (frac > start) {
            blend = (frac - start) / FADE_WINDOW;
            blend = Math.max(0, Math.min(1, blend));
        }

        if (layers[idx]) layers[idx].style.opacity = String(1 - blend);
        if (layers[idx + 1]) layers[idx + 1].style.opacity = String(blend);
    }

    // Skip button smooth scroll
    if (skipBtn) {
        skipBtn.setAttribute("aria-hidden", "true");
        skipBtn.addEventListener("click", (e) => {
            const href = skipBtn.getAttribute("href") || "";
            if (!href.startsWith("#")) return;
            const target = document.querySelector(href);
            if (!target) return;
            e.preventDefault();
            target.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    }

    update();

    let raf = 0;
    window.addEventListener("scroll", () => {
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(update);
    }, { passive: true });

    // Update on real layout changes (orientation/width), but ignore height-only “address bar” churn
    let lastW = window.innerWidth;
    window.addEventListener("resize", () => {
        const w = window.innerWidth;
        if (Math.abs(w - lastW) < 2) return; // ignore height-only spam
        lastW = w;
        requestAnimationFrame(update);
    }, { passive: true });
})();

// ============== OMGO "See it in real action" Section (one-time clamp + reveal) ==============
(() => {
    const section = document.querySelector("#see-it-in-real-action");
    if (!section) return;

    const subtitle = section.querySelector("[data-real-action-subhead]");
    const cta = section.querySelector("[data-real-action-cta]");

    function getNavH() {
        const raw = getComputedStyle(document.documentElement)
            .getPropertyValue("--nav-height")
            .trim();
        const v = parseFloat(raw);
        return Number.isFinite(v) ? v : 0;
    }

    let revealed = false;
    function reveal() {
        if (revealed) return;
        revealed = true;

        // IMPORTANT: ensure initial state has painted before toggling class
        requestAnimationFrame(() => {
            section.classList.add("is-revealed");
            if (subtitle) subtitle.setAttribute("aria-hidden", "false");
            if (cta) cta.setAttribute("aria-hidden", "false");
        });
    }

    // Clamp once (your existing logic)
    let didClamp = false;
    let lastY = 0;
    let clampEnabled = true;
    let lockActive = false;
    let lockEndTimer = null;
    let lockY = 0;

    function startLock(ms) {
        lockActive = true;
        lockY = window.scrollY || 0;
        clearTimeout(lockEndTimer);
        lockEndTimer = setTimeout(() => (lockActive = false), ms);
    }

    function preventScroll(e) {
        if (!clampEnabled || !lockActive) return;
        e.preventDefault();
        window.scrollTo({ top: lockY, behavior: "auto" });
    }

    function preventKeys(e) {
        if (!clampEnabled || !lockActive) return;
        const keys = ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "];
        if (keys.includes(e.key)) {
            e.preventDefault();
            window.scrollTo({ top: lockY, behavior: "auto" });
        }
    }

    // Listeners are attached after scroll restoration (see initAtScrollY()).
    function onScroll() {
        const y = window.scrollY || 0;
        const scrollingDown = y > lastY;

        const rect = section.getBoundingClientRect();
        const vh = window.innerHeight || 0;

        const inView = rect.top < vh * 0.1 && rect.bottom > vh * 0.2;
        if (inView) reveal();

        if (!didClamp && scrollingDown) {
            const navH = getNavH();
            const docTop = y + rect.top;
            const clampY = Math.max(0, docTop - navH - 12);

            if (lastY < clampY && y >= clampY) {
                didClamp = true;
                window.scrollTo({ top: clampY, behavior: "auto" });
                startLock(900);
                reveal(); // also triggers reveal if clamp happens
            }
        }

        lastY = y;
    }

    // Init: wait for browser scroll restoration, then decide whether to arm the clamp.
    function initAtScrollY(y0) {
        lastY = y0;

        const rect0 = section.getBoundingClientRect();
        const navH0 = getNavH();
        const docTop0 = y0 + rect0.top;
        const clampY0 = Math.max(0, docTop0 - navH0 - 12);

        // Arm the clamp only if the page loads ABOVE the section's clamp point.
        // If the page loads within/below this section (e.g., reload near the footer),
        // disarm so we don't unexpectedly snap/lock.
        clampEnabled = y0 < (clampY0 - 2);

        if (!clampEnabled) {
            didClamp = true;
            reveal(); // mark as done; user won't see the animation if they're far below anyway
            return;
        }

        window.addEventListener("wheel", preventScroll, { passive: false });
        window.addEventListener("touchmove", preventScroll, { passive: false });
        window.addEventListener("keydown", preventKeys, { passive: false });

        requestAnimationFrame(onScroll);
        window.addEventListener("scroll", onScroll, { passive: true });
    }

    __omgoAfterScrollRestore((y0) => initAtScrollY(y0));
})();

// ============== OMGO Simulation Section ==============
(() => {
    const section = document.querySelector(".section.section--try-omgo");
    if (!section) return;

    // Prevent double-init if scripts load twice
    if (window.__OMGO_TRY_REVEAL_ACTIVE) return;
    window.__OMGO_TRY_REVEAL_ACTIVE = true;

    const prefersReducedMotion =
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // 1) Stagger indices for your existing CSS transition-delays
    const textItems = Array.from(section.querySelectorAll(".try-omgo__text-container > *"));
    const panel = section.querySelector(".try-omgo__panel");
    const staggerEls = panel ? [...textItems, panel] : [...textItems];
    staggerEls.forEach((el, i) => el.style.setProperty("--reveal-i", String(i)));

    // 2) Put section into cinematic "ready" state immediately (hidden until is-entered)
    // Only do this if we're going to animate.
    if (!prefersReducedMotion && !section.classList.contains("try-omgo--cinematic-done")) {
        section.classList.add("try-omgo--cinematic");
    } else {
        // Reduced motion: ensure content is just visible, no weird half-state
        section.classList.remove("try-omgo--cinematic");
        section.classList.add("try-omgo--cinematic-done");
        section.classList.add("is-entered");
        return;
    }

    let played = false;

    function playOnce() {
        if (played) return;
        played = true;

        // Trigger reveal
        section.classList.add("is-entered");
        section.classList.remove("is-exiting");

        // Freeze into done state so it never re-animates
        window.setTimeout(() => {
            section.classList.remove("try-omgo--cinematic");
            section.classList.add("try-omgo--cinematic-done");
        }, 1200);
    }

    // If already in view on load (e.g., refresh mid-page), reveal immediately.
    function isInViewNow() {
        const rect = section.getBoundingClientRect();
        const vh = (window.visualViewport && window.visualViewport.height) || window.innerHeight;
        // Enter when top is within ~75% of viewport and bottom isn't above nav area
        return rect.top < vh * 0.75 && rect.bottom > 80;
    }

    // Wait for paint so transitions are reliable
    requestAnimationFrame(() => {
        if (isInViewNow()) playOnce();
    });

    // 3) Enter observer: reliable on mobile, no scroll math
    if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver(
            (entries) => {
                for (const e of entries) {
                    if (e.isIntersecting) {
                        playOnce();
                        io.disconnect();
                        break;
                    }
                }
            },
            {
                threshold: 0.18,
                rootMargin: "0px 0px -15% 0px",
            }
        );
        io.observe(section);
    } else {
        // Fallback
        const onScroll = () => {
            if (!played && isInViewNow()) playOnce();
        };
        window.addEventListener("scroll", onScroll, { passive: true });
    }
})();