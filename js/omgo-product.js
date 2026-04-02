// ---- OMGO SHOW ROOM + USPs/Features ----
(() => {
    const section = document.querySelector('.section--showroom');
    if (!section) return;

    const backdrop = document.querySelector('[data-showroom-backdrop]');
    const cards = Array.from(section.querySelectorAll('.showroom-card'));
    if (cards.length === 0) return;

    // ===================== CONFIG (edit here) =====================
    // NOTE: Do not change MINI config/content here unless you intentionally want to update it.
    const MINI_COLOURS = [
        { name: 'Champagne Ice', value: '#F7E6CA' },
        { name: 'Almost Aqua', value: '#C9D3C0' },
        { name: 'Night Blue', value: '#0E3A53' },
        { name: 'Maroon', value: '#6F263D' },
        { name: 'Peach Dust', value: '#F2DCCD' },
    ];

    const MINI = {
        defaultView: 1, // 0..3
        defaultColourIndex: 0, // 0..(MINI_COLOURS.length - 1)
        bgSrc: (view) => `assets/omgo-mini-bg-${view}.jpg`,
        maskSrc: (view) => `assets/omgo-mini-mask-${view}.png`,
        colours: MINI_COLOURS,
    };

    // OMGO Sphere: 4 styles, each style has 6 colour-groups (cg1..cg6).
    // The available masks can differ by view. This implementation auto-detects missing masks
    // (if a given mask PNG doesn't exist for a view, it is simply skipped).
    const SPHERE_STYLES = [
        {
            name: 'Playful Momentum',
            colours: [
                { name: 'Cloud Milk', value: '#FAFAF7' },
                { name: 'Peach Pop', value: '#F6A38B' },
                { name: 'Bubble Coral', value: '#F26A6A' },
                { name: 'Sky Sprint', value: '#6FAFE8' },
                { name: 'Fresh Lime', value: '#8ED081' },
                { name: 'Midnight Navy', value: '#1F2A44' },
            ],
        },
        {
            name: 'Grounded Recovery',
            colours: [
                { name: 'Warm Limestone', value: '#ECE8E2' },
                { name: 'Clay Skin', value: '#C6A28C' },
                { name: 'Recovery Sage', value: '#7FAE9B' },
                { name: 'Deep Forest', value: '#2F5D50' },
                { name: 'Evening Sand', value: '#B8A07C' },
                { name: 'Stone Charcoal', value: '#3A3A3A' },
            ],
        },
        {
            name: 'Future Flow',
            colours: [
                { name: 'Soft Vapor', value: '#F2F7F6' },
                { name: 'Almost Aqua', value: '#9EDFD6' },
                { name: 'Neural Mint', value: '#5ED4B8' },
                { name: 'Digital Teal', value: '#1FA6A0' },
                { name: 'Signal Indigo', value: '#3C4FA3' },
                { name: 'Midnight Core', value: '#1C2230' },
            ],
        },
    ];

    const SPHERE = {
        defaultView: 1, // 0..3
        defaultStyleIndex: 0, // 0..(MINI_COLOURS.length - 1)
        bgSrc: (view) => `assets/omgo-sphere-bg-${view}.jpg`,
        maskSrc: (view, cg) => `assets/omgo-sphere-mask-${view}-cg${cg}.png`,
        styles: SPHERE_STYLES,
        maxGroups: 6,
    };

    // ===================== helpers =====================
    const imgOkCache = new Map(); // src -> Promise<boolean>
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;

    // Unified mask look for all cards (Blender output lighting/shading).
    const MASK_STYLE = {
        mixBlendMode: 'multiply',
        filter: 'brightness(1) saturate(1.1)',
        opacity: '0.7',
    };

    function syncPickerButtons(pickerEl, count) {
        if (!pickerEl) return [];

        // Ensure the thumb exists as the first child
        let thumb = pickerEl.querySelector('.showroom-colors__thumb');
        if (!thumb) {
            thumb = document.createElement('div');
            thumb.className = 'showroom-colors__thumb';
            thumb.setAttribute('aria-hidden', 'true');
            pickerEl.insertBefore(thumb, pickerEl.firstChild);
        }

        // Existing buttons
        const existing = Array.from(pickerEl.querySelectorAll('button[data-colour]'));

        // Create missing buttons
        for (let i = existing.length; i < count; i++) {
            const b = document.createElement('button');
            b.className = 'showroom-color';
            b.type = 'button';
            b.dataset.colour = String(i);
            b.title = `Option ${i + 1}`;
            b.setAttribute('aria-label', `Option ${i + 1}`);
            pickerEl.appendChild(b);
        }

        // Re-collect all (now includes new)
        const all = Array.from(pickerEl.querySelectorAll('button[data-colour]'));

        // Hide extras, normalize indices 0..count-1
        all.forEach((b, idx) => {
            if (idx < count) {
                b.style.display = '';
                b.disabled = false;
                b.setAttribute('aria-hidden', 'false');
                b.dataset.colour = String(idx);
            } else {
                b.style.display = 'none';
                b.disabled = true;
                b.setAttribute('aria-hidden', 'true');
            }
        });

        return all.slice(0, count);
    }

    function setRootModalOpen(open) {
        document.documentElement.classList.toggle('showroom-modal-open', !!open);
        document.body.classList.toggle('showroom-modal-open', !!open);
    }

    function setBackdropOpen(open) {
        if (!backdrop) return;
        backdrop.classList.toggle('is-open', !!open);
        backdrop.setAttribute('aria-hidden', open ? 'false' : 'true');
    }

    function clamp(n, lo, hi) {
        return Math.max(lo, Math.min(hi, n));
    }

    function ensureImageOk(src) {
        if (!src) return Promise.resolve(false);
        if (!imgOkCache.has(src)) {
            const prom = new Promise((resolve) => {
                const img = new Image();
                let done = false;
                const ok = () => { if (done) return; done = true; resolve(true); };
                const bad = () => { if (done) return; done = true; resolve(false); };
                img.onload = ok;
                img.onerror = bad;
                img.src = src;
                if (img.decode) img.decode().then(ok).catch(() => { });
            });
            imgOkCache.set(src, prom);
        }
        return imgOkCache.get(src);
    }

    function prepareMaskWrap(maskWrap, matchEl) {
        if (!maskWrap) return;

        // Make this element a full-bleed overlay over the hero image.
        if (!maskWrap.__maskPrepared) {
            maskWrap.style.position = 'absolute';
            maskWrap.style.inset = '0';
            maskWrap.style.width = '100%';
            maskWrap.style.height = '100%';
            maskWrap.style.display = 'block';
            maskWrap.style.pointerEvents = 'none';
            maskWrap.style.zIndex = '1';
            maskWrap.__maskPrepared = true;
        }

        // Mirror transform & origin from the hero image so the mask aligns with object-fit crop.
        if (matchEl) {
            const cs = getComputedStyle(matchEl);
            const t = cs.transform;
            maskWrap.style.transform = t && t !== 'none' ? t : 'none';
            maskWrap.style.transformOrigin = cs.transformOrigin || '50% 50%';

            // Mirror object-position (covers future tweaks like top/left crops).
            const op = cs.objectPosition;
            maskWrap.__maskObjectPosition = op || 'center';

            // IMPORTANT: set this on the container too (Mini uses container-masking)
            maskWrap.style.webkitMaskPosition = maskWrap.__maskObjectPosition;
            maskWrap.style.maskPosition = maskWrap.__maskObjectPosition;
        } else {
            maskWrap.style.transform = 'none';
            maskWrap.style.transformOrigin = '50% 50%';
            maskWrap.__maskObjectPosition = 'center';
            maskWrap.style.webkitMaskPosition = 'center';
            maskWrap.style.maskPosition = 'center';
        }
    }

    function applyVisualForSingle(maskWrap, colour) {
        if (!maskWrap) return;

        // Same visual model as your original MINI implementation:
        // The CONTAINER is the masked+tinted surface.
        maskWrap.style.backgroundColor = colour || 'transparent';
        maskWrap.style.mixBlendMode = MASK_STYLE.mixBlendMode; // multiply
        maskWrap.style.filter = MASK_STYLE.filter;             // brightness/saturate
        maskWrap.style.opacity = MASK_STYLE.opacity;           // 0.7

        maskWrap.style.webkitMaskRepeat = 'no-repeat';
        maskWrap.style.maskRepeat = 'no-repeat';

        // Position is managed by prepareMaskWrap() (mirrors hero image object-position).
        if (!maskWrap.style.webkitMaskPosition) {
            maskWrap.style.webkitMaskPosition = maskWrap.__maskObjectPosition || 'center';
            maskWrap.style.maskPosition = maskWrap.__maskObjectPosition || 'center';
        }

        maskWrap.style.webkitMaskSize = 'cover';
        maskWrap.style.maskSize = 'cover';
    }

    function applyLayerVisualForStack(layer, colour, objectPosition) {
        layer.style.backgroundColor = colour || 'transparent';

        // IMPORTANT: do NOT multiply per-layer (prevents colour shift from overlap)
        layer.style.mixBlendMode = 'normal';
        layer.style.filter = 'none';
        layer.style.opacity = '1';

        layer.style.webkitMaskRepeat = 'no-repeat';
        layer.style.maskRepeat = 'no-repeat';
        layer.style.webkitMaskPosition = objectPosition || 'center';
        layer.style.maskPosition = objectPosition || 'center';
        layer.style.webkitMaskSize = 'cover';
        layer.style.maskSize = 'cover';
    }

    async function loadMaskSingle(maskWrap, src, colour, matchEl) {
        if (!maskWrap || !src) return;
        prepareMaskWrap(maskWrap, matchEl);

        // If this maskWrap previously had stacked layers (or any leftover), remove them.
        // (This restores the original Mini behaviour: the container itself is the mask surface.)
        if (maskWrap.querySelector('.showroom-mask-layer')) {
            maskWrap.innerHTML = '';
        }

        // Anti-race token
        const reqId = (maskWrap.__maskReqId = (maskWrap.__maskReqId || 0) + 1);

        const ok = await ensureImageOk(src);
        if (maskWrap.__maskReqId != reqId) return;
        if (!ok) {
            // Hide if missing
            maskWrap.style.backgroundColor = 'transparent';
            maskWrap.style.mixBlendMode = '';
            maskWrap.style.filter = '';
            maskWrap.style.opacity = '';
            maskWrap.style.webkitMaskImage = '';
            maskWrap.style.maskImage = '';
            maskWrap.dataset.maskSrc = '';
            return;
        }

        applyVisualForSingle(maskWrap, colour);

        if (maskWrap.dataset.maskSrc !== src) {
            const url = `url("${src}")`;
            maskWrap.style.webkitMaskImage = url;
            maskWrap.style.maskImage = url;
            maskWrap.dataset.maskSrc = src;
        }
    }

    async function loadMaskStack(maskWrap, layers, matchEl) {
        if (!maskWrap) return;
        prepareMaskWrap(maskWrap, matchEl);

        // Apply the Blender-tint look ONCE for the whole stack (prevents multiply compounding)
        maskWrap.style.mixBlendMode = MASK_STYLE.mixBlendMode;
        maskWrap.style.filter = MASK_STYLE.filter;
        maskWrap.style.opacity = MASK_STYLE.opacity;

        const reqId = (maskWrap.__maskReqId = (maskWrap.__maskReqId || 0) + 1);
        const objectPosition = maskWrap.__maskObjectPosition || 'center';

        // Ensure all layer elements exist (max 6, stable nodes for performance).
        for (let i = 0; i < layers.length; i++) {
            let layerEl = maskWrap.querySelector(`:scope > .showroom-mask-layer[data-layer="${i}"]`);
            if (!layerEl) {
                layerEl = document.createElement('div');
                layerEl.className = 'showroom-mask-layer';
                layerEl.dataset.layer = String(i);
                layerEl.style.position = 'absolute';
                layerEl.style.inset = '0';
                layerEl.style.pointerEvents = 'none';
                layerEl.style.zIndex = String(1 + i);
                maskWrap.appendChild(layerEl);
            }
        }

        const oks = await Promise.all(layers.map((l) => ensureImageOk(l.src)));
        if (maskWrap.__maskReqId != reqId) return; // outdated

        for (let i = 0; i < layers.length; i++) {
            const { src, colour } = layers[i];
            const ok = oks[i];
            const layerEl = maskWrap.querySelector(`:scope > .showroom-mask-layer[data-layer="${i}"]`);
            if (!layerEl) continue;

            if (!ok) { layerEl.style.display = 'none'; continue; }

            layerEl.style.display = 'block';
            applyLayerVisualForStack(layerEl, colour, objectPosition);

            if (layerEl.dataset.maskSrc !== src) {
                const url = `url("${src}")`;
                layerEl.style.webkitMaskImage = url;
                layerEl.style.maskImage = url;
                layerEl.dataset.maskSrc = src;
            }
        }
    }

    function getExpandedTargetRect() {
        const w = Math.min(980, window.innerWidth * 0.92);
        const h = Math.min(window.innerHeight * 0.84, 760);
        return {
            width: Math.max(320, w),
            height: Math.max(420, h),
            left: Math.max(0, (window.innerWidth - w) / 2),
            top: Math.max(0, (window.innerHeight - h) / 2),
        };
    }

    // ===================== expansion wiring (shared) =====================
    let openCard = null;

    function attachExpansion(card) {
        const expandBtn = card.querySelector('[data-expand]');
        const expandText = card.querySelector('[data-expand-text]');
        const expandedTop = card.querySelector('[data-expanded-top]');
        const expandedPanel = card.querySelector('.showroom-card__expanded');
        const media = card.querySelector('.showroom-card__media');

        function setExpandLabel(expanded) {
            if (!expandText) return;
            expandText.textContent = expanded ? 'X' : 'Features & specs +';
        }

        function moveMediaToExpanded() {
            if (!media || !expandedTop) return;
            if (media.parentElement !== expandedTop) expandedTop.appendChild(media);
        }

        function moveMediaToCompact(home) {
            if (!media || !home) return;
            if (media.parentElement !== home) home.insertBefore(media, home.firstChild);
        }

        function clearModalInlineStyles(el) {
            el.style.position = '';
            el.style.left = '';
            el.style.top = '';
            el.style.width = '';
            el.style.height = '';
            el.style.margin = '';
            el.style.transform = '';
        }

        function open() {
            if (card.getAttribute('data-disabled') === 'true') return;
            if (openCard && openCard !== card) openCard.__close?.();
            if (openCard === card) return;
            openCard = card;

            const homeParent = card.parentElement;
            const homeNext = card.nextElementSibling;
            const homeMediaHost = card;
            const rect = card.getBoundingClientRect();

            const ph = document.createElement('div');
            ph.className = 'showroom-card__spacer';
            ph.style.width = `${rect.width}px`;
            ph.style.height = `${rect.height}px`;
            ph.style.borderRadius = getComputedStyle(card).borderRadius;
            ph.style.background = 'transparent';
            homeParent?.insertBefore(ph, card);

            document.body.appendChild(card);

            card.classList.add('is-expanded');
            card.classList.add('is-expanding');
            setBackdropOpen(true);
            setRootModalOpen(true);
            setExpandLabel(true);
            if (expandedPanel) expandedPanel.setAttribute('aria-hidden', 'false');

            moveMediaToExpanded();

            card.style.position = 'fixed';
            card.style.left = `${rect.left}px`;
            card.style.top = `${rect.top}px`;
            card.style.width = `${rect.width}px`;
            card.style.height = `${rect.height}px`;
            card.style.margin = '0';
            card.style.transform = 'none';

            const target = getExpandedTargetRect();
            card.classList.add('is-animating');

            const go = () => {
                card.style.left = `${target.left}px`;
                card.style.top = `${target.top}px`;
                card.style.width = `${target.width}px`;
                card.style.height = `${target.height}px`;
            };

            if (prefersReducedMotion) {
                go();
                card.classList.remove('is-animating');
                card.classList.remove('is-expanding');
            } else {
                requestAnimationFrame(go);
            }

            const onDone = (e) => {
                if (e && e.target !== card) return;
                card.removeEventListener('transitionend', onDone);
                card.classList.remove('is-animating');
                requestAnimationFrame(() => card.classList.remove('is-expanding'));
            };
            if (!prefersReducedMotion) card.addEventListener('transitionend', onDone);

            card.__close = () => close({ ph, homeParent, homeNext, homeMediaHost });
        }

        function close({ ph, homeParent, homeNext, homeMediaHost } = {}) {
            if (!card.classList.contains('is-expanded')) return;

            if (expandedPanel) expandedPanel.setAttribute('aria-hidden', 'true');
            card.classList.add('is-expanding');

            const rect = ph?.getBoundingClientRect?.();
            if (!rect) {
                card.classList.remove('is-expanded', 'is-animating');
                card.removeAttribute('style');
                if (expandedPanel) expandedPanel.setAttribute('aria-hidden', 'true');
                setBackdropOpen(false);
                setRootModalOpen(false);
                setExpandLabel(false);
                openCard = null;
                ph?.remove?.();
                return;
            }

            card.classList.add('is-animating');
            requestAnimationFrame(() => {
                card.style.left = `${rect.left}px`;
                card.style.top = `${rect.top}px`;
                card.style.width = `${rect.width}px`;
                card.style.height = `${rect.height}px`;
            });

            const onDone = (e) => {
                if (e && e.target !== card) return;
                card.removeEventListener('transitionend', onDone);

                moveMediaToCompact(homeMediaHost || card);

                if (homeNext) homeParent?.insertBefore(card, homeNext);
                else homeParent?.appendChild(card);
                ph?.remove?.();

                card.classList.remove('is-expanded', 'is-expanding', 'is-animating');
                clearModalInlineStyles(card);
                if (expandedPanel) expandedPanel.setAttribute('aria-hidden', 'true');
                setBackdropOpen(false);
                setRootModalOpen(false);
                setExpandLabel(false);
                openCard = null;
            };

            if (prefersReducedMotion) onDone();
            else card.addEventListener('transitionend', onDone);
        }

        expandBtn?.addEventListener('click', () => {
            if (card.classList.contains('is-expanded')) card.__close?.();
            else open();
        });

        setExpandLabel(false);
        return { open, close, setExpandLabel };
    }

    // ===================== OMGO Mini =====================
    async function initMini(card) {
        const bg = card.querySelector('[data-bg]');
        const maskWrap = card.querySelector('[data-mask]');
        const viewBtns = Array.from(card.querySelectorAll('[data-view]'));
        // const colourDots = Array.from(card.querySelectorAll('[data-colour]'));
        const colourPicker = card.querySelector('[data-colour-picker]');
        const colourDots = colourPicker
            ? syncPickerButtons(colourPicker, MINI.colours.length)
            : Array.from(card.querySelectorAll('[data-colour]'));

        card.setAttribute('data-view', String(MINI.defaultView));
        card.setAttribute('data-colour', String(clamp(MINI.defaultColourIndex, 0, MINI.colours.length - 1)));

        card.__OMGO = { colours: MINI_COLOURS };
        const { setExpandLabel } = attachExpansion(card);

        function getColourIndex() {
            const i = Number(card.getAttribute('data-colour'));
            return Number.isFinite(i) ? clamp(i, 0, MINI.colours.length - 1) : MINI.defaultColourIndex;
        }

        function setView(view) {
            const v = clamp(Number(view), 0, 3);
            card.setAttribute('data-view', String(v));
            card.style.setProperty('--showroom-view-index', String(v));

            viewBtns.forEach((b) => {
                const isActive = Number(b.getAttribute('data-view')) === v;
                b.classList.toggle('is-active', isActive);
                b.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            });

            if (bg) bg.src = MINI.bgSrc(v);

            const colour = MINI.colours[getColourIndex()]?.value || MINI.colours[0].value;
            loadMaskSingle(maskWrap, MINI.maskSrc(v), colour, bg).catch(() => { });
        }

        function setColour(index) {
            const i = clamp(Number(index), 0, MINI.colours.length - 1);
            card.setAttribute('data-colour', String(i));
            card.style.setProperty('--showroom-colour-index', String(i));

            const colour = MINI.colours[i]?.value || MINI.colours[0].value;
            card.style.setProperty('--showroom-skin', colour);

            colourDots.forEach((d) => {
                const di = Number(d.getAttribute('data-colour'));
                const isActive = di === i;
                d.classList.toggle('is-active', isActive);
                d.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            });

            const v = Number(card.getAttribute('data-view'));
            const view = Number.isFinite(v) ? clamp(v, 0, 3) : MINI.defaultView;
            loadMaskSingle(maskWrap, MINI.maskSrc(view), colour, bg).catch(() => { });
        }

        colourDots.forEach((d, idx) => {
            const c = MINI.colours[idx];
            if (!c) return;
            d.title = c.name;
            d.setAttribute('aria-label', c.name);
            d.style.backgroundColor = c.value;
            d.dataset.colourValue = c.value;
        });

        viewBtns.forEach((b) => b.addEventListener('click', () => setView(b.getAttribute('data-view'))));
        colourDots.forEach((d) => d.addEventListener('click', () => setColour(d.getAttribute('data-colour'))));

        setColour(MINI.defaultColourIndex);
        setView(MINI.defaultView);
        setExpandLabel(false);
    }

    // ===================== OMGO Sphere =====================
    async function initSphere(card) {
        const bg = card.querySelector('[data-bg]');
        const maskWrap = card.querySelector('[data-mask]');
        const viewBtns = Array.from(card.querySelectorAll('[data-view]'));
        // const styleDots = Array.from(card.querySelectorAll('[data-colour]'));
        const stylePicker = card.querySelector('[data-colour-picker]');
        const styleDots = syncPickerButtons(stylePicker, SPHERE.styles.length);

        card.setAttribute('data-view', String(SPHERE.defaultView));
        card.setAttribute('data-colour', String(clamp(SPHERE.defaultStyleIndex, 0, SPHERE.styles.length - 1)));

        card.__OMGO = { styles: SPHERE_STYLES };
        const { setExpandLabel } = attachExpansion(card);

        function getStyleIndex() {
            const i = Number(card.getAttribute('data-colour'));
            return Number.isFinite(i) ? clamp(i, 0, SPHERE.styles.length - 1) : SPHERE.defaultStyleIndex;
        }

        function getViewIndex() {
            const v = Number(card.getAttribute('data-view'));
            return Number.isFinite(v) ? clamp(v, 0, 3) : SPHERE.defaultView;
        }

        function buildLayers(view, styleIndex) {
            const style = SPHERE.styles[styleIndex] || SPHERE.styles[0];
            const layers = [];
            for (let g = 1; g <= SPHERE.maxGroups; g++) {
                const colour = style.colours?.[g - 1]?.value;
                if (!colour) continue;
                layers.push({ src: SPHERE.maskSrc(view, g), colour });
            }
            return layers;
        }

        function render(view, styleIndex) {
            if (bg) bg.src = SPHERE.bgSrc(view);
            const layers = buildLayers(view, styleIndex);
            loadMaskStack(maskWrap, layers, bg).catch(() => { });
        }

        function setView(view) {
            const v = clamp(Number(view), 0, 3);
            card.setAttribute('data-view', String(v));
            card.style.setProperty('--showroom-view-index', String(v));

            viewBtns.forEach((b) => {
                const isActive = Number(b.getAttribute('data-view')) === v;
                b.classList.toggle('is-active', isActive);
                b.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            });

            render(v, getStyleIndex());
        }

        function setStyle(index) {
            const i = clamp(Number(index), 0, SPHERE.styles.length - 1);
            card.setAttribute('data-colour', String(i));
            card.style.setProperty('--showroom-colour-index', String(i));

            styleDots.forEach((d) => {
                const di = Number(d.getAttribute('data-colour'));
                const isActive = di === i;
                d.classList.toggle('is-active', isActive);
                d.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            });

            render(getViewIndex(), i);
        }

        styleDots.forEach((d, idx) => {
            const s = SPHERE.styles[idx];
            if (!s) return;
            d.title = s.name;
            d.setAttribute('aria-label', s.name);
            d.style.backgroundColor = s.colours?.[0]?.value || 'rgba(255,255,255,0.92)';
        });

        viewBtns.forEach((b) => b.addEventListener('click', () => setView(b.getAttribute('data-view'))));
        styleDots.forEach((d) => d.addEventListener('click', () => setStyle(d.getAttribute('data-colour'))));

        setStyle(SPHERE.defaultStyleIndex);
        setView(SPHERE.defaultView);
        setExpandLabel(false);
    }

    // ===================== global close wiring =====================
    backdrop?.addEventListener('click', () => openCard?.__close?.());
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') openCard?.__close?.();
    });
    window.addEventListener('resize', () => {
        if (!openCard || !openCard.classList.contains('is-expanded')) return;
        const target = getExpandedTargetRect();
        openCard.style.left = `${target.left}px`;
        openCard.style.top = `${target.top}px`;
        openCard.style.width = `${target.width}px`;
        openCard.style.height = `${target.height}px`;
    });

    // ===================== init =====================
    const miniCard = section.querySelector('[data-product="mini"]');
    if (miniCard) initMini(miniCard);

    const sphereCard = section.querySelector('[data-product="sphere"]');
    if (sphereCard) initSphere(sphereCard);
})();