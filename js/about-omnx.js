// Sticky scrolling
(function () {
    const bannerSection = document.querySelector('[data-scroll-banner]');
    if (!bannerSection) return;

    const bannerImg = bannerSection.querySelector('.about-banner__image');
    if (!bannerImg) return;

    let ticking = false;

    function updateBannerScroll() {
        const rect = bannerSection.getBoundingClientRect();
        const vh = window.innerHeight;

        // Total scroll “path” for this effect:
        // from the moment the section JUST starts to enter
        // until it has completely left the viewport.
        const total = vh + rect.height;
        const current = vh - rect.top;

        let progress = current / total; // 0 → 1
        if (progress < 0) progress = 0;
        if (progress > 1) progress = 1;

        // Map 0..1 to 0%..100% vertical object-position (top → bottom)
        const y = progress * 100;
        bannerImg.style.objectPosition = `center ${y}%`;

        ticking = false;
    }

    function onScroll() {
        if (!ticking) {
            window.requestAnimationFrame(updateBannerScroll);
            ticking = true;
        }
    }

    // Initial position (in case user lands mid-page)
    updateBannerScroll();

    window.addEventListener('scroll', onScroll);
    window.addEventListener('resize', updateBannerScroll);
})();


// ABOUT PAGE: Highlighting words
document.addEventListener("DOMContentLoaded", () => {
    const block = document.querySelector(".whiten-seq");
    if (!block) return;

    // Split into spans
    const words = block.innerText.trim().split(" ");
    block.innerHTML = words
        .map(w => `<span class="whiten-word">${w}</span>`)
        .join(" ");

    const spans = [...block.querySelectorAll(".whiten-word")];

    let isAnimating = false;
    let observerStarted = false;

    function runSequence() {
        if (isAnimating) return;
        isAnimating = true;

        // reset all
        spans.forEach(s => s.classList.remove("active"));

        let i = 0;
        function step() {
            if (i < spans.length) {
                spans[i].classList.add("active");
                i++;
                setTimeout(step, 150); // reading speed pacing
            } else {
                // Finished → wait 8 sec → restart if still visible
                setTimeout(() => {
                    isAnimating = false;
                    if (observerStarted) runSequence();
                }, 8000);
            }
        }
        step();
    }

    // Observe when at least 50% of this block is on screen
    const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                if (!observerStarted) {
                    observerStarted = true;
                    runSequence();
                }
            } else {
                observerStarted = false;
            }
        });
    }, { threshold: 0.5 });

    io.observe(block);
});




// ============== INFINITE GALLERY: CINEMATIC REVEAL (ON ENTER) ==============
(() => {
    const sections = Array.from(document.querySelectorAll("[data-ig-reveal]"));
    if (!sections.length) return;

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    function prepareSection(section) {
        // Prevent double init
        if (section.__igRevealInit) return;
        section.__igRevealInit = true;

        // Mark ready (so CSS can safely apply without weird flashes)
        section.classList.add("ig-reveal-ready");

        // Optional: set stagger indices for items/images inside this section
        // Prefer explicit items if you add them; fallback to common patterns, then images.
        const items = section.querySelectorAll(
            "[data-ig-item], .ig__item, .infinite-gallery__item, img"
        );

        // Only stagger the first “screenful” to avoid huge delays if you have many images
        const maxStagger = 18;
        Array.from(items).slice(0, maxStagger).forEach((el, i) => {
            el.style.setProperty("--ig-i", String(i));
        });

        // If reduced motion: reveal immediately
        if (reduceMotion) {
            section.classList.add("is-revealed");
            return;
        }

        let revealed = false;
        const reveal = () => {
            if (revealed) return;
            revealed = true;
            section.classList.add("is-revealed");
        };

        if (!("IntersectionObserver" in window)) {
            reveal();
            return;
        }

        const io = new IntersectionObserver(
            (entries) => {
                const on = entries.some((e) => e.isIntersecting);
                if (!on) return;
                reveal();
                io.disconnect();
            },
            {
                // Feel more “cinematic”: trigger slightly after it starts entering
                threshold: 0.18,
                rootMargin: "-10% 0px -10% 0px",
            }
        );

        io.observe(section);
    }

    // Init now
    sections.forEach(prepareSection);

    // If you inject partials later
    window.addEventListener("partials:loaded", () => {
        document.querySelectorAll("[data-ig-reveal]").forEach(prepareSection);
    });
})();

/* ===================== INFINITE GALLERY (true loop + directional buttons, no bounce) ===================== */
(() => {
    const root = document.querySelector("[data-ig]");
    if (!root || root.__ig_init) return;
    root.__ig_init = true;

    const scroller = root.querySelector("[data-ig-scroller]");
    const track = root.querySelector("[data-ig-track]");
    const prevBtn = root.querySelector("[data-ig-prev]");
    const nextBtn = root.querySelector("[data-ig-next]");
    if (!scroller || !track) return;

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    // ========= EDIT THIS LIST (add/remove freely) =========
    const IG_IMAGES = [
        { src: "assets/about-page-gallery-photo-1.webp", alt: "OMGO in daily life – 1" },
        { src: "assets/about-page-gallery-photo-2.webp", alt: "OMGO in daily life – 2" },
        { src: "assets/about-page-gallery-photo-3.webp", alt: "OMGO in daily life – 3" },
        { src: "assets/about-page-gallery-photo-4.webp", alt: "OMGO in daily life – 4" },
        { src: "assets/about-page-gallery-photo-5.webp", alt: "OMGO in daily life – 5" },
        { src: "assets/about-page-gallery-photo-6.webp", alt: "OMGO in daily life – 6" },
    ];
    // ======================================================

    const N = IG_IMAGES.length;
    if (N < 2) return;

    const mod = (x, m) => ((x % m) + m) % m;

    const makeItem = ({ src, alt }, i, ariaHidden) => {
        const item = document.createElement("div");
        item.className = "ig__item";
        if (ariaHidden) item.setAttribute("aria-hidden", "true");

        const img = document.createElement("img");
        img.src = src;
        img.alt = alt || `OMGO in daily life – ${i + 1}`;
        img.loading = "lazy";
        img.decoding = "async";

        item.appendChild(img);
        return item;
    };

    // Build 3 sets: [before] [middle] [after]
    track.innerHTML = "";
    IG_IMAGES.forEach((d, i) => track.appendChild(makeItem(d, i, true)));
    IG_IMAGES.forEach((d, i) => track.appendChild(makeItem(d, i, false)));
    IG_IMAGES.forEach((d, i) => track.appendChild(makeItem(d, i, true)));

    // Measurements derived from middle set
    let base = 0;       // width of one set; also scrollLeft at start of middle set
    let offsets = [];   // offsets of each tile inside a set
    let ready = false;

    const measure = () => {
        const kids = Array.from(track.children);
        if (kids.length < 3 * N) return false;

        const middle = kids.slice(N, 2 * N);
        if (!middle[0]) return false;

        base = middle[0].offsetLeft; // == width of one full set
        const baseLeft = base;
        offsets = middle.map(el => el.offsetLeft - baseLeft);

        ready = base > 0 && offsets.length === N;
        return ready;
    };

    // Teleport instantly (no animation)
    const teleportTo = (left) => {
        const prev = scroller.style.scrollBehavior;
        scroller.style.scrollBehavior = "auto";
        scroller.scrollLeft = left;
        scroller.style.scrollBehavior = prev || "";
    };

    // Which “set” are we currently in? 0=before, 1=middle, 2=after
    const currentSet = () => {
        if (!ready) return 1;
        return Math.floor(scroller.scrollLeft / base);
    };

    // Position within current set [0..base)
    const withinSet = () => {
        if (!ready) return 0;
        const s = currentSet();
        return scroller.scrollLeft - s * base;
    };

    // Nearest tile index inside a set
    const nearestIndex = (within) => {
        let bestI = 0;
        let bestD = Infinity;
        for (let i = 0; i < offsets.length; i++) {
            const d = Math.abs(within - offsets[i]);
            if (d < bestD) {
                bestD = d;
                bestI = i;
            }
        }
        return bestI;
    };

    // Recenter logic:
    // - Manual scroll: wrap immediately so it feels infinite
    // - Programmatic scroll: wait until motion settles, then recenter (avoid mid-animation teleport)
    let isProgrammatic = false;
    let settleTimer = null;

    const recenterAfterSettle = () => {
        if (!ready) return;
        const s = currentSet();
        if (s === 1) return;

        // Preserve exact within-set position
        const within = withinSet();
        teleportTo(base + within);
    };

    const scheduleSettle = () => {
        clearTimeout(settleTimer);
        settleTimer = setTimeout(() => {
            // After scrolling stops (manual or programmatic), recenter invisibly.
            recenterAfterSettle();
            isProgrammatic = false;
        }, 140);
    };

    scroller.addEventListener("scroll", () => {
        if (!ready) return;
        // Never teleport mid-gesture. Always recenter only after scroll settles.
        scheduleSettle();
    }, { passive: true });

    const scrollToLeft = (left, behavior = "smooth") => {
        scroller.scrollTo({
            left,
            behavior: reduceMotion ? "auto" : behavior,
        });
    };

    // Directional step that NEVER bounces:
    // - If at last and going right -> go to first tile in NEXT set (keeps moving right)
    // - If at first and going left -> go to last tile in PREV set (keeps moving left)
    const step = (dir) => {
        if (!ready) return;

        let s = currentSet();

        // Safety: if somehow we’re outside [0..2], recenter to middle first
        if (s < 0 || s > 2) {
            teleportTo(base + withinSet());
            s = 1;
        }

        const within = withinSet();
        const i = nearestIndex(within);

        let nextI = mod(i + dir, N);
        let targetSet = s;

        if (dir > 0 && i === N - 1) targetSet = s + 1; // keep moving right
        if (dir < 0 && i === 0) targetSet = s - 1; // keep moving left

        // Keep targetSet inside [0..2]. If we’re at the outermost set, teleport to middle first.
        if (targetSet < 0 || targetSet > 2) {
            // recenter to middle preserving within-set position, then redo step
            teleportTo(base + within);
            targetSet = 1;
            if (dir > 0 && i === N - 1) targetSet = 2;
            if (dir < 0 && i === 0) targetSet = 0;
        }

        const left = targetSet * base + offsets[nextI];

        isProgrammatic = true;
        clearTimeout(settleTimer);

        scrollToLeft(left, "smooth");

        // If scrollend exists, use it; otherwise debounce settle
        if ("onscrollend" in window) {
            const onEnd = () => {
                scroller.removeEventListener("scrollend", onEnd);
                recenterAfterSettle();
                isProgrammatic = false;
            };
            scroller.addEventListener("scrollend", onEnd, { once: true });
        } else {
            scheduleSettle();
        }
    };

    prevBtn?.addEventListener("click", () => step(-1));
    nextBtn?.addEventListener("click", () => step(1));

    scroller.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
        if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
    });

    // Init after layout settles
    const init = () => {
        if (!measure()) return;
        // Start at first tile of the middle set
        teleportTo(base + offsets[0]);
    };

    requestAnimationFrame(() => {
        init();

        // Re-measure once after images load (handles late layout shifts)
        let did = false;
        track.addEventListener("load", () => {
            if (did) return;
            did = true;
            const i = ready ? nearestIndex(withinSet()) : 0;
            measure();
            teleportTo(base + (offsets[i] ?? 0));
        }, true);
    });

    // Resize: keep the same index
    let resizeTimer = null;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (!ready) return;
            const i = nearestIndex(withinSet());
            measure();
            teleportTo(base + (offsets[i] ?? 0));
        }, 120);
    });
})();




// ============== WHAT SECTION: BACKGROUND PARALLAX ==============
(() => {
    const init = () => {
        const section = document.querySelector(".section--what");
        if (!section) return;

        const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
        if (mq?.matches) return;

        const MAX_PX = 200;
        const clamp01 = (v) => Math.max(0, Math.min(1, v));
        let ticking = false;
        let active = true;

        const update = () => {
            ticking = false;
            if (!active) return;

            const rect = section.getBoundingClientRect();
            const vh = window.innerHeight || document.documentElement.clientHeight;

            const p = clamp01((vh - rect.top) / (vh + rect.height));
            const y = (p - 0.5) * 2 * MAX_PX; // [-MAX_PX .. +MAX_PX]

            section.style.setProperty("--what-parallax-px", `${y.toFixed(2)}px`);
        };

        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(update);
        };

        if ("IntersectionObserver" in window) {
            const io = new IntersectionObserver(
                (entries) => {
                    active = entries.some((e) => e.isIntersecting);
                    if (active) onScroll();
                },
                { rootMargin: "300px 0px 300px 0px", threshold: 0.01 }
            );
            io.observe(section);
        }

        update();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll, { passive: true });
        window.visualViewport?.addEventListener("resize", onScroll, { passive: true });
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();

// ============== WHAT SECTION: PAGE-FLIP BACKGROUND (tech drawing pages) ==============
(() => {
    const section = document.querySelector(".section--what");
    if (!section) return;

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    const IMAGES = [
        "../assets/omgo-tech-drawing-page-1.webp",
        "../assets/omgo-tech-drawing-page-2.webp",
        "../assets/omgo-tech-drawing-page-3.webp",
    ];

    const LOOP_MS = 6000;          // change every 6000ms (as requested)
    const XFADE_MS = 2000;         // cinematic fade time
    const INTRO_STEP_MS = 180;     // quick flashes on entry
    const INTRO_STEPS = 10;        // how many flashes total

    // ------------------ BG layers ------------------
    let bg = section.querySelector(".what-bg");
    if (!bg) {
        bg = document.createElement("div");
        bg.className = "what-bg";
        bg.innerHTML = `
      <div class="what-bg__page what-bg__a"></div>
      <div class="what-bg__page what-bg__b"></div>
    `;
        section.insertBefore(bg, section.firstChild);
        section.classList.add("what-bg-ready");
    }

    const a = bg.querySelector(".what-bg__a");
    const b = bg.querySelector(".what-bg__b");

    const setBg = (el, url) => { el.style.backgroundImage = `url("${url}")`; };

    const preload = (url) =>
        new Promise((res) => {
            const img = new Image();
            img.onload = () => res(true);
            img.onerror = () => res(false);
            img.src = url;
        });

    let idx = 0;
    let topIsA = true;
    let loopTimer = null;

    // state flags
    let isVisible = false;
    let startedOnce = false;
    let flashing = false;

    function stopLoop() {
        if (loopTimer) clearInterval(loopTimer);
        loopTimer = null;
    }

    function startLoop() {
        stopLoop();
        loopTimer = setInterval(() => {
            swapTo((idx + 1) % IMAGES.length, { blurPx: 0 });
        }, LOOP_MS);
    }

    function setCinematicVars({ blurPx = 0, scale = 1.02, scaleMs = 1800 } = {}) {
        section.style.setProperty("--what-xfade-ms", `${XFADE_MS}ms`);
        section.style.setProperty("--what-blur", `${blurPx}px`);
        section.style.setProperty("--what-scale", `${scale}`);
        section.style.setProperty("--what-scale-ms", `${scaleMs}ms`);
    }

    function swapTo(nextIdx, { blurPx = 0 } = {}) {
        if (!isVisible) return;

        if (reduceMotion) {
            idx = nextIdx;
            setBg(a, IMAGES[idx]);
            a.classList.add("is-active");
            b.classList.remove("is-active");
            return;
        }

        const incoming = topIsA ? b : a;
        const outgoing = topIsA ? a : b;

        setCinematicVars({ blurPx, scale: 1.02 });

        idx = nextIdx;
        setBg(incoming, IMAGES[idx]);

        // kick transition
        section.classList.add("is-xfading");
        incoming.classList.add("is-active");
        outgoing.classList.remove("is-active");

        window.setTimeout(() => {
            section.classList.remove("is-xfading");
            topIsA = !topIsA;
            setCinematicVars({ blurPx: 0, scale: 1.02 });
        }, XFADE_MS + 40);
    }

    async function introFlash() {
        if (reduceMotion || flashing) return;
        flashing = true;

        let flashIdx = 0;

        for (let i = 0; i < INTRO_STEPS; i++) {
            if (!isVisible) break; // if user scrolls away, stop

            const t = i / (INTRO_STEPS - 1);
            const blur = Math.max(0, Math.round(18 * (1 - t)));
            const next = flashIdx % IMAGES.length;

            section.style.setProperty("--what-xfade-ms", `${Math.min(260, XFADE_MS)}ms`);
            swapTo(next, { blurPx: blur });

            flashIdx++;
            await new Promise((r) => setTimeout(r, INTRO_STEP_MS));
        }

        // land on page 1
        if (isVisible) {
            section.style.setProperty("--what-xfade-ms", `${Math.min(420, XFADE_MS)}ms`);
            swapTo(0, { blurPx: 0 });
            await new Promise((r) => setTimeout(r, Math.min(520, XFADE_MS)));
            section.style.setProperty("--what-xfade-ms", `${XFADE_MS}ms`);
        }

        flashing = false;
    }

    // ------------------ Content cinematic reveal ------------------
    function revealContent() {
        // add a class so CSS runs blur/opacity/translate reveal
        section.classList.add("what-content-in");
    }

    // ------------------ Boot once, but only when entering ------------------
    async function bootOnce() {
        if (startedOnce) return;
        startedOnce = true;

        await Promise.all(IMAGES.map(preload));

        // start from page 1 visible (no flashing yet)
        idx = 0;
        setBg(a, IMAGES[idx]);
        a.classList.add("is-active");
        b.classList.remove("is-active");
        topIsA = true;

        // when user first enters: reveal content + play intro + start loop
        revealContent();
        await introFlash();
        if (isVisible) startLoop();
    }

    // ------------------ Visibility control ------------------
    function onEnter() {
        isVisible = true;

        // first time: boot + intro
        bootOnce();

        // later re-entries: just restart loop (don’t replay intro)
        if (startedOnce && !loopTimer && !reduceMotion) startLoop();
        if (startedOnce && reduceMotion && !loopTimer) startLoop();
    }

    function onLeave() {
        isVisible = false;
        stopLoop();
    }

    if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver(
            (entries) => {
                const on = entries.some((e) => e.isIntersecting);
                if (on) onEnter();
                else onLeave();
            },
            { rootMargin: "-30% 0px -30% 0px", threshold: 0.14 }
        );
        io.observe(section);
    } else {
        // fallback: start immediately if no IO
        isVisible = true;
        bootOnce();
    }
})();