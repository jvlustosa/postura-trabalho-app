(() => {
  const renderLucide = () => {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  };

  const init = () => {
    renderLucide();
  };

  const start = () => {
    if (window.lucide) {
      init();
    } else {
      window.addEventListener('load', init, { once: true });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
