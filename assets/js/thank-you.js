(function () {
  var LOGO_PATHS = ['assets/img/pta-logo.png', 'assets/img/logo.png', 'img/pta-logo.png', 'pta-logo.png'];
  var tyImg = document.getElementById('tyLogo');
  var tyFallback = document.getElementById('tyLogoFallback');
  if (tyImg) {
    var tried = 0;
    tyImg.onerror = function () {
      tried++;
      if (tried < LOGO_PATHS.length) tyImg.src = LOGO_PATHS[tried];
      else if (tyFallback) { tyImg.style.display = 'none'; tyFallback.hidden = false; }
    };
    tyImg.onload = function () { if (tyFallback) tyFallback.hidden = true; };
    if (tyFallback) tyFallback.hidden = true;
  }

  if (typeof gsap === 'undefined') return;

  const iconWrap = document.querySelector('.ty-icon-wrap');
  const anims = document.querySelectorAll('[data-ty-anim]');

  gsap.set(anims, { opacity: 0, y: 20 });
  gsap.set(iconWrap, { opacity: 0, scale: 0.8 });

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.to(iconWrap, { opacity: 1, scale: 1, duration: 0.5 })
    .add(function () {
      iconWrap.classList.add('done');
    }, 0.3)
    .to(anims, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 }, 0.4);
})();
