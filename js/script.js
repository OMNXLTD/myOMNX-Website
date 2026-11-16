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
        href: "https://myomnx.com",
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
        href: "https://myomnx.com",
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
        href: "https://myomnx.com",
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

  const root = document.documentElement;
  const viewport = window.visualViewport;
  let opener = null;
  let activeModal = null;
  let pagePosition = null;

  function getModalByName(name) {
    return document.querySelector(`[data-omnx-modal="${CSS.escape(name)}"]`);
  }

  function fitModalToViewport() {
    if (!activeModal || !viewport) return;
    activeModal.style.setProperty("--omnx-article-top", `${viewport.offsetTop}px`);
    activeModal.style.setProperty("--omnx-article-left", `${viewport.offsetLeft}px`);
    activeModal.style.setProperty("--omnx-article-width", `${viewport.width}px`);
    activeModal.style.setProperty("--omnx-article-height", `${viewport.height}px`);
  }

  function openOMNXModal(modal, trigger) {
    if (!modal || activeModal) return;

    opener = trigger;
    pagePosition = { x: window.scrollX, y: window.scrollY };
    root.style.setProperty("--omnx-article-page-top", `${-pagePosition.y}px`);
    root.style.setProperty("--omnx-article-page-left", `${-pagePosition.x}px`);
    root.style.setProperty("--omnx-article-page-width", `${root.clientWidth}px`);
    root.classList.add("omnx-article-open");
    activeModal = modal;
    fitModalToViewport();

    const scroller = modal.querySelector(".omnx-modal__scroll");
    if (scroller) scroller.scrollTop = 0;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");

    const closeButton = modal.querySelector(".omnx-modal__close");
    closeButton?.focus({ preventScroll: true });
  }

  function closeOMNXModal(modal = activeModal) {
    if (!modal || modal !== activeModal) return;

    activeModal = null;
    modal.classList.remove("is-open");
    root.classList.remove("omnx-article-open");
    root.style.removeProperty("--omnx-article-page-top");
    root.style.removeProperty("--omnx-article-page-left");
    root.style.removeProperty("--omnx-article-page-width");
    opener?.focus({ preventScroll: true });
    window.scrollTo({ left: pagePosition.x, top: pagePosition.y, behavior: "instant" });
    modal.setAttribute("aria-hidden", "true");
    opener = null;
    pagePosition = null;
  }

  openButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const modalName = button.getAttribute("data-omnx-modal-open");
      const modal = getModalByName(modalName);
      openOMNXModal(modal, button);
    });
  });

  modals.forEach((modal) => {
    modal.addEventListener("click", (event) => {
      if (event.target.matches("[data-omnx-modal-close]")) {
        closeOMNXModal(modal);
      }
    });
  });

  viewport?.addEventListener("resize", fitModalToViewport);
  viewport?.addEventListener("scroll", fitModalToViewport);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && activeModal) {
      closeOMNXModal(activeModal);
    }
  });
})();

// ================= OMGO PRODUCT FILMS =================
(() => {
  const dialog = document.querySelector("[data-omnx-film]");
  const triggers = document.querySelectorAll("[data-omnx-film-open]");
  if (!dialog || !triggers.length || dialog.__omnxFilmInit) return;
  dialog.__omnxFilmInit = true;

  const stage = dialog.querySelector("[data-omnx-film-stage]");
  const heading = dialog.querySelector("[data-omnx-film-heading]");
  const playerSlot = dialog.querySelector("[data-omnx-film-player]");
  const loading = dialog.querySelector("[data-omnx-film-loading]");
  const error = dialog.querySelector("[data-omnx-film-error]");
  const closeButton = dialog.querySelector("[data-omnx-film-close]");
  const retryButton = dialog.querySelector("[data-omnx-film-retry]");
  const root = document.documentElement;

  let open = false;
  let session = 0;
  let player = null;
  let sdkPromise = null;
  let loadTimer = null;
  let opener = null;
  let scrollPosition = { x: 0, y: 0 };
  let enteredFullscreen = false;
  let enteredPlayerFullscreen = false;
  let orientationAttempted = false;
  let orientationLocked = false;

  function fullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement;
  }

  function ownsFullscreen() {
    const element = fullscreenElement();
    return Boolean(element && (element === stage || stage.contains(element)));
  }

  function exitFullscreen() {
    if (!ownsFullscreen()) return;
    const exit = document.exitFullscreen || document.webkitExitFullscreen;
    if (!exit) return;
    try {
      Promise.resolve(exit.call(document)).catch(() => {});
    } catch (_) {
      // The browser may already have exited fullscreen.
    }
  }

  function setState(state) {
    stage.dataset.state = state;
    loading.hidden = state !== "loading";
    error.hidden = state !== "error";
    playerSlot.setAttribute("aria-busy", String(state === "loading"));
  }

  function removePlayer() {
    clearTimeout(loadTimer);
    const previousPlayer = player;
    player = null;
    // Removing the iframe stops video and audio even if the SDK is unavailable.
    playerSlot.replaceChildren();
    if (previousPlayer) previousPlayer.destroy().catch(() => {});
  }

  function loadSDK() {
    if (window.Vimeo?.Player) return Promise.resolve(window.Vimeo);
    if (sdkPromise) return sdkPromise;

    sdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      const timeout = setTimeout(() => fail(), 15000);

      function fail() {
        clearTimeout(timeout);
        script.remove();
        reject(new Error("Vimeo player could not load"));
      }

      script.src = "https://player.vimeo.com/api/player.js";
      script.async = true;
      script.onload = () => {
        clearTimeout(timeout);
        if (window.Vimeo?.Player) resolve(window.Vimeo);
        else fail();
      };
      script.onerror = fail;
      document.head.appendChild(script);
    }).catch((reason) => {
      sdkPromise = null;
      throw reason;
    });

    return sdkPromise;
  }

  function loadFilm() {
    const videoId = opener.dataset.omnxFilmOpen;
    const currentSession = ++session;
    const isCurrent = () => open && session === currentSession;
    removePlayer();
    setState("loading");

    function fail() {
      if (!isCurrent()) return;
      session++;
      removePlayer();
      setState("error");
    }

    const iframe = document.createElement("iframe");
    const url = new URL(`https://player.vimeo.com/video/${videoId}`);

    url.search = new URLSearchParams({
      autoplay: "0",
      autopause: "1",
      loop: "0",
      playsinline: "0",
      pip: "0",
      badge: "0",
      title: "0",
      byline: "0",
      portrait: "0",
    }).toString();
    url.searchParams.set("initial_quality", "4k");
    url.searchParams.set("quality", "4k");
    url.searchParams.set("preload", "auto");

    iframe.title = heading.textContent;
    iframe.allow = "fullscreen; encrypted-media; picture-in-picture 'none'";
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.tabIndex = -1;
    iframe.addEventListener("error", fail, { once: true });
    iframe.src = url.href;
    playerSlot.appendChild(iframe);
    loadTimer = setTimeout(fail, 25000);

    loadSDK().then(async (Vimeo) => {
      if (!isCurrent()) return;
      const film = new Vimeo.Player(iframe);
      player = film;
      film.on("error", ({ method } = {}) => {
        if (!method || method === "ready" || method === "loadVideo") fail();
      });
      film.on("fullscreenchange", ({ fullscreen }) => {
        if (!isCurrent()) return;
        if (fullscreen) enteredPlayerFullscreen = true;
        else if (enteredPlayerFullscreen && !ownsFullscreen()) closeFilm();
      });

      await film.ready();
      if (!isCurrent()) return;
      await film.pause();
      // Each opening has a fresh iframe at 0:00. Seeking before the first play
      // can itself start Vimeo playback, so do not reset with setCurrentTime().
      if (!isCurrent()) return;
      clearTimeout(loadTimer);
      iframe.tabIndex = 0;
      setState("ready");
    }).catch(fail);
  }

  function requestLandscape() {
    if (orientationAttempted || !screen.orientation?.lock) return;
    orientationAttempted = true;
    const currentSession = session;
    try {
      Promise.resolve(screen.orientation.lock("landscape")).then(() => {
        if (open && session === currentSession) orientationLocked = true;
        else screen.orientation.unlock();
      }).catch(() => {});
    } catch (_) {
      // Portrait remains usable when orientation locking is unsupported.
    }
  }

  function onFullscreenChange() {
    if (!open) return;
    if (ownsFullscreen()) {
      enteredFullscreen = true;
      requestLandscape();
    } else if (enteredFullscreen) {
      closeFilm();
    }
  }

  function openFilm(event) {
    event.preventDefault();
    if (open || !/^\d+$/.test(event.currentTarget.dataset.omnxFilmOpen)) return;
    opener = event.currentTarget;
    heading.textContent = opener.dataset.omnxFilmTitle || "OMGO product film";
    scrollPosition = { x: window.scrollX, y: window.scrollY };
    enteredFullscreen = false;
    enteredPlayerFullscreen = false;
    orientationAttempted = false;
    orientationLocked = false;
    open = true;

    root.style.setProperty("--omnx-film-scroll-y", `-${scrollPosition.y}px`);
    root.classList.add("omnx-film-open");
    dialog.showModal();
    closeButton.focus({ preventScroll: true });
    loadFilm();

    // Request synchronously from the click; waiting for Vimeo loses user activation.
    const request = stage.requestFullscreen || stage.webkitRequestFullscreen;
    if (request && !fullscreenElement()) {
      try {
        Promise.resolve(request.call(stage, { navigationUI: "hide" })).then(() => {
          if (open) onFullscreenChange();
          else exitFullscreen();
        }).catch(() => {});
      } catch (_) {
        // Keep the screen-filling dialog if native fullscreen is unavailable.
      }
    }
  }

  function closeFilm() {
    if (!open) return;
    open = false;
    session++;
    removePlayer();
    exitFullscreen();
    if (orientationLocked) {
      screen.orientation.unlock();
      orientationLocked = false;
    }
    if (dialog.open) dialog.close();
    root.classList.remove("omnx-film-open");
    root.style.removeProperty("--omnx-film-scroll-y");

    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(scrollPosition.x, scrollPosition.y);
    opener?.focus({ preventScroll: true });
    root.style.scrollBehavior = previousScrollBehavior;
  }

  triggers.forEach((trigger) => trigger.addEventListener("click", openFilm));
  closeButton.addEventListener("click", closeFilm);
  retryButton.addEventListener("click", () => {
    if (open) loadFilm();
  });
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeFilm();
  });
  dialog.addEventListener("close", () => {
    if (!dialog.open) closeFilm();
  });
  document.addEventListener("keydown", (event) => {
    if (open && event.key === "Escape") {
      event.preventDefault();
      closeFilm();
    }
  });
  document.addEventListener("fullscreenchange", onFullscreenChange);
  document.addEventListener("webkitfullscreenchange", onFullscreenChange);
})();

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

// ============== OMGO PRODUCT GALLERY ==============
document.querySelectorAll("[data-product-gallery]").forEach((gallery) => {
  const track = gallery.querySelector("[data-product-gallery-track]");
  const nav = gallery.querySelector("[data-product-gallery-nav]");
  const slides = Array.from(track?.children || []);
  if (!nav || slides.length < 2) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const idleMs = 10_000;
  const introThreshold = 0.70;
  const introDurationMs = 900;
  const introIndex = Math.min(2, slides.length - 1);
  let activeIndex = 0;
  let scrollFrame = 0;
  let drag = null;
  let touching = false;
  let inView = false;
  let introInView = false;
  let hasEntered = false;
  let idleTimer = 0;
  let introFrame = 0;
  let previousSnap = "";

  function goTo(index, instant = false) {
    const slide = slides[Math.max(0, Math.min(index, slides.length - 1))];
    const left = track.scrollLeft + slide.getBoundingClientRect().left - track.getBoundingClientRect().left;
    track.scrollTo({ left, behavior: instant || reducedMotion.matches ? "instant" : "smooth" });
  }

  function canAdvance() {
    return hasEntered && inView && !document.hidden && !reducedMotion.matches &&
      !introFrame && !drag && !touching && !gallery.querySelector(":focus-visible");
  }

  function scheduleAdvance() {
    clearTimeout(idleTimer);
    if (!canAdvance()) return;
    idleTimer = setTimeout(() => {
      if (!canAdvance()) return;
      goTo((activeIndex + 1) % slides.length);
      scheduleAdvance();
    }, idleMs);
  }

  function stopIntro(returnToFirst = false) {
    if (!introFrame) return;
    cancelAnimationFrame(introFrame);
    introFrame = 0;
    if (returnToFirst) track.scrollLeft = 0;
    track.style.scrollSnapType = previousSnap;
    setActiveIndex(Math.round(track.scrollLeft / track.clientWidth));
  }

  function playIntro() {
    previousSnap = track.style.scrollSnapType;
    track.style.scrollSnapType = "none";
    track.scrollLeft = track.clientWidth * introIndex;

    let start;
    function animate(now) {
      start ??= now;
      const progress = Math.min(1, (now - start) / introDurationMs);
      const eased = progress * progress * (3 - 2 * progress);
      track.scrollLeft = track.clientWidth * introIndex * (1 - eased);
      if (progress < 1) {
        introFrame = requestAnimationFrame(animate);
      } else {
        stopIntro(true);
        scheduleAdvance();
      }
    }
    introFrame = requestAnimationFrame(animate);
  }

  function takeControl() {
    hasEntered = true;
    stopIntro();
    clearTimeout(idleTimer);
  }

  function navigate(index) {
    takeControl();
    goTo(index);
    scheduleAdvance();
  }

  const dots = slides.map((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "omnx-product-gallery__dot";
    dot.setAttribute("aria-label", `Show photo ${index + 1} of ${slides.length}`);
    dot.setAttribute("aria-controls", track.id);
    dot.addEventListener("click", () => navigate(index));
    return dot;
  });

  dots[0].setAttribute("aria-current", "true");
  nav.replaceChildren(...dots);
  nav.hidden = false;

  function setActiveIndex(index) {
    const next = Math.max(0, Math.min(slides.length - 1, index));
    if (!Number.isFinite(next) || next === activeIndex) return;
    dots[activeIndex].removeAttribute("aria-current");
    dots[next].setAttribute("aria-current", "true");
    activeIndex = next;
  }

  track.addEventListener("scroll", () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      if (introFrame) return;
      setActiveIndex(Math.round(track.scrollLeft / track.clientWidth));
    });
  }, { passive: true });

  gallery.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const base = dots.includes(event.target) ? dots.indexOf(event.target) : activeIndex;
    const targets = { ArrowLeft: base - 1, ArrowRight: base + 1, Home: 0, End: slides.length - 1 };
    if (!Object.hasOwn(targets, event.key)) return;
    event.preventDefault();
    const index = Math.max(0, Math.min(targets[event.key], slides.length - 1));
    if (dots.includes(event.target)) dots[index].focus({ preventScroll: true });
    navigate(index);
  });

  // Let touch and trackpads use native scrolling; add dragging for a mouse.
  track.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    takeControl();
    drag = { id: event.pointerId, x: event.clientX, left: track.scrollLeft, index: activeIndex, moved: false };
    track.setPointerCapture(event.pointerId);
  });

  track.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const delta = event.clientX - drag.x;
    if (!drag.moved && Math.abs(delta) < 6) return;
    drag.moved = true;
    track.classList.add("is-dragging");
    track.scrollLeft = drag.left - delta;
  });

  function endDrag(event) {
    if (!drag || event.pointerId !== drag.id) return;
    const start = drag;
    drag = null;
    track.classList.remove("is-dragging");
    scheduleAdvance();
    if (!start.moved) return;
    const delta = event.clientX - start.x;
    const step = event.type === "pointerup" && Math.abs(delta) >= Math.min(60, track.clientWidth * 0.15)
      ? -Math.sign(delta)
      : 0;
    goTo(start.index + step);
  }

  track.addEventListener("pointerup", endDrag);
  track.addEventListener("pointercancel", endDrag);
  track.addEventListener("lostpointercapture", endDrag);

  track.addEventListener("touchstart", () => {
    touching = true;
    takeControl();
  }, { passive: true });

  function endTouch(event) {
    touching = event.touches.length > 0;
    scheduleAdvance();
  }
  track.addEventListener("touchend", endTouch, { passive: true });
  track.addEventListener("touchcancel", endTouch, { passive: true });

  track.addEventListener("wheel", () => {
    takeControl();
    scheduleAdvance();
  }, { passive: true });

  gallery.addEventListener("focusin", (event) => {
    if (event.target.matches(":focus-visible")) takeControl();
    scheduleAdvance();
  });
  gallery.addEventListener("focusout", () => requestAnimationFrame(scheduleAdvance));

  function updatePlayback() {
    if (!inView || document.hidden || reducedMotion.matches) {
      stopIntro(true);
      if (reducedMotion.matches && !hasEntered) goTo(0, true);
    } else if (introInView && !hasEntered) {
      hasEntered = true;
      playIntro();
    }
    scheduleAdvance();
  }

  if ("IntersectionObserver" in window) {
    if (!reducedMotion.matches) {
      goTo(introIndex, true);
      setActiveIndex(introIndex);
    }
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.intersectionRatio >= 0.25;
      introInView = entry.intersectionRatio >= introThreshold;
      updatePlayback();
    }, { threshold: [0.25, introThreshold] });
    observer.observe(gallery);
  }

  document.addEventListener("visibilitychange", updatePlayback);
  reducedMotion.addEventListener("change", updatePlayback);
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
    const knob = slider.querySelector(".before-after-slider__knob");
    const leftLabel = slider.querySelector(".before-after-slider__label--left");
    const rightLabel = slider.querySelector(".before-after-slider__label--right");
    const images = Array.from(slider.querySelectorAll("img"));

    if (!stage || !handle || !leftLabel || !rightLabel) return;

    const prefersReducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    let hasPlayedIntro = false;
    let isDragging = false;
    let isInteractive = false;
    let activePointerId = null;
    let labelTargetPercent = 100;
    let labelCurrentPercent = 100;
    let labelFrame = null;
    let labelFrameTime = 0;

    const labelMetrics = {
      stageWidth: 0,
      leftWidth: 0,
      rightWidth: 0,
      dividerGap: 32,
      edgeInset: 12,
    };

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

    const smoothstep = (edge0, edge1, value) => {
      const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
      return t * t * (3 - 2 * t);
    };

    const measureLabels = () => {
      labelMetrics.stageWidth = stage.clientWidth;
      labelMetrics.leftWidth = leftLabel.offsetWidth;
      labelMetrics.rightWidth = rightLabel.offsetWidth;

      const knobWidth = knob?.offsetWidth || 48;
      labelMetrics.dividerGap = clamp((knobWidth / 2) + 7, 28, 40);
      labelMetrics.edgeInset = clamp(labelMetrics.stageWidth * 0.02, 8, 16);
    };

    const getFitOpacity = (availableWidth, labelWidth) => {
      if (!labelWidth) return 0;

      /*
        Keep the label fully visible while it fits. Once it begins to run out
        of room, fade it quickly; the labels layer clips the final few pixels.
      */
      const fadeDistance = clamp(labelWidth * 0.2, 18, 28);
      return smoothstep(-fadeDistance, 8, availableWidth - labelWidth);
    };

    const renderLabels = (percent) => {
      const dividerX = labelMetrics.stageWidth * (percent / 100);
      const leftAnchor = dividerX - labelMetrics.dividerGap;
      const rightAnchor = dividerX + labelMetrics.dividerGap;

      const leftRoom = leftAnchor - labelMetrics.edgeInset;
      const rightRoom =
        labelMetrics.stageWidth - rightAnchor - labelMetrics.edgeInset;

      leftLabel.style.transform =
        `translate3d(${leftAnchor.toFixed(2)}px, 0, 0) translateX(-100%)`;
      rightLabel.style.transform =
        `translate3d(${rightAnchor.toFixed(2)}px, 0, 0)`;

      leftLabel.style.setProperty(
        "--ba-label-opacity",
        getFitOpacity(leftRoom, labelMetrics.leftWidth).toFixed(3)
      );
      rightLabel.style.setProperty(
        "--ba-label-opacity",
        getFitOpacity(rightRoom, labelMetrics.rightWidth).toFixed(3)
      );
    };

    const updateLabelFollow = (now) => {
      if (!labelFrameTime) labelFrameTime = now;

      const elapsed = Math.min(now - labelFrameTime, 64);
      const responseTime = isDragging ? 86 : 112;
      const followAmount = 1 - Math.exp(-elapsed / responseTime);

      labelCurrentPercent +=
        (labelTargetPercent - labelCurrentPercent) * followAmount;
      labelFrameTime = now;

      if (Math.abs(labelTargetPercent - labelCurrentPercent) < 0.015) {
        labelCurrentPercent = labelTargetPercent;
      }

      renderLabels(labelCurrentPercent);

      if (labelCurrentPercent !== labelTargetPercent) {
        labelFrame = requestAnimationFrame(updateLabelFollow);
      } else {
        labelFrame = null;
        labelFrameTime = 0;
      }
    };

    const queueLabelFollow = () => {
      if (prefersReducedMotion) {
        labelCurrentPercent = labelTargetPercent;
        renderLabels(labelCurrentPercent);
        return;
      }

      if (labelFrame === null) {
        labelFrame = requestAnimationFrame(updateLabelFollow);
      }
    };

    const setPos = (percent) => {
      const safe = clamp(percent, 0, 100);
      slider.style.setProperty("--ba-pos", `${safe.toFixed(2)}%`);
      handle.setAttribute("aria-valuenow", Math.round(safe).toString());
      handle.setAttribute(
        "aria-valuetext",
        `${Math.round(safe)}% recovery equipment, ${Math.round(100 - safe)}% recovery experience`
      );

      labelTargetPercent = safe;
      queueLabelFollow();
    };

    /*
      Important:
      Set this immediately so the section never appears in a confusing half-state.
      100% = full left/before image.
    */
    measureLabels();
    renderLabels(100);
    setPos(100);

    if ("ResizeObserver" in window) {
      const resizeObserver = new ResizeObserver(() => {
        measureLabels();
        renderLabels(labelCurrentPercent);
      });

      resizeObserver.observe(stage);
    } else {
      window.addEventListener("resize", () => {
        measureLabels();
        renderLabels(labelCurrentPercent);
      });
    }

    document.fonts?.ready.then(() => {
      measureLabels();
      renderLabels(labelCurrentPercent);
    });

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
        "assets/omgo-tech-drawing-page-1.webp",
        "assets/omgo-tech-drawing-page-2.webp",
        "assets/omgo-tech-drawing-page-3.webp",
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
            img.fetchPriority = "low";
            img.onload = () => res(true);
            img.onerror = () => res(false);
            img.src = url;
        });

    // Request the drawings at startup; entering the section only triggers playback.
    const drawingsReady = Promise.all(IMAGES.map(preload));

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

        await drawingsReady;

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
