(function () {
  const STORAGE_KEY = 'pta_theme';
  const getStored = function () {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (_) {
      return null;
    }
  };
  const setStored = function (value) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch (_) {}
  };

  function applyTheme(theme) {
    const isLight = theme === 'light';
    document.documentElement.setAttribute('data-theme', isLight ? 'light' : 'dark');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isLight ? '#e8eef4' : '#0f1729');
    var btn = document.getElementById('themeToggle');
    if (btn) {
      var darkIcon = btn.querySelector('.theme-icon-dark');
      var lightIcon = btn.querySelector('.theme-icon-light');
      if (darkIcon) darkIcon.style.display = isLight ? 'inline' : 'none';
      if (lightIcon) lightIcon.style.display = isLight ? 'none' : 'inline';
    }
  }

  function init() {
    var theme = getStored();
    if (theme !== 'light' && theme !== 'dark') theme = 'dark';
    applyTheme(theme);

    var btn = document.getElementById('themeToggle');
    if (btn) {
      btn.addEventListener('click', function () {
        var current = document.documentElement.getAttribute('data-theme');
        var next = current === 'light' ? 'dark' : 'light';
        setStored(next);
        applyTheme(next);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
