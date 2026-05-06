// ================= DISABLE PHOTO / VIDEO SAVING =================
(() => {
  // Disable right-click only on common media elements
  document.addEventListener("contextmenu", (e) => {
    if (e.target.closest("img, video, picture, source, canvas")) {
      e.preventDefault();
    }
  });

  // Disable drag-save
  document.addEventListener("dragstart", (e) => {
    if (e.target.closest("img, video")) e.preventDefault();
  });
})();



// ================= FLOATING MVP TAB BAR =================
(() => {
  if (window.__OMNX_FLOATING_TAB_BAR_INIT) return;
  window.__OMNX_FLOATING_TAB_BAR_INIT = true;

  function ensureFloatingTabGlassFilter() {
    if (document.getElementById("omnx-floating-glass-svg")) return;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("id", "omnx-floating-glass-svg");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");

    svg.style.position = "absolute";
    svg.style.width = "0";
    svg.style.height = "0";
    svg.style.overflow = "hidden";
    svg.style.pointerEvents = "none";

    svg.innerHTML = `
      <filter
        id="omnx-floating-tab-lens"
        x="0%"
        y="0%"
        width="100%"
        height="100%"
        filterUnits="objectBoundingBox"
      >
        <feComponentTransfer in="SourceAlpha" result="alpha">
          <feFuncA type="identity" />
        </feComponentTransfer>

        <feGaussianBlur
          in="alpha"
          stdDeviation="28"
          result="blur"
        />

        <feDisplacementMap
          in="SourceGraphic"
          in2="blur"
          scale="22"
          xChannelSelector="A"
          yChannelSelector="A"
        />
      </filter>
    `;

    document.body.appendChild(svg);
  }

  ensureFloatingTabGlassFilter();

  const path = window.location.pathname.split("/").pop() || "index.html";

  const isHome =
    path === "" ||
    path === "index.html" ||
    path === "/";

  const isPrelaunch = path === "pre-launch-sign-up.html";
  const isContact = path === "support.html";

  let items = [];

  if (isHome) {
    items = [
      {
        label: "Pre-launch",
        href: "pre-launch-sign-up.html",
        key: "prelaunch",
      },
      {
        label: "Contact us",
        href: "support.html",
        key: "support",
      },
    ];
  } else if (isPrelaunch) {
    items = [
      {
        label: "OMNX Home",
        href: "index.html",
        key: "home",
      },
      {
        label: "Contact us",
        href: "support.html",
        key: "support",
      },
    ];
  } else if (isContact) {
    items = [
      {
        label: "OMNX Home",
        href: "index.html",
        key: "home",
      },
      {
        label: "Pre-launch",
        href: "pre-launch-sign-up.html",
        key: "prelaunch",
      },
    ];
  } else {
    items = [
      {
        label: "OMNX Home",
        href: "index.html",
        key: "home",
      },
      {
        label: "Pre-launch",
        href: "pre-launch-sign-up.html",
        key: "prelaunch",
      },
    ];
  }

  const nav = document.createElement("nav");
  nav.id = "omnxFloatingTabs";
  nav.className = "floating-tab-bar";
  nav.setAttribute("aria-label", "OMNX quick navigation");

  nav.innerHTML = `
    <div class="floating-tab-bar__inner">
      <div class="floating-tab-bar__filter" aria-hidden="true"></div>
      <div class="floating-tab-bar__overlay" aria-hidden="true"></div>
      <div class="floating-tab-bar__specular" aria-hidden="true"></div>

      <div class="floating-tab-bar__content">
        ${items
          .map(
            (item) => `
              <a class="floating-tab-bar__link" data-tab="${item.key}" href="${item.href}">
                <span>${item.label}</span>
              </a>
            `
          )
          .join("")}
      </div>
    </div>
  `;

  document.body.appendChild(nav);

  requestAnimationFrame(() => {
    nav.classList.add("is-visible");
  });
})();



// ================= OMNX GENERIC ARTICLE MODALS =================
(() => {
  if (window.__OMNX_GENERIC_MODAL_INIT) return;
  window.__OMNX_GENERIC_MODAL_INIT = true;

  const openButtons = document.querySelectorAll("[data-omnx-modal-open]");
  const modals = document.querySelectorAll("[data-omnx-modal]");

  if (!openButtons.length || !modals.length) return;

  let lastFocusedElement = null;
  let activeModal = null;

  function getModalByName(name) {
    return document.querySelector(`[data-omnx-modal="${CSS.escape(name)}"]`);
  }

  function openOMNXModal(modal) {
    if (!modal) return;

    lastFocusedElement = document.activeElement;
    activeModal = modal;

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("omnx-modal-open");

    const closeButton = modal.querySelector(".omnx-modal__close");
    if (closeButton) closeButton.focus();
  }

  function closeOMNXModal(modal = activeModal) {
    if (!modal) return;

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");

    const stillOpen = document.querySelector(".omnx-modal.is-open");
    if (!stillOpen) {
      document.body.classList.remove("omnx-modal-open");
      activeModal = null;
    }

    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus();
    }
  }

  openButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const modalName = button.getAttribute("data-omnx-modal-open");
      const modal = getModalByName(modalName);
      openOMNXModal(modal);
    });
  });

  modals.forEach((modal) => {
    const closeButtons = modal.querySelectorAll("[data-omnx-modal-close]");

    closeButtons.forEach((button) => {
      button.addEventListener("click", () => closeOMNXModal(modal));
    });

    modal.addEventListener("click", (event) => {
      if (event.target.matches("[data-omnx-modal-close]")) {
        closeOMNXModal(modal);
      }
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && activeModal) {
      closeOMNXModal(activeModal);
    }
  });
})();

// // ============== INFINITE GALLERY: CINEMATIC REVEAL (ON ENTER) ==============
// (() => {
//     const sections = Array.from(document.querySelectorAll("[data-ig-reveal]"));
//     if (!sections.length) return;

//     const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

//     function prepareSection(section) {
//         // Prevent double init
//         if (section.__igRevealInit) return;
//         section.__igRevealInit = true;

//         // Mark ready (so CSS can safely apply without weird flashes)
//         section.classList.add("ig-reveal-ready");

//         // Optional: set stagger indices for items/images inside this section
//         // Prefer explicit items if you add them; fallback to common patterns, then images.
//         const items = section.querySelectorAll(
//             "[data-ig-item], .ig__item, .infinite-gallery__item, img"
//         );

//         // Only stagger the first “screenful” to avoid huge delays if you have many images
//         const maxStagger = 18;
//         Array.from(items).slice(0, maxStagger).forEach((el, i) => {
//             el.style.setProperty("--ig-i", String(i));
//         });

//         // If reduced motion: reveal immediately
//         if (reduceMotion) {
//             section.classList.add("is-revealed");
//             return;
//         }

//         let revealed = false;
//         const reveal = () => {
//             if (revealed) return;
//             revealed = true;
//             section.classList.add("is-revealed");
//         };

//         if (!("IntersectionObserver" in window)) {
//             reveal();
//             return;
//         }

//         const io = new IntersectionObserver(
//             (entries) => {
//                 const on = entries.some((e) => e.isIntersecting);
//                 if (!on) return;
//                 reveal();
//                 io.disconnect();
//             },
//             {
//                 // Feel more “cinematic”: trigger slightly after it starts entering
//                 threshold: 0.18,
//                 rootMargin: "-10% 0px -10% 0px",
//             }
//         );

//         io.observe(section);
//     }

//     // Init now
//     sections.forEach(prepareSection);

//     // If you inject partials later
//     window.addEventListener("partials:loaded", () => {
//         document.querySelectorAll("[data-ig-reveal]").forEach(prepareSection);
//     });
// })();

// /* ===================== INFINITE GALLERY (true loop + directional buttons, no bounce) ===================== */
// (() => {
//     const root = document.querySelector("[data-ig]");
//     if (!root || root.__ig_init) return;
//     root.__ig_init = true;

//     const scroller = root.querySelector("[data-ig-scroller]");
//     const track = root.querySelector("[data-ig-track]");
//     const prevBtn = root.querySelector("[data-ig-prev]");
//     const nextBtn = root.querySelector("[data-ig-next]");
//     if (!scroller || !track) return;

//     const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

//     // ========= EDIT THIS LIST (add/remove freely) =========
//     const IG_IMAGES = [
//         { src: "assets/about-page-gallery-photo-1.webp", alt: "OMGO in daily life – 1" },
//         { src: "assets/about-page-gallery-photo-2.webp", alt: "OMGO in daily life – 2" },
//         { src: "assets/about-page-gallery-photo-3.webp", alt: "OMGO in daily life – 3" },
//         { src: "assets/about-page-gallery-photo-4.webp", alt: "OMGO in daily life – 4" },
//         { src: "assets/about-page-gallery-photo-5.webp", alt: "OMGO in daily life – 5" },
//         { src: "assets/about-page-gallery-photo-6.webp", alt: "OMGO in daily life – 6" },
//     ];
//     // ======================================================

//     const N = IG_IMAGES.length;
//     if (N < 2) return;

//     const mod = (x, m) => ((x % m) + m) % m;

//     const makeItem = ({ src, alt }, i, ariaHidden) => {
//         const item = document.createElement("div");
//         item.className = "ig__item";
//         if (ariaHidden) item.setAttribute("aria-hidden", "true");

//         const img = document.createElement("img");
//         img.src = src;
//         img.alt = alt || `OMGO in daily life – ${i + 1}`;
//         img.loading = "lazy";
//         img.decoding = "async";

//         item.appendChild(img);
//         return item;
//     };

//     // Build 3 sets: [before] [middle] [after]
//     track.innerHTML = "";
//     IG_IMAGES.forEach((d, i) => track.appendChild(makeItem(d, i, true)));
//     IG_IMAGES.forEach((d, i) => track.appendChild(makeItem(d, i, false)));
//     IG_IMAGES.forEach((d, i) => track.appendChild(makeItem(d, i, true)));

//     // Measurements derived from middle set
//     let base = 0;       // width of one set; also scrollLeft at start of middle set
//     let offsets = [];   // offsets of each tile inside a set
//     let ready = false;

//     const measure = () => {
//         const kids = Array.from(track.children);
//         if (kids.length < 3 * N) return false;

//         const middle = kids.slice(N, 2 * N);
//         if (!middle[0]) return false;

//         base = middle[0].offsetLeft; // == width of one full set
//         const baseLeft = base;
//         offsets = middle.map(el => el.offsetLeft - baseLeft);

//         ready = base > 0 && offsets.length === N;
//         return ready;
//     };

//     // Teleport instantly (no animation)
//     const teleportTo = (left) => {
//         const prev = scroller.style.scrollBehavior;
//         scroller.style.scrollBehavior = "auto";
//         scroller.scrollLeft = left;
//         scroller.style.scrollBehavior = prev || "";
//     };

//     // Which “set” are we currently in? 0=before, 1=middle, 2=after
//     const currentSet = () => {
//         if (!ready) return 1;
//         return Math.floor(scroller.scrollLeft / base);
//     };

//     // Position within current set [0..base)
//     const withinSet = () => {
//         if (!ready) return 0;
//         const s = currentSet();
//         return scroller.scrollLeft - s * base;
//     };

//     // Nearest tile index inside a set
//     const nearestIndex = (within) => {
//         let bestI = 0;
//         let bestD = Infinity;
//         for (let i = 0; i < offsets.length; i++) {
//             const d = Math.abs(within - offsets[i]);
//             if (d < bestD) {
//                 bestD = d;
//                 bestI = i;
//             }
//         }
//         return bestI;
//     };

//     // Recenter logic:
//     // - Manual scroll: wrap immediately so it feels infinite
//     // - Programmatic scroll: wait until motion settles, then recenter (avoid mid-animation teleport)
//     let isProgrammatic = false;
//     let settleTimer = null;

//     const recenterAfterSettle = () => {
//         if (!ready) return;
//         const s = currentSet();
//         if (s === 1) return;

//         // Preserve exact within-set position
//         const within = withinSet();
//         teleportTo(base + within);
//     };

//     const scheduleSettle = () => {
//         clearTimeout(settleTimer);
//         settleTimer = setTimeout(() => {
//             // After scrolling stops (manual or programmatic), recenter invisibly.
//             recenterAfterSettle();
//             isProgrammatic = false;
//         }, 140);
//     };

//     scroller.addEventListener("scroll", () => {
//         if (!ready) return;
//         // Never teleport mid-gesture. Always recenter only after scroll settles.
//         scheduleSettle();
//     }, { passive: true });

//     const scrollToLeft = (left, behavior = "smooth") => {
//         scroller.scrollTo({
//             left,
//             behavior: reduceMotion ? "auto" : behavior,
//         });
//     };

//     // Directional step that NEVER bounces:
//     // - If at last and going right -> go to first tile in NEXT set (keeps moving right)
//     // - If at first and going left -> go to last tile in PREV set (keeps moving left)
//     const step = (dir) => {
//         if (!ready) return;

//         let s = currentSet();

//         // Safety: if somehow we’re outside [0..2], recenter to middle first
//         if (s < 0 || s > 2) {
//             teleportTo(base + withinSet());
//             s = 1;
//         }

//         const within = withinSet();
//         const i = nearestIndex(within);

//         let nextI = mod(i + dir, N);
//         let targetSet = s;

//         if (dir > 0 && i === N - 1) targetSet = s + 1; // keep moving right
//         if (dir < 0 && i === 0) targetSet = s - 1; // keep moving left

//         // Keep targetSet inside [0..2]. If we’re at the outermost set, teleport to middle first.
//         if (targetSet < 0 || targetSet > 2) {
//             // recenter to middle preserving within-set position, then redo step
//             teleportTo(base + within);
//             targetSet = 1;
//             if (dir > 0 && i === N - 1) targetSet = 2;
//             if (dir < 0 && i === 0) targetSet = 0;
//         }

//         const left = targetSet * base + offsets[nextI];

//         isProgrammatic = true;
//         clearTimeout(settleTimer);

//         scrollToLeft(left, "smooth");

//         // If scrollend exists, use it; otherwise debounce settle
//         if ("onscrollend" in window) {
//             const onEnd = () => {
//                 scroller.removeEventListener("scrollend", onEnd);
//                 recenterAfterSettle();
//                 isProgrammatic = false;
//             };
//             scroller.addEventListener("scrollend", onEnd, { once: true });
//         } else {
//             scheduleSettle();
//         }
//     };

//     prevBtn?.addEventListener("click", () => step(-1));
//     nextBtn?.addEventListener("click", () => step(1));

//     scroller.addEventListener("keydown", (e) => {
//         if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
//         if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
//     });

//     // Init after layout settles
//     const init = () => {
//         if (!measure()) return;
//         // Start at first tile of the middle set
//         teleportTo(base + offsets[0]);
//     };

//     requestAnimationFrame(() => {
//         init();

//         // Re-measure once after images load (handles late layout shifts)
//         let did = false;
//         track.addEventListener("load", () => {
//             if (did) return;
//             did = true;
//             const i = ready ? nearestIndex(withinSet()) : 0;
//             measure();
//             teleportTo(base + (offsets[i] ?? 0));
//         }, true);
//     });

//     // Resize: keep the same index
//     let resizeTimer = null;
//     window.addEventListener("resize", () => {
//         clearTimeout(resizeTimer);
//         resizeTimer = setTimeout(() => {
//             if (!ready) return;
//             const i = nearestIndex(withinSet());
//             measure();
//             teleportTo(base + (offsets[i] ?? 0));
//         }, 120);
//     });
// })();

// ============== WORD SEQUENCING ANIMATION ==============
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

// ============== PRODUCT TEXTURE BANNER: PARALLAX ==============
(() => {
  const init = () => {
    const section = document.querySelector(".product-texture-banner");
    if (!section) return;

    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (mq?.matches) return;

    const MAX_PX = 90;
    const clamp01 = (v) => Math.max(0, Math.min(1, v));

    let ticking = false;
    let active = true;

    const update = () => {
      ticking = false;
      if (!active) return;

      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;

      const progress = clamp01((vh - rect.top) / (vh + rect.height));
      const y = (progress - 0.5) * 2 * MAX_PX;

      section.style.setProperty(
        "--product-banner-parallax-px",
        `${y.toFixed(2)}px`
      );
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          active = entries.some((entry) => entry.isIntersecting);
          if (active) onScroll();
        },
        {
          rootMargin: "260px 0px 260px 0px",
          threshold: 0.01,
        }
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

// ============== SECTION 5: BEFORE / AFTER AUTO-SWEEP SLIDER ==============
(() => {
  const init = () => {
    const slider = document.querySelector("[data-before-after]");
    if (!slider || slider.__beforeAfterInit) return;

    slider.__beforeAfterInit = true;

    const stage = slider.querySelector(".before-after-slider__stage");
    const handle = slider.querySelector(".before-after-slider__handle");
    const images = Array.from(slider.querySelectorAll("img"));

    if (!stage || !handle) return;

    const prefersReducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    let hasPlayedIntro = false;
    let isDragging = false;
    let isInteractive = false;
    let activePointerId = null;

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

    const setPos = (percent) => {
      const safe = clamp(percent, 0, 100);
      slider.style.setProperty("--ba-pos", `${safe.toFixed(2)}%`);
    };

    /*
      Important:
      Set this immediately so the section never appears in a confusing half-state.
      100% = full left/before image.
    */
    setPos(100);

    const getPercentFromClientX = (clientX) => {
      const rect = stage.getBoundingClientRect();
      if (!rect.width) return 100;
      return ((clientX - rect.left) / rect.width) * 100;
    };

    const waitForImages = async () => {
      const jobs = images.map((img) => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();

        if (typeof img.decode === "function") {
          return img.decode().catch(() => {});
        }

        return new Promise((resolve) => {
          img.addEventListener("load", resolve, { once: true });
          img.addEventListener("error", resolve, { once: true });
        });
      });

      await Promise.all(jobs);
    };

    const animateTo = (target, duration = 1200, easing = easeInOutCubic) => {
      return new Promise((resolve) => {
        const startRaw = getComputedStyle(slider).getPropertyValue("--ba-pos").trim();
        const parsedStart = parseFloat(startRaw);
        const start = Number.isFinite(parsedStart) ? parsedStart : 100;
        const delta = target - start;
        const startedAt = performance.now();

        const tick = (now) => {
          const elapsed = now - startedAt;
          const t = clamp(elapsed / duration, 0, 1);
          const eased = easing(t);

          setPos(start + delta * eased);

          if (t < 1) {
            requestAnimationFrame(tick);
          } else {
            setPos(target);
            resolve();
          }
        };

        requestAnimationFrame(tick);
      });
    };

    function easeInOutCubic(t) {
      return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

    const playIntro = async () => {
      if (hasPlayedIntro) return;
      hasPlayedIntro = true;

      /*
        Wait until the images are actually decoded.
        This prevents the visual from appearing out of the blue mid-animation.
      */
      await waitForImages();

      if (prefersReducedMotion) {
        setPos(32);
        isInteractive = true;
        slider.classList.add("is-draggable");
        return;
      }

      isInteractive = false;
      slider.classList.remove("is-draggable");

      /*
        Timeline:
        1. Start at 100% = full left/before image.
        2. Sweep left to 0% = full right/after image.
        3. Hold.
        4. Return to 32%, then user can drag.
      */
      setPos(100);

      await wait(520);
      await animateTo(0, 2200, easeInOutCubic);
      await wait(3000);
      await animateTo(32, 1150, easeInOutCubic);

      isInteractive = true;
      slider.classList.add("is-draggable");
    };

    const startDrag = (event) => {
      if (!isInteractive) return;

      isDragging = true;
      activePointerId = event.pointerId;

      stage.setPointerCapture?.(activePointerId);
      slider.classList.add("is-dragging");

      setPos(getPercentFromClientX(event.clientX));
      event.preventDefault();
    };

    const moveDrag = (event) => {
      if (!isDragging || event.pointerId !== activePointerId) return;
      setPos(getPercentFromClientX(event.clientX));
    };

    const stopDrag = (event) => {
      if (!isDragging || event.pointerId !== activePointerId) return;

      isDragging = false;
      activePointerId = null;

      slider.classList.remove("is-dragging");
      stage.releasePointerCapture?.(event.pointerId);
    };

    stage.addEventListener("pointerdown", startDrag);
    stage.addEventListener("pointermove", moveDrag);
    stage.addEventListener("pointerup", stopDrag);
    stage.addEventListener("pointercancel", stopDrag);

    stage.addEventListener("lostpointercapture", () => {
      isDragging = false;
      activePointerId = null;
      slider.classList.remove("is-dragging");
    });

    handle.addEventListener("keydown", (event) => {
      if (!isInteractive) return;

      const currentRaw = getComputedStyle(slider).getPropertyValue("--ba-pos").trim();
      const current = parseFloat(currentRaw) || 32;

      if (event.key === "ArrowLeft") {
        setPos(current - 4);
        event.preventDefault();
      }

      if (event.key === "ArrowRight") {
        setPos(current + 4);
        event.preventDefault();
      }
    });

    /*
      Start later:
      Observe the slider itself, not the whole section.
      This means the text can enter first, then the visual starts once the
      user has properly reached the comparison image.
    */
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (!entry?.isIntersecting) return;

          playIntro();
          io.disconnect();
        },
        {
          threshold: 0.72,
          rootMargin: "-6% 0px -10% 0px",
        }
      );

      io.observe(slider);
    } else {
      playIntro();
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();

// ============== HOW SECTION: BACKGROUND PARALLAX ==============
(() => {
    const init = () => {
        const section = document.querySelector(".section--how");
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

            section.style.setProperty("--how-parallax-px", `${y.toFixed(2)}px`);
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

// ============== HOW SECTION: PAGE-FLIP BACKGROUND (tech drawing pages) ==============
(() => {
    const section = document.querySelector(".section--how");
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
    let bg = section.querySelector(".how-bg");
    if (!bg) {
        bg = document.createElement("div");
        bg.className = "how-bg";
        bg.innerHTML = `
      <div class="how-bg__page how-bg__a"></div>
      <div class="how-bg__page how-bg__b"></div>
    `;
        section.insertBefore(bg, section.firstChild);
        section.classList.add("how-bg-ready");
    }

    const a = bg.querySelector(".how-bg__a");
    const b = bg.querySelector(".how-bg__b");

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
        section.style.setProperty("--how-xfade-ms", `${XFADE_MS}ms`);
        section.style.setProperty("--how-blur", `${blurPx}px`);
        section.style.setProperty("--how-scale", `${scale}`);
        section.style.setProperty("--how-scale-ms", `${scaleMs}ms`);
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

            section.style.setProperty("--how-xfade-ms", `${Math.min(260, XFADE_MS)}ms`);
            swapTo(next, { blurPx: blur });

            flashIdx++;
            await new Promise((r) => setTimeout(r, INTRO_STEP_MS));
        }

        // land on page 1
        if (isVisible) {
            section.style.setProperty("--how-xfade-ms", `${Math.min(420, XFADE_MS)}ms`);
            swapTo(0, { blurPx: 0 });
            await new Promise((r) => setTimeout(r, Math.min(520, XFADE_MS)));
            section.style.setProperty("--how-xfade-ms", `${XFADE_MS}ms`);
        }

        flashing = false;
    }

    // ------------------ Content cinematic reveal ------------------
    function revealContent() {
        // add a class so CSS runs blur/opacity/translate reveal
        section.classList.add("how-content-in");
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

// ============== FINAL CTA: ONE-TIME LIQUID GLASS WOBBLE ==============
(() => {
  const init = () => {
    const section = document.querySelector(".final-cta");
    if (!section || section.__finalCtaLiquidInit) return;

    section.__finalCtaLiquidInit = true;

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduceMotion) return;

    let hasPlayed = false;

    const playLiquidWobble = () => {
      if (hasPlayed) return;
      hasPlayed = true;

      // Restart-safe: remove then re-add the class.
      section.classList.remove("is-liquid-active");

      requestAnimationFrame(() => {
        section.classList.add("is-liquid-active");
      });

      // Clean up after animation so hover/normal transforms stay predictable.
      window.setTimeout(() => {
        section.classList.remove("is-liquid-active");
      }, 1200);
    };

    if (!("IntersectionObserver" in window)) {
      playLiquidWobble();
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;

        playLiquidWobble();
        io.disconnect();
      },
      {
        threshold: 0.42,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    io.observe(section);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();

// ============== FINAL CTA: LIQUID PARTICLE BACKDROP REVEAL ==============
(() => {
  const init = () => {
    const section = document.querySelector("[data-final-cta-reveal]");
    if (!section || section.__finalCtaBgRevealInit) return;

    section.__finalCtaBgRevealInit = true;

    const prefersReducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    const reveal = () => {
      section.classList.add("is-bg-revealed");

      /*
        Keep your existing CTA wobble attention effect.
        If your current JS already adds is-liquid-active, this is harmless.
      */
      if (!prefersReducedMotion) {
        section.classList.add("is-liquid-active");
      }
    };

    if (prefersReducedMotion) {
      reveal();
      return;
    }

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];

          if (entry?.isIntersecting && entry.intersectionRatio >= 0.8) {
            reveal();
            io.disconnect();
          }
        },
        {
          threshold: [0, 0.25, 0.5, 0.8, 1],
          rootMargin: "0px",
        }
      );

      io.observe(section);
    } else {
      reveal();
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();


// BACKEND & FORM HANDLERS

// ============== NEWSLETTER POPUP & HANDLER (Attach to any trigger with [data-newsletter-trigger]) ==============
(() => {
  if (window.__OMNX_NEWSLETTER_POPUP_INIT) return;
  window.__OMNX_NEWSLETTER_POPUP_INIT = true;

  const TRIGGER_SELECTOR = '[data-newsletter-trigger]';

  // Build modal once
  const tpl = document.createElement('template');
  tpl.innerHTML = `
    <div class="omnx-newsletter-backdrop" data-newsletter-backdrop aria-hidden="true">
        <div class="omnx-newsletter-modal" role="dialog" aria-modal="true" aria-labelledby="omnxNewsletterTitle">
            
            <button class="showroom-expand omnx-expand omnx-newsletter-close" type="button" aria-label="Close">
                <svg
                    aria-hidden="true"
                    class="showroom-expand__icon"
                    focusable="false"
                    viewBox="0 0 24 24"
                >
                    <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-width="2"
                    ></path>
                </svg>
            </button>

            <div class="omnx-newsletter-body">
                <div class="eyebrow">OMNX NEWSLETTER</div>
                <h1 class="heading" id="omnxNewsletterTitle">Subscribe to get updates.</h1>
                <p class="subheading omnx-newsletter-sub">
                    Get the occasional email when we open trial waves, launch drops, or early member discounts.
                    Unsubscribe anytime.
                </p>

                <form
                  class="omnx-newsletter-form"
                  data-newsletter-form
                  data-omnx-form="newsletter-popup"
                  method="POST"
                  target="omnx_gas_iframe"
                  novalidate
                >
                  <input type="hidden" name="formType" value="newsletter">
                  <input type="text" name="_hp" value="" tabindex="-1" autocomplete="off"
                        style="position:absolute; left:-9999px; opacity:0;">

                  <label class="omnx-newsletter-label" for="omnxNewsletterEmail">Your email</label>
                  <input class="omnx-newsletter-input" id="omnxNewsletterEmail" name="email" type="email"
                  placeholder="name@email.com" autocomplete="email" inputmode="email" required />

                  <p class="policy secondary">By subscribing you agree to receive emails. Unsubscribe anytime. See <a class="policy-link secondary" href="privacy-notice.html">Privacy</a> Notice.</p>

                  <p class="omnx-newsletter-status" data-newsletter-status data-omnx-status aria-live="polite"></p>

                  <button class="cta-button primary omnx-newsletter-submit" type="submit">
                    <div class="button_label">Sign me up!</div>
                  </button>
                </form>
            </div>
        </div>
    </div>
  `.trim();

  const modalRoot = tpl.content.firstElementChild;
  document.body.appendChild(modalRoot);

  const backdrop = modalRoot;
  const dialog = modalRoot.querySelector('.omnx-newsletter-modal');
  const closeBtn = modalRoot.querySelector('.omnx-newsletter-close');
  const form = modalRoot.querySelector('[data-newsletter-form]');
  const emailInput = modalRoot.querySelector('#omnxNewsletterEmail');
  const statusEl = modalRoot.querySelector('[data-newsletter-status]');

  let lastFocus = null;
  let isOpen = false;

  const setStatus = (msg, tone = 'muted') => {
    statusEl.textContent = msg || '';
    statusEl.dataset.tone = tone; // muted | ok | warn | err
  };

  const resetUI = () => {
    setStatus('');
    form?.reset();
    emailInput?.removeAttribute('aria-invalid');
  };

  const open = (triggerEl) => {
    if (isOpen) return;
    isOpen = true;
    lastFocus = triggerEl || document.activeElement;

    resetUI();
    backdrop.setAttribute('aria-hidden', 'false');
    backdrop.classList.add('is-open');
    document.documentElement.classList.add('omnx-modal-lock');

    requestAnimationFrame(() => emailInput?.focus({ preventScroll: true }));
  };

  const close = () => {
    if (!isOpen) return;
    isOpen = false;

    backdrop.classList.add('is-closing');
    backdrop.classList.remove('is-open');
    document.documentElement.classList.remove('omnx-modal-lock');

    const done = () => {
      backdrop.classList.remove('is-closing');
      backdrop.setAttribute('aria-hidden', 'true');
      backdrop.removeEventListener('transitionend', done);
      try { lastFocus?.focus?.({ preventScroll: true }); } catch (_) { }
      lastFocus = null;
    };

    backdrop.addEventListener('transitionend', done);
    window.setTimeout(done, 260);
  };

  const bindTriggers = () => {
    document.querySelectorAll(TRIGGER_SELECTOR).forEach((el) => {
      if (el.__omnxBound) return;
      el.__omnxBound = true;

      el.addEventListener('click', (e) => {
        e.preventDefault();
        open(el);
      });
    });
  };

  bindTriggers();
  window.addEventListener('partials:loaded', bindTriggers);

  backdrop.addEventListener('pointerdown', (e) => {
    if (e.target === backdrop) close();
  });

  closeBtn.addEventListener('click', close);

  document.addEventListener('keydown', (e) => {
    if (!isOpen) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }

    if (e.key !== 'Tab') return;

    const focusables = dialog.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    const list = Array.from(focusables).filter((n) => n.offsetParent !== null);
    if (!list.length) return;

    const first = list[0];
    const last = list[list.length - 1];
    const active = document.activeElement;

    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  });
})();

// ============== OMNX FORMS BINDER (BACKEND) ==============
(() => {
  if (window.__OMNX_FORMS_V1) return;
  window.__OMNX_FORMS_V1 = true;

  const OMNX_GAS_EXEC = "https://script.google.com/macros/s/AKfycbxTSEz45GSbN0jfh4N83Et38mAGBQla-OAOv837x3lKPj0iMaY2Edsk2Njl_LIJKAOjeA/exec";

  const TIMEOUT_MS = 20000;

  const RESULT_TYPE_BY_FORMTYPE = {
    trial: "omnx_trial_result",
    newsletter: "omnx_newsletter_result",
    contact: "omnx_contact_result",
  };

  function ensureAction(form) {
    // If you ever want a form to *opt out*, give it data-omnx-action-manual
    if (form.hasAttribute("data-omnx-action-manual")) return;

    const attr = form.getAttribute("action"); // IMPORTANT: attribute, not property
    if (!attr || attr.trim() === "" || form.hasAttribute("data-omnx-action-auto")) {
      form.setAttribute("action", OMNX_GAS_EXEC);
    }
  }

  function ensureGasIframe() {
    let frame = document.querySelector('iframe[name="omnx_gas_iframe"]');
    if (frame) return frame;

    frame = document.createElement("iframe");
    frame.name = "omnx_gas_iframe";
    frame.style.display = "none";
    frame.setAttribute("aria-hidden", "true");
    document.body.appendChild(frame);
    return frame;
  }

  const makeState = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`;

  const isAppsScriptOrigin = (origin) =>
    origin === "https://script.google.com" ||
    origin === "https://script.googleusercontent.com" ||
    (origin && origin.endsWith(".googleusercontent.com"));

  // Track in-flight submits: state -> ctx
  const inflight = new Map();

  function getOrCreateHidden(form, name) {
    let el = form.querySelector(`input[name="${name}"]`);
    if (!el) {
      el = document.createElement("input");
      el.type = "hidden";
      el.name = name;
      form.appendChild(el);
    }
    return el;
  }

  function getFormType(form) {
    const el = form.querySelector('input[name="formType"]');
    return (el?.value || "contact").toString().trim().toLowerCase();
  }

  function setStatus(ctx, msg, color) {
    if (!ctx.statusEl) return;
    ctx.statusEl.textContent = msg || "";
    if (color) ctx.statusEl.style.color = color;
  }

  function setButton(ctx, { disabled, label }) {
    if (!ctx.submitBtn) return;
    ctx.submitBtn.disabled = !!disabled;
    const labelEl = ctx.submitLabelEl;
    if (labelEl && typeof label === "string") labelEl.textContent = label;
  }

  function bindOneForm(form) {
    if (form.__omnxBound) return;
    form.__omnxBound = true;

    const formType = getFormType(form);
    const resultType = RESULT_TYPE_BY_FORMTYPE[formType] || "omnx_contact_result";

    // Hooks (prefer data- attributes, fall back gracefully)
    const statusEl =
      form.querySelector("[data-omnx-status]") ||
      document.getElementById(
        formType === "trial" ? "trialStatus" :
          formType === "newsletter" ? "subscribeStatus" :
            "contactStatus"
      );

    const submitBtn =
      form.querySelector("[data-omnx-submit]") ||
      form.querySelector('button[type="submit"]');

    const submitLabelEl =
      form.querySelector("[data-omnx-submit-label]") ||
      submitBtn?.querySelector(".button_label") ||
      submitBtn;

    // Ensure state/origin exist + init
    const stateEl = getOrCreateHidden(form, "state");
    const originEl = getOrCreateHidden(form, "origin");
    originEl.value = window.location.origin;
    stateEl.value = makeState();

    // Optional: identify whether this form uses reCAPTCHA (trial/contact do, newsletter doesn’t)
    const needsRecaptcha = !!form.querySelector(".g-recaptcha");

    // Optional: forms might have their own “default” label
    const defaultLabel = submitLabelEl?.textContent?.trim() || "Submit";

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      // Browser-level validation
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      // reCAPTCHA gating only if widget exists on this form
      if (needsRecaptcha) {
        if (!window.grecaptcha) {
          setStatus({ statusEl }, "reCAPTCHA failed to load. Please refresh and try again.", "#f97373");
          return;
        }
        const token = window.grecaptcha.getResponse();
        if (!token) {
          setStatus({ statusEl }, "Please verify that you are not a robot.", "#f97373");
          return;
        }
      }

      // New correlation state for this submit
      const submitState = makeState();
      stateEl.value = submitState;
      originEl.value = window.location.origin;

      const ctx = {
        form,
        formType,
        resultType,
        statusEl,
        submitBtn,
        submitLabelEl,
        defaultLabel,
        needsRecaptcha,
      };

      inflight.set(submitState, ctx);

      setButton(ctx, { disabled: true, label: "Submitting…" });
      setStatus(ctx, "Submitting…", "#9ca3af");

      if (ctx._timeoutId) clearTimeout(ctx._timeoutId);

      ctx._timeoutId = setTimeout(() => {
        inflight.delete(submitState);
        setButton(ctx, { disabled: false, label: defaultLabel });
        setStatus(ctx, "No response from server. Please try again.", "#f97373");
        if (needsRecaptcha && window.grecaptcha) {
          try { window.grecaptcha.reset(); } catch (_) { }
        }
      }, TIMEOUT_MS);

      // Submit to Apps Script in hidden iframe (or normal target)
      form.submit();
    });
  }

  function bindAll() {
    document.querySelectorAll("form[data-omnx-form]").forEach((form) => {
      ensureGasIframe();
      if (!form.getAttribute("target")) form.setAttribute("target", "omnx_gas_iframe");
      ensureAction(form);
      bindOneForm(form);
    });
  }

  // Single global postMessage router
  window.addEventListener("message", (event) => {
    if (!isAppsScriptOrigin(event.origin)) return;

    let data = event.data;
    if (typeof data === "string") {
      try { data = JSON.parse(data); } catch { return; }
    }
    if (!data || typeof data !== "object") return;

    const state = data.state || "";
    if (!state) return;

    const ctx = inflight.get(state);
    if (!ctx) return; // not ours / stale
    if (data.type !== ctx.resultType) return; // Only accept if type matches expected (prevents cross-form bleed)

    inflight.delete(state);

    // Stop timeout
    if (ctx._timeoutId) {
      clearTimeout(ctx._timeoutId);
      ctx._timeoutId = null;
    }

    // For now: clear recaptcha + unlock UI.
    setButton(ctx, { disabled: false, label: ctx.defaultLabel });
    if (ctx.needsRecaptcha && window.grecaptcha) {
      try { window.grecaptcha.reset(); } catch (_) { }
    }

    if (data.ok) {
      // Success messaging can still be customised per formType:
      if (ctx.formType === "trial") {
        setStatus(ctx, "You're on the list. We'll email you when your trial wave opens (and you'll get early pricing).", "#4ade80");
      } else if (ctx.formType === "newsletter") {
        setStatus(ctx, "Welcome! You’re officially on the list.", "#4ade80");
      } else {
        setStatus(ctx, "Message sent. Thank you for reaching out!", "#4ade80");
      }

      ctx.form.reset();
    } else {
      const err = data.err || "unknown";

      // Generic error mapping (extend if you want)
      const msg =
        err === "duplicate" ? "That email is already registered." :
          err === "recaptcha" ? "reCAPTCHA verification failed. Please try again." :
            err === "missing" ? "Missing required fields. Please check and try again." :
              err === "rate" ? "Too many attempts. Please wait a minute and try again." :
                err === "email" ? "Email looks invalid. Please check and try again." :
                  err === "server" ? "Server configuration error. Please try again later." :
                    `Something went wrong (${err}). Please try again later.`;

      setStatus(ctx, msg, err === "duplicate" ? "#f59e0b" : "#f97373");
    }
  });

  // Bind forms (including after partial injection)
  document.addEventListener("DOMContentLoaded", bindAll);
  document.addEventListener("partials:loaded", bindAll);
})();