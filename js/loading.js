(function () {
  const links = document.querySelectorAll('.js-anim-nav');

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      // let users open in new tab/window normally
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;

      // respect reduced motion
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      e.preventDefault();

      const img = link.querySelector('img, svg');
      if (!img) { window.location.href = link.href; return; }

      // prevent double triggers
      if (img.classList.contains('is-pressing')) return;

      // start the press animation
      img.classList.add('is-pressing');

      let navigated = false;
      const go = () => {
        if (navigated) return;
        navigated = true;
        window.location.href = link.href;
      };

      // navigate when the animation actually ends
      img.addEventListener('animationend', go, { once: true });

      // safety timeout in case animationend doesn’t fire
      setTimeout(go, 800);
    }, { passive: false });
  });
})();