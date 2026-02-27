(function () {
  const STORAGE_KEY = 'ramadan_submissions';
  const LOGO_PATHS = ['assets/img/pta-logo.png', 'assets/img/logo.png', 'img/pta-logo.png', 'pta-logo.png'];

  // Logo: try paths and show text fallback on error
  function initLogo(imgId, fallbackId) {
    var img = document.getElementById(imgId);
    var fallback = document.getElementById(fallbackId);
    if (!img) return;
    var tried = 0;
    img.onerror = function () {
      tried++;
      if (tried < LOGO_PATHS.length) {
        img.src = LOGO_PATHS[tried];
      } else if (fallback) {
        img.style.display = 'none';
        fallback.hidden = false;
      }
    };
    img.onload = function () {
      if (fallback) fallback.hidden = true;
    };
    if (fallback) fallback.hidden = true;
  }

  // Welcome animations – staggered text with subtle motion
  function runWelcomeAnimations() {
    if (typeof gsap === 'undefined') return;
    const anims = document.querySelectorAll('[data-anim]');
    gsap.set(anims, { opacity: 0, y: 28 });
    gsap.to(anims, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.14,
      ease: 'power3.out',
      delay: 0.2
    });
    // Button: subtle pop-in after rest
    const btn = document.getElementById('btnSignup');
    if (btn) gsap.fromTo(btn, { scale: 0.98 }, { scale: 1, duration: 0.4, delay: 0.9, ease: 'back.out(1.4)' });
  }

  // Form overlay - run when DOM is ready
  function initForm() {
    const formOverlay = document.getElementById('formOverlay');
    const formModal = document.getElementById('formModal');
    const formBackdrop = document.getElementById('formBackdrop');
    const btnSignup = document.getElementById('btnSignup');
    const formClose = document.getElementById('formClose');
    const signupForm = document.getElementById('signupForm');

    function openForm(e) {
      if (e) e.preventDefault();
      if (!formOverlay) return;
      formOverlay.setAttribute('aria-hidden', 'false');
      formOverlay.classList.add('is-open');
      formOverlay.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      if (typeof gsap !== 'undefined' && formModal) {
        gsap.fromTo(formModal, { scale: 0.95, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'power2.out' });
      }
    }

    function closeForm() {
      if (!formOverlay) return;
      formOverlay.classList.remove('is-open');
      formOverlay.style.display = '';
      formOverlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    if (btnSignup) btnSignup.addEventListener('click', openForm);
    if (formClose) formClose.addEventListener('click', closeForm);
    if (formBackdrop) formBackdrop.addEventListener('click', closeForm);

    // Conditional fields: business owner Yes -> business type; No -> W2 question
    const businessOwnerRadios = document.querySelectorAll('input[name="businessOwner"]');
    const businessTypeWrap = document.getElementById('businessTypeWrap');
    const w2Wrap = document.getElementById('w2Wrap');
    const businessTypeSelect = document.getElementById('businessType');
    const w2Radios = document.querySelectorAll('input[name="w2Income"]');

    function toggleConditional() {
      const value = document.querySelector('input[name="businessOwner"]:checked')?.value;
      if (businessTypeWrap) {
        businessTypeWrap.hidden = value !== 'yes';
        if (businessTypeSelect) businessTypeSelect.removeAttribute('required');
        if (value === 'yes') businessTypeSelect?.setAttribute('required', '');
      }
      if (w2Wrap) {
        w2Wrap.hidden = value !== 'no';
        w2Radios.forEach(function (r) { r.removeAttribute('required'); });
        if (value === 'no') w2Radios.forEach(function (r) { r.setAttribute('required', 'required'); });
      }
    }

    businessOwnerRadios.forEach(function (r) {
      r.addEventListener('change', toggleConditional);
    });
    toggleConditional();

    // Submit: validate, store, redirect
    function getSubmissions() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch (_) {
        return [];
      }
    }

    function saveSubmissions(list) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }

    if (signupForm) {
      signupForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        var firstName = document.getElementById('firstName');
        var lastName = document.getElementById('lastName');
        var email = document.getElementById('email');
        var phone = document.getElementById('phone');
        var firstVal = firstName?.value?.trim();
        var lastVal = lastName?.value?.trim();
        var emailVal = email?.value?.trim();
        var phoneVal = phone?.value?.trim();

        if (!firstVal) {
          alert('Please enter your first name.');
          if (firstName) firstName.focus();
          return;
        }
        if (!lastVal) {
          alert('Please enter your last name.');
          if (lastName) lastName.focus();
          return;
        }
        if (!emailVal) {
          alert('Please enter your email address.');
          if (email) email.focus();
          return;
        }
        if (!phoneVal) {
          alert('Please enter your phone number.');
          if (phone) phone.focus();
          return;
        }

        var value = document.querySelector('input[name="businessOwner"]:checked')?.value;
        if (!value) {
          alert('Please select whether you are a business owner (Yes or No).');
          return;
        }
        if (value === 'yes') {
          var bt = businessTypeSelect?.value?.trim();
          if (!bt) {
            alert('Please select your business type.');
            if (businessTypeSelect) businessTypeSelect.focus();
            return;
          }
        }
        if (value === 'no') {
          var w2 = document.querySelector('input[name="w2Income"]:checked')?.value;
          if (!w2) {
            alert('Please answer: Do you make $750k+ yearly in W2? (Yes or No)');
            return;
          }
        }

        const entry = {
          id: Date.now().toString(36) + Math.random().toString(36).slice(2),
          firstName: firstVal,
          lastName: lastVal,
          email: emailVal,
          phone: phoneVal,
          businessOwner: value,
          businessType: value === 'yes' ? document.getElementById('businessType')?.value : '',
          w2Income: value === 'no' ? document.querySelector('input[name="w2Income"]:checked')?.value : '',
          createdAt: new Date().toISOString()
        };

        var submitBtn = document.getElementById('btnSubmit');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Submitting…';
        }

        try {
          var submitUrl = new URL('/api/submit', window.location.origin).href;
          var res = await fetch(submitUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry)
          });
          var data = await res.json().catch(function () { return {}; });
          if (res.ok && data.ok) {
            closeForm();
            window.location.href = 'thank-you.html';
            return;
          }
        } catch (err) {
          console.warn('API submit failed, saving locally:', err);
        }

        var list = getSubmissions();
        list.push(entry);
        saveSubmissions(list);
        closeForm();
        window.location.href = 'thank-you.html';

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit';
        }
      });
    }
  }

  function boot() {
    function run() {
      initLogo('welcomeLogo', 'welcomeLogoFallback');
      initLogo('formModalLogo', 'formModalLogoFallback');
      initForm();
      runWelcomeAnimations();
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', run);
    } else {
      run();
    }
  }
  boot();
})();
