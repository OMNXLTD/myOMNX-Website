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




// NAV

// ================= MEGA MENU =================
(function initMegaHoverDownOnly() {
  // Disable on mobile
  if (window.innerWidth < 1080) return;

  const MAX_TRIES = 40;
  let tries = 0;

  const trySetup = () => {
    const toggle = document.querySelector('.dropdown-toggle');   // the OMGO tab button
    const panel = document.getElementById('mega-products');     // the dropdown panel
    const navBar = document.querySelector('.nav_container');     // the fixed navbar
    const overlay = document.querySelector('.mega-overlay');      // optional blur layer (we won't use to close)

    if (!toggle || !panel || !navBar) {
      if (tries++ < MAX_TRIES) return void setTimeout(trySetup, 50);
      return;
    }

    // Make sure overlay doesn't interfere with the "below-only" behavior
    if (overlay) overlay.hidden = true;

    const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';

    const addAnim = (state) => {
      panel.classList.remove('anim-in', 'anim-out');
      if (state === 'out') panel.hidden = false; // let fade-out play
      panel.classList.add(state === 'in' ? 'anim-in' : 'anim-out');
    };

    const open = () => {
      if (isOpen()) return;
      toggle.setAttribute('aria-expanded', 'true');
      panel.hidden = false;
      addAnim('in');
    };

    const close = () => {
      if (!isOpen()) return;
      toggle.setAttribute('aria-expanded', 'false');
      addAnim('out');
      panel.addEventListener('animationend', () => {
        if (!isOpen()) panel.hidden = true;
      }, { once: true });
    };

    // Open ONLY when hovering the OMGO tab
    toggle.addEventListener('pointerenter', open);

    // Keep open while pointer is over navbar or panel — do nothing here.
    // We only close via a global pointermove check (downwards exit).

    // Helper: combined bottom edge (viewport Y) of nav + panel
    const getCombinedBottom = () => {
      const navB = navBar.getBoundingClientRect().bottom;
      const pnlB = panel.hidden ? navB : panel.getBoundingClientRect().bottom;
      return Math.max(navB, pnlB);
    };

    // Close only when the pointer moves BELOW that combined bottom edge
    let rafId = null;
    const onPointerMove = (e) => {
      if (!isOpen()) return;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const combinedBottom = getCombinedBottom();
        const y = e.clientY;
        // a tiny tolerance to ignore sub-pixel jitter
        if (y > combinedBottom + 2) {
          close();
        }
      });
    };

    // Listen at the document level so it works anywhere on the page
    document.addEventListener('pointermove', onPointerMove, { passive: true });

    // Prevent click from toggling
    // toggle.addEventListener('click', (e) => e.preventDefault());
    toggle.addEventListener("click", (e) => {
      const url = toggle.getAttribute("data-href") || "omgo.html";
      // Support ctrl/cmd click = open in new tab (since this is a <button>, we implement it)
      if (e.metaKey || e.ctrlKey) {
        window.open(url, "_blank", "noopener");
        return;
      }
      window.location.href = url;
    });

    // (Optional) keyboard a11y: uncomment to allow ESC close
    // document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  };

  trySetup();
})();

// ================= MOBILE NAV =================
function setupMobileNav() {
  const toggle = document.querySelector(".mobile-nav-toggle");
  const mobileMenu = document.querySelector(".mobile-menu");
  const closeBtn = document.querySelector(".mobile-menu-close");

  if (!toggle || !mobileMenu || !closeBtn) {
    console.warn("[MobileNav] Elements missing — cannot init");
    return;
  }

  let startX = 0;

  const openMenu = () => {
    mobileMenu.hidden = false;
    requestAnimationFrame(() => mobileMenu.classList.add("open"));
    toggle.setAttribute("aria-expanded", "true");
  };

  const closeMenu = () => {
    mobileMenu.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    setTimeout(() => {
      mobileMenu.hidden = true;
    }, 350);
  };

  toggle.onclick = openMenu;
  closeBtn.onclick = closeMenu;

  // Swipe LEFT to close
  mobileMenu.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
  });

  mobileMenu.addEventListener("touchmove", (e) => {
    const dx = e.touches[0].clientX - startX;
    if (dx < -90) closeMenu(); // slide left 90px
  });
}
// Run when partials are injected
document.addEventListener("partials:loaded", () => {
  console.log("partials loaded → init mobile nav");
  setupMobileNav();
});




// UI

// ============== CARDS REVEAL ANIMATION ==============
(() => {
  try {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Prefer any page-specific scroll-restore helper if present (note: top-level const isn't on window).
    const afterScrollRestore =
      (typeof __omgoAfterScrollRestore === "function" && __omgoAfterScrollRestore) ||
      (typeof __cardsAfterScrollRestore === "function" && __cardsAfterScrollRestore) ||
      (typeof window.__omgoAfterScrollRestore === "function" && window.__omgoAfterScrollRestore) ||
      (typeof window.__cardsAfterScrollRestore === "function" && window.__cardsAfterScrollRestore) ||
      ((cb) => cb(window.scrollY || 0));

    const navHeight = () => {
      const raw = getComputedStyle(document.documentElement)
        .getPropertyValue("--nav-height")
        .trim();
      const v = parseFloat(raw);
      return Number.isFinite(v) ? v : 0;
    };

    function armCards(section, cardsSelector) {
      const cards = Array.from(section.querySelectorAll(cardsSelector));
      cards.forEach((card, i) => {
        if (!card.hasAttribute("data-reveal-card")) card.setAttribute("data-reveal-card", "");
        card.style.setProperty("--reveal-i", String(i));
      });
      return cards;
    }

    function revealNoAnim(section) {
      section.classList.add("reveal-noanim");
      section.classList.add("is-revealed");
      requestAnimationFrame(() => section.classList.remove("reveal-noanim"));
    }

    function oneTimeSectionReveal({
      section,
      cardsSelector,
      triggerSelector,
      rootMargin = "-30% 0px 0% 0px",
      threshold = 0.12
    }) {
      if (!section) return;
      if (section.__revealArmed) return; // only once
      section.__revealArmed = true;

      const cards = armCards(section, cardsSelector);
      if (!cards.length) return;

      const trigger = triggerSelector ? section.querySelector(triggerSelector) : section;

      const doReveal = () => {
        if (section.__revealed) return;
        section.__revealed = true;

        requestAnimationFrame(() => {
          void section.offsetHeight; // reflow barrier
          requestAnimationFrame(() => section.classList.add("is-revealed"));
        });
      };

      afterScrollRestore((y0) => {
        if (!trigger || !("IntersectionObserver" in window)) {
          doReveal();
          return;
        }

        // If page loads already at/within/below this section -> show instantly (no reveal)
        const rect0 = trigger.getBoundingClientRect();
        const triggerDocTop = (window.scrollY || 0) + rect0.top;
        const snapY = Math.max(0, triggerDocTop - navHeight() - 12);
        const loadedAbove = y0 < (snapY - 2);

        const hashJump = !!(location.hash && location.hash.length > 1);

        if (prefersReducedMotion || !loadedAbove || hashJump) {
          section.__revealed = true;
          revealNoAnim(section);
          return;
        }

        const io = new IntersectionObserver(
          (entries) => {
            const hit = entries.some((e) => e.isIntersecting || e.intersectionRatio > 0);
            if (!hit) return;
            doReveal();
            io.disconnect();
          },
          { root: null, rootMargin, threshold }
        );

        io.observe(trigger);
      });
    }

    // Showroom cards
    oneTimeSectionReveal({
      section: document.querySelector("#omgo-lineup"),
      cardsSelector: ".showroom-card",
      triggerSelector: ".showroom__grid",
      rootMargin: "-30% 0px -25% 0px",
      threshold: 0.14
    });

    // Carousel cards
    document
      .querySelectorAll("[data-omnx-carousel]")
      .forEach((carousel) => {
        const sectionEl = carousel.closest("section") || carousel;
        oneTimeSectionReveal({
          section: sectionEl,
          cardsSelector: "[data-omnx-card], [data-why-card], [data-how-card]",
          triggerSelector: ".omnx-carousel__navWrap, .why-carousel__navWrap, .how-carousel__navWrap",
          rootMargin: "-10% 0px 15% 0px",
          threshold: 0.12,
        });
      });
  } catch (err) {
    console.warn("[OMNX] reveal disabled:", err);
  }
})();

// ============== OMNX-style carousel ==============
(() => {
  try {
    const roots = Array.from(document.querySelectorAll("[data-omnx-carousel]"));
    if (!roots.length) return;

    // Create/find ONE shared backdrop for the whole page (important)
    let backdrop =
      document.querySelector("[data-showroom-backdrop]") ||
      document.querySelector(".showroom-backdrop.omnx-backdrop");

    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.className = "showroom-backdrop omnx-backdrop";
      backdrop.setAttribute("aria-hidden", "true");
      document.body.appendChild(backdrop);
    }

    // Global close helper (works across multiple carousels)
    const closeAnyOpen = () => {
      const open = document.querySelector(".showroom-card.is-expanded");
      if (open && typeof open.__howClose === "function") open.__howClose();
    };

    // Only bind backdrop/ESC once
    if (!window.__omnxBackdropBound) {
      window.__omnxBackdropBound = true;
      backdrop.addEventListener("click", closeAnyOpen);
      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeAnyOpen();
      });
    }
    const initCarousel = (root) => {
      const track = root.querySelector("[data-omnx-track]");
      const prevBtn = root.querySelector("[data-omnx-prev]");
      const nextBtn = root.querySelector("[data-omnx-next]");
      const cards = Array.from(root.querySelectorAll("[data-omnx-card]"));

      if (!track || !prevBtn || !nextBtn || !cards.length) return;

      // -------- carousel navigation --------
      const getStep = () => {
        const first = cards[0];
        if (!first) return 360;

        const cardW = first.getBoundingClientRect().width || 360;
        const gapRaw = getComputedStyle(track).gap || "24px";
        const gap = Number.parseFloat(gapRaw) || 24;
        return cardW + gap;
      };

      const updateNav = () => {
        const maxScroll = track.scrollWidth - track.clientWidth;
        const x = track.scrollLeft;
        prevBtn.disabled = x <= 2;
        nextBtn.disabled = x >= (maxScroll - 2);
      };

      const scrollByCard = (dir) => {
        track.scrollBy({ left: dir * getStep(), behavior: "smooth" });
      };

      prevBtn.addEventListener("click", () => scrollByCard(-1));
      nextBtn.addEventListener("click", () => scrollByCard(1));
      track.addEventListener("scroll", updateNav, { passive: true });

      track.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          scrollByCard(-1);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          scrollByCard(1);
        }
      });

      // -------- modal / expansion (mirrors why-carousel) --------
      const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

      const setBackdropOpen = (open) => {
        backdrop.classList.toggle("is-open", open);
        backdrop.setAttribute("aria-hidden", open ? "false" : "true");
      };

      const setRootModalOpen = (open) => {
        // Use the same convention as the OMGO showroom/why modal (if present).
        document.documentElement.classList.toggle("showroom-modal-open", open);

        // Prevent layout shift when scrollbar disappears (desktop).
        if (open) {
          const scrollBarW = window.innerWidth - document.documentElement.clientWidth;
          if (scrollBarW > 0) document.documentElement.style.paddingRight = `${scrollBarW}px`;
        } else {
          document.documentElement.style.paddingRight = "";
        }
      };

      const getExpandedTargetRect = () => {
        // Match OMGO Mini/Sphere showroom sizing
        const w = Math.min(980, window.innerWidth * 0.92);
        const h = Math.min(window.innerHeight * 0.84, 760);

        const width = Math.max(320, Math.round(w));
        const height = Math.max(420, Math.round(h));

        const left = Math.max(0, Math.round((window.innerWidth - width) / 2));
        const top = Math.max(0, Math.round((window.innerHeight - height) / 2));

        return { left, top, width, height };
      };

      const animateTo = (el, rect) => {
        el.style.left = `${rect.left}px`;
        el.style.top = `${rect.top}px`;
        el.style.width = `${rect.width}px`;
        el.style.height = `${rect.height}px`;
      };

      const clearInlineGeometry = (el) => {
        el.style.left = "";
        el.style.top = "";
        el.style.width = "";
        el.style.height = "";
      };

      const isExpanded = (card) => card.classList.contains("is-expanded");

      const attachExpansion = (card) => {
        const expandBtn = card.querySelector("[data-expand]");
        const expandedPanel = card.querySelector(".showroom-card__expanded");
        const expandedTop = card.querySelector(".showroom-card__expandedTop");

        if (!expandBtn || !expandedPanel || !expandedTop) return;

        // We'll move the media into the expandedTop while open (exactly like why-carousel).
        const media = card.querySelector(".showroom-card__media");
        const mediaHome = media ? media.parentElement : null;
        const mediaNextSibling = media ? media.nextSibling : null;

        const moveMediaToExpanded = () => {
          if (!media) return;
          expandedTop.appendChild(media);
        };

        const restoreMedia = () => {
          if (!media || !mediaHome) return;
          if (mediaNextSibling && mediaNextSibling.parentNode === mediaHome) {
            mediaHome.insertBefore(media, mediaNextSibling);
          } else {
            mediaHome.appendChild(media);
          }
        };

        const open = () => {
          if (isExpanded(card)) return;

          // Record scroll position of the carousel so we can restore exactly.
          const savedScrollLeft = track.scrollLeft;

          // Placeholder keeps the carousel layout stable.
          const r = card.getBoundingClientRect();
          const spacer = document.createElement("div");
          spacer.className = "showroom-card__spacer omnx-card__spacer";
          spacer.style.flex = "0 0 auto";
          spacer.style.width = `${Math.round(r.width)}px`;
          spacer.style.height = `${Math.round(r.height)}px`;

          // Insert placeholder and move card to body (avoids overflow/transform clipping).
          card.parentNode.insertBefore(spacer, card);
          document.body.appendChild(card);

          // Start from the card's original on-screen rect.
          const start = {
            left: Math.round(r.left),
            top: Math.round(r.top),
            width: Math.round(r.width),
            height: Math.round(r.height),
          };

          // Become fixed and set start geometry immediately.
          card.classList.add("is-animating");
          card.style.position = "fixed";
          card.style.margin = "0";
          animateTo(card, start);

          // Mark expanded (this reveals the expanded panel via existing showroom CSS)
          card.classList.add("is-expanded");
          card.classList.add("is-expanding");
          expandedPanel.setAttribute("aria-hidden", "false");
          setBackdropOpen(true);
          setRootModalOpen(true);

          // Move media into expanded top for a proper “hero dock” animation.
          moveMediaToExpanded();

          // Restore carousel scroll now that the DOM changed.
          track.scrollLeft = savedScrollLeft;

          // Animate to target rect.
          const target = getExpandedTargetRect();
          const doAnim = () => {
            if (!prefersReducedMotion) {
              requestAnimationFrame(() => animateTo(card, target));
            } else {
              animateTo(card, target);
            }
          };
          doAnim();

          // Finish animation: let expandedTop dock back to 34% and show body.
          const finish = () => {
            card.classList.remove("is-expanding");
            card.classList.remove("is-animating");
            // Keep position fixed; geometry stays inline while expanded.
          };

          if (prefersReducedMotion) {
            finish();
          } else {
            const onEnd = (e) => {
              // Width/height/left/top transitions can all fire; we only need the first.
              card.removeEventListener("transitionend", onEnd);
              finish();
            };
            card.addEventListener("transitionend", onEnd);
          }

          // Store close hook on the node (used by backdrop/esc).
          card.__howClose = () => close(spacer, savedScrollLeft);
        };

        const close = (spacer, restoreScrollLeft) => {
          if (!isExpanded(card)) return;

          const endRect = spacer.getBoundingClientRect();

          // During close, keep expandedTop full height to avoid jump.
          card.classList.add("is-expanding");
          card.classList.add("is-animating");

          // Animate back to placeholder position/size.
          if (!prefersReducedMotion) {
            requestAnimationFrame(() => {
              animateTo(card, {
                left: Math.round(endRect.left),
                top: Math.round(endRect.top),
                width: Math.round(endRect.width),
                height: Math.round(endRect.height),
              });
            });
          } else {
            animateTo(card, {
              left: Math.round(endRect.left),
              top: Math.round(endRect.top),
              width: Math.round(endRect.width),
              height: Math.round(endRect.height),
            });
          }

          // Hide modal/backdrop now (keeps UI responsive while animating back).
          expandedPanel.setAttribute("aria-hidden", "true");
          setBackdropOpen(false);
          setRootModalOpen(false);

          const cleanup = () => {
            // Restore DOM position
            spacer.parentNode.insertBefore(card, spacer);
            spacer.remove();

            // Remove expanded classes
            card.classList.remove("is-expanded", "is-expanding", "is-animating");

            // Restore media
            restoreMedia();

            // Clear inline geometry so the carousel styles apply again
            card.style.position = "";
            card.style.margin = "";
            clearInlineGeometry(card);

            // Restore exact scroll
            track.scrollLeft = restoreScrollLeft;

            card.__howClose = null;
          };

          if (prefersReducedMotion) {
            cleanup();
          } else {
            const onEnd = () => {
              card.removeEventListener("transitionend", onEnd);
              cleanup();
            };
            card.addEventListener("transitionend", onEnd);
          }
        };

        expandBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();

          if (isExpanded(card)) {
            const closer = card.__howClose;
            if (typeof closer === "function") closer();
            return;
          }
          open();
        });
      };

      cards.forEach(attachExpansion);

      // Backdrop closes the currently open card
      backdrop.addEventListener("click", () => {
        const open = cards.find((c) => c.classList.contains("is-expanded"));
        if (open && typeof open.__howClose === "function") open.__howClose();
      });

      window.addEventListener("keydown", (e) => {
        if (e.key !== "Escape") return;
        const open = cards.find((c) => c.classList.contains("is-expanded"));
        if (open && typeof open.__howClose === "function") open.__howClose();
      });

      updateNav();
      window.addEventListener("load", updateNav, { once: true });
      window.addEventListener("resize", updateNav, { passive: true });
    };

    roots.forEach(initCarousel);
  } catch (err) {
    console.warn("[ABOUT] how carousel disabled:", err);
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