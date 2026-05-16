(() => {
  const renderLucide = () => {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  };

  const init = () => {
    renderLucide();

    document.querySelectorAll('[data-checkout]').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (el.getAttribute('href') === '#') {
          e.preventDefault();
          alert('Checkout em breve. Por enquanto, escreva pra contato@posturatrabalho.com.');
        }
      });
    });
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
