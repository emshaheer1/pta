(function () {
  const STORAGE_KEY = 'ramadan_submissions';
  const ADMIN_KEY = 'ramadan_admin';

  function isLocalDevice() {
    var h = window.location.hostname;
    return h === 'localhost' || h === '127.0.0.1' || h === '';
  }

  function getSubmissions() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  function getAdmin() {
    try {
      const raw = localStorage.getItem(ADMIN_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function setAdmin(data) {
    if (data) localStorage.setItem(ADMIN_KEY, JSON.stringify(data));
    else localStorage.removeItem(ADMIN_KEY);
  }

  function isLoggedIn() {
    const admin = getAdmin();
    return !!admin && !!admin.email;
  }

  const authScreen = document.getElementById('authScreen');
  const dashScreen = document.getElementById('dashScreen');
  const authForm = document.getElementById('authForm');
  const authTitle = document.getElementById('authTitle');
  const authSubmit = document.getElementById('authSubmit');
  const authToggle = document.getElementById('authToggle');
  const authToggleLink = document.getElementById('authToggleLink');
  const nameGroup = document.getElementById('nameGroup');
  const btnLogout = document.getElementById('btnLogout');
  const submissionsBody = document.getElementById('submissionsBody');
  const emptyState = document.getElementById('emptyState');
  const tableWrap = document.getElementById('tableWrap');
  const dashSyncHint = document.getElementById('dashSyncHint');

  let isSignupMode = false;
  var currentSubmissions = null;

  function applyProductionAuthRestrictions() {
    if (isLocalDevice()) return;
    var tabSignUp = document.getElementById('authTabSignUp');
    var toggleEl = document.getElementById('authToggle');
    var toggleAlt = document.getElementById('authToggleAlt');
    if (tabSignUp) tabSignUp.style.display = 'none';
    if (toggleEl) toggleEl.style.display = 'none';
    if (toggleAlt) toggleAlt.style.display = 'none';
    setAuthMode(false);
  }

  async function loadSubmissionsFromApi() {
    const admin = getAdmin();
    const token = admin && admin.password ? admin.password : '';
    if (!token) return getSubmissions();
    try {
      var res = await fetch('/api/submissions', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.status === 401) return null;
      if (res.ok) {
        var data = await res.json();
        return Array.isArray(data) ? data : getSubmissions();
      }
    } catch (_) {}
    return getSubmissions();
  }

  function showScreen(loggedIn) {
    if (loggedIn) {
      if (authScreen) authScreen.style.display = 'none';
      if (dashScreen) dashScreen.style.display = 'block';
      loadSubmissionsFromApi().then(function (list) {
        if (list === null) {
          currentSubmissions = null;
          renderSubmissions(getSubmissions());
          if (dashSyncHint) {
            dashSyncHint.style.display = 'block';
            dashSyncHint.textContent = 'To sync submissions from the server, set DASHBOARD_SECRET in Vercel (Environment Variables) to your dashboard password, then redeploy.';
          }
        } else {
          currentSubmissions = list;
          renderSubmissions(list);
          if (dashSyncHint) dashSyncHint.style.display = 'none';
        }
      });
    } else {
      if (authScreen) authScreen.style.display = 'block';
      if (dashScreen) dashScreen.style.display = 'none';
    }
  }

  function setAuthMode(signup) {
    isSignupMode = signup;
    if (authTitle) authTitle.textContent = signup ? 'Create account' : 'Sign in';
    if (authSubmit) authSubmit.textContent = signup ? 'Create account' : 'Sign in';
    if (nameGroup) nameGroup.style.display = signup ? 'block' : 'none';
    var toggleEl = document.getElementById('authToggle');
    var toggleAlt = document.getElementById('authToggleAlt');
    if (toggleEl) toggleEl.style.display = signup ? 'none' : 'block';
    if (toggleAlt) toggleAlt.style.display = signup ? 'block' : 'none';
    var tabSignIn = document.getElementById('authTabSignIn');
    var tabSignUp = document.getElementById('authTabSignUp');
    if (tabSignIn) tabSignIn.classList.toggle('active', !signup);
    if (tabSignUp) tabSignUp.classList.toggle('active', signup);
  }

  var authScreenEl = document.getElementById('authScreen');
  if (authScreenEl) {
    authScreenEl.addEventListener('click', function (e) {
      if (e.target.classList.contains('auth-toggle-link')) {
        e.preventDefault();
        if (!isLocalDevice()) return;
        setAuthMode(!isSignupMode);
      }
      if (e.target.classList.contains('auth-tab')) {
        e.preventDefault();
        var isSignUp = e.target.getAttribute('data-auth-tab') === 'signup';
        if (!isLocalDevice() && isSignUp) return;
        setAuthMode(isSignUp);
      }
    });
  }

  if (authForm) {
    authForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const email = document.getElementById('adminEmail')?.value?.trim();
      const password = document.getElementById('adminPassword')?.value?.trim();
      const name = document.getElementById('adminName')?.value?.trim();
      if (!email || !password) return;

      if (isSignupMode && !isLocalDevice()) {
        alert('Account creation is only allowed from this app running on your local device (localhost).');
        return;
      }

      const admin = getAdmin();
      if (isSignupMode) {
        setAdmin({ email, password, name: name || email });
        setAuthMode(false);
        alert('Account created. You can log in now.');
        return;
      }

      if (isLocalDevice()) {
        if (!admin || admin.email !== email || admin.password !== password) {
          alert('Invalid email or password.');
          return;
        }
        showScreen(true);
        return;
      }

      // Production (Vercel): validate password against server (DASHBOARD_SECRET)
      var btn = authSubmit;
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Signing in…';
      }
      try {
        var authUrl = new URL('/api/auth', window.location.origin).href;
        var authRes = await fetch(authUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, password: password })
        });
        var data = null;
        try {
          var text = await authRes.text();
          if (text) data = JSON.parse(text);
        } catch (_) {}
        if (authRes.ok && data && data.ok) {
          setAdmin({ email: email, password: password, name: name || email });
          showScreen(true);
        } else {
          var msg = (data && data.error) ? data.error : 'Invalid email or password.';
          alert(msg);
        }
      } catch (err) {
        console.error('Dashboard auth error', err);
        alert('Could not reach the server. Check the console and try again.');
      }
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Sign in';
      }
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', function () {
      setAdmin(null);
      showScreen(false);
      setAuthMode(false);
    });
  }

  function renderSubmissions(list) {
    if (list == null) list = getSubmissions();
    if (submissionsBody) {
      submissionsBody.innerHTML = list.length
        ? list.map(function (row, i) {
            var businessType = row.businessOwner === 'yes' ? (row.businessType || '–') : '–';
            var w2 = row.businessOwner === 'no' ? (row.w2Income === 'yes' ? 'Yes' : 'No') : '–';
            var date = row.createdAt ? new Date(row.createdAt).toLocaleString() : '–';
            return '<tr><td>' + (i + 1) + '</td><td>' + escapeHtml(row.firstName || '') + '</td><td>' + escapeHtml(row.lastName || '') + '</td><td>' + escapeHtml(row.email || '') + '</td><td>' + escapeHtml(row.phone || '–') + '</td><td>' + (row.businessOwner === 'yes' ? '<span class="tag">Yes</span>' : 'No') + '</td><td>' + escapeHtml(businessType) + '</td><td>' + escapeHtml(w2) + '</td><td>' + escapeHtml(date) + '</td></tr>';
          }).join('')
        : '';
    }
    if (emptyState) emptyState.style.display = list.length ? 'none' : 'block';
    if (tableWrap) tableWrap.style.display = list.length ? 'block' : 'none';
  }

  function downloadPDF() {
    var list = currentSubmissions || getSubmissions();
    if (!list.length) {
      alert('No submissions to download.');
      return;
    }
    try {
      var jsPDF = window.jspdf.jsPDF;
      var doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      doc.setFontSize(14);
      doc.text('Premium Tax Accounting – Ramadan – Submissions', 14, 12);
      doc.setFontSize(10);
      doc.text('Generated: ' + new Date().toLocaleString(), 14, 18);

      var headers = ['#', 'First name', 'Last name', 'Email', 'Phone', 'Business owner', 'Business type', 'W2 $750k+', 'Submitted'];
      var rows = list.map(function (row, i) {
        var businessType = row.businessOwner === 'yes' ? (row.businessType || '') : '';
        var w2 = row.businessOwner === 'no' ? (row.w2Income === 'yes' ? 'Yes' : 'No') : '';
        var date = row.createdAt ? new Date(row.createdAt).toLocaleString() : '';
        return [
          (i + 1).toString(),
          row.firstName || '',
          row.lastName || '',
          row.email || '',
          row.phone || '',
          row.businessOwner === 'yes' ? 'Yes' : 'No',
          businessType,
          w2,
          date
        ];
      });

      doc.autoTable({
        head: [headers],
        body: rows,
        startY: 22,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [30, 58, 95] },
        margin: { left: 14, right: 14 }
      });

      doc.save('Premium-Tax-Ramadan-Submissions-' + new Date().toISOString().slice(0, 10) + '.pdf');
    } catch (err) {
      console.error(err);
      alert('Could not generate PDF. Please try again.');
    }
  }

  var btnRefresh = document.getElementById('btnRefresh');
  if (btnRefresh) {
    btnRefresh.addEventListener('click', function () {
      var label = btnRefresh.textContent;
      btnRefresh.textContent = 'Syncing…';
      btnRefresh.disabled = true;
      loadSubmissionsFromApi().then(function (list) {
        btnRefresh.textContent = label;
        btnRefresh.disabled = false;
        if (list === null) {
          currentSubmissions = null;
          renderSubmissions(getSubmissions());
          if (dashSyncHint) {
            dashSyncHint.style.display = 'block';
            dashSyncHint.textContent = 'To sync submissions from the server, set DASHBOARD_SECRET in Vercel (Environment Variables) to your dashboard password, then redeploy.';
          }
        } else {
          currentSubmissions = list;
          renderSubmissions(list);
          if (dashSyncHint) dashSyncHint.style.display = 'none';
        }
      });
    });
  }

  var btnDownloadPdf = document.getElementById('btnDownloadPdf');
  if (btnDownloadPdf) btnDownloadPdf.addEventListener('click', downloadPDF);

  function escapeHtml(s) {
    if (s == null) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  setAuthMode(false);
  applyProductionAuthRestrictions();
  showScreen(isLoggedIn());
})();
