// MediQueue AI - Main JavaScript (shared utilities)
// If opened via Live Server (port 5500/5501) or file://, point API calls to the actual backend server
const API_BASE = window.location.port === '3000' ? '' : 'http://localhost:3000';

function sanitizeBase(raw) {
  return String(raw || '').trim().replace(/\/+$/, '');
}

const ADMIN_LANG_STORAGE_KEY = 'mq_lang';
const ADMIN_LANG_OPTIONS = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' }
];

const ADMIN_TRANSLATIONS = {
  en: {
    'lang.choose': 'Choose your language',
    'lang.subtitle': 'Pick a language for the admin experience.',
    'lang.quick': 'Quick select',
    'lang.more': 'More languages',
    'lang.continue': 'Continue',
    'lang.change': 'Language',
    'admin.loginTitle': 'Admin Login',
    'admin.loginSub': 'MediQueue AI Hospital System',
    'admin.username': 'Username',
    'admin.password': 'Password',
    'admin.loginBtn': 'Login',
    'admin.backHome': 'Back to Hospital Home',
    'admin.dashboardTitle': 'Admin Dashboard',
    'admin.dashboardSub': 'Real-time hospital analytics and patient tracking',
    'admin.navDashboard': 'Dashboard',
    'admin.navDoctors': 'Doctors',
    'admin.navCompleted': 'Completed Records',
    'admin.navEmergencyAlerts': 'Emergency Alerts',
    'admin.navQueue': 'Queue Board',
    'admin.navPatientPortal': 'Patient Portal',
    'admin.logout': 'Logout'
  },
  hi: {
    'lang.choose': 'अपनी भाषा चुनें',
    'lang.subtitle': 'एडमिन अनुभव के लिए भाषा चुनें।',
    'lang.quick': 'त्वरित चयन',
    'lang.more': 'अन्य भाषाएं',
    'lang.continue': 'आगे बढ़ें',
    'lang.change': 'भाषा',
    'admin.loginTitle': 'एडमिन लॉगिन',
    'admin.loginSub': 'MediQueue AI हॉस्पिटल सिस्टम',
    'admin.username': 'यूज़रनेम',
    'admin.password': 'पासवर्ड',
    'admin.loginBtn': 'लॉगिन',
    'admin.backHome': 'हॉस्पिटल होम पर वापस',
    'admin.dashboardTitle': 'एडमिन डैशबोर्ड',
    'admin.dashboardSub': 'रियल-टाइम हॉस्पिटल एनालिटिक्स और ट्रैकिंग',
    'admin.navDashboard': 'डैशबोर्ड',
    'admin.navDoctors': 'डॉक्टर्स',
    'admin.navCompleted': 'पूर्ण रिकॉर्ड',
    'admin.navEmergencyAlerts': 'आपात अलर्ट',
    'admin.navQueue': 'क्यू बोर्ड',
    'admin.navPatientPortal': 'पेशेंट पोर्टल',
    'admin.logout': 'लॉगआउट'
  }
};

function getAdminLanguage() {
  const saved = String(localStorage.getItem(ADMIN_LANG_STORAGE_KEY) || '').toLowerCase();
  return ADMIN_LANG_OPTIONS.some((l) => l.code === saved) ? saved : 'en';
}

function tAdmin(key) {
  const lang = getAdminLanguage();
  const dict = ADMIN_TRANSLATIONS[lang] || {};
  return dict[key] || ADMIN_TRANSLATIONS.en[key] || key;
}

function applyAdminTranslations(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key) el.textContent = tAdmin(key);
  });
  root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key) el.setAttribute('placeholder', tAdmin(key));
  });
  const label = document.getElementById('adminLangFloatingLabel');
  if (label) label.textContent = tAdmin('lang.change');
}

function buildAdminLanguageModal() {
  const existing = document.getElementById('adminLanguageModalOverlay');
  if (existing) existing.remove();

  const currentLang = getAdminLanguage();

  const overlay = document.createElement('div');
  overlay.id = 'adminLanguageModalOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(2,6,23,0.72);backdrop-filter:blur(4px);z-index:5500;display:none;align-items:center;justify-content:center;padding:16px;';
  overlay.innerHTML = `
    <div style="width:100%;max-width:560px;background:white;border-radius:18px;padding:24px;box-shadow:0 30px 80px rgba(0,0,0,0.3);">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:1.2rem;">
        <div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#0891b2,#0e7490);display:flex;align-items:center;justify-content:center;color:white;font-size:1.2rem;flex-shrink:0;">
          <i class="fas fa-language"></i>
        </div>
        <div>
          <h2 style="font-size:1.2rem;font-weight:800;margin:0;">Choose Language / भाषा चुनें</h2>
          <p style="font-size:0.8rem;color:#64748b;margin:0;">Select your preferred language</p>
        </div>
        <button onclick="document.getElementById('adminLanguageModalOverlay').style.display='none'" style="margin-left:auto;background:none;border:none;font-size:1.4rem;cursor:pointer;color:#64748b;padding:4px;line-height:1;">✕</button>
      </div>
      <div id="adminLangGrid" style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;max-height:360px;overflow-y:auto;"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  const grid = document.getElementById('adminLangGrid');
  ADMIN_LANG_OPTIONS.forEach((lang) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    const isActive = lang.code === currentLang;
    btn.style.cssText = `display:flex;align-items:center;gap:10px;padding:0.7rem 1rem;border-radius:12px;border:2px solid ${isActive ? '#0891b2' : '#e2e8f0'};background:${isActive ? '#ecfeff' : 'white'};cursor:pointer;font-family:inherit;transition:all 0.2s;text-align:left;width:100%;`;
    btn.innerHTML = `
      <span style="font-size:1.05rem;font-weight:700;color:#0f172a;">${lang.native}</span>
      <span style="font-size:0.72rem;color:#64748b;">${lang.label}</span>
      ${isActive ? '<i class="fas fa-check-circle" style="margin-left:auto;color:#0891b2;font-size:1rem;"></i>' : ''}
    `;
    btn.onmouseover = () => { if (!isActive) btn.style.borderColor = '#94a3b8'; };
    btn.onmouseout  = () => { if (!isActive) btn.style.borderColor = '#e2e8f0'; };
    btn.onclick = () => {
      overlay.style.display = 'none';
      applyGoogleTranslateAdmin(lang.code);
    };
    grid.appendChild(btn);
  });
}

function applyGoogleTranslateAdmin(langCode) {
  localStorage.setItem(ADMIN_LANG_STORAGE_KEY, langCode);
  if (langCode === 'en') {
    sessionStorage.removeItem('mq_admin_translated_lang');
    window.location.reload();
    return;
  }
  sessionStorage.setItem('mq_admin_translated_lang', langCode);
  translatePageContentAdmin(langCode);
}

async function translatePageContentAdmin(targetLang) {
  if (targetLang === 'en') return;
  const walker = document.createTreeWalker(
    document.body, NodeFilter.SHOW_TEXT,
    { acceptNode(node) {
      const tag = node.parentElement && node.parentElement.tagName;
      if (['SCRIPT','STYLE','NOSCRIPT','TEXTAREA'].includes(tag)) return NodeFilter.FILTER_REJECT;
      if (!node.nodeValue.trim()) return NodeFilter.FILTER_SKIP;
      return NodeFilter.FILTER_ACCEPT;
    }}
  );
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  const chunkSize = 10;
  for (let i = 0; i < nodes.length; i += chunkSize) {
    const chunk = nodes.slice(i, i + chunkSize);
    await Promise.all(chunk.map(async (node) => {
      const original = node.nodeValue.trim();
      if (!original || original.length < 2) return;
      try {
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(original)}&langpair=en|${targetLang}`);
        const data = await res.json();
        if (data.responseStatus === 200 && data.responseData.translatedText) {
          node.nodeValue = data.responseData.translatedText;
        }
      } catch (_) {}
    }));
  }
}

function injectGoogleTranslateScriptAdmin() {
  // No-op: Google Translate widget removed to prevent layout issues
}

function renderAdminLanguageControl() {
  if (document.getElementById('adminLangControlBtn')) return;

  const currentLang = getAdminLanguage();
  const langObj = ADMIN_LANG_OPTIONS.find(l => l.code === currentLang) || ADMIN_LANG_OPTIONS[0];

  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;align-items:center;';
  wrap.innerHTML = `<button id="adminLangControlBtn" class="btn-outline btn-sm" type="button" style="padding:0.45rem 0.8rem;display:flex;align-items:center;gap:6px;"><i class="fas fa-language"></i> <span id="adminLangFloatingLabel">${langObj.native}</span></button>`;

  const navContainer = document.querySelector('.nav-container');
  if (navContainer) {
    const mobileToggle = navContainer.querySelector('.mobile-toggle');
    if (mobileToggle) navContainer.insertBefore(wrap, mobileToggle);
    else navContainer.appendChild(wrap);
  } else {
    const langWrapper = document.getElementById('langBtnWrapper');
    if (langWrapper) {
      langWrapper.appendChild(wrap);
    } else {
      wrap.style.cssText += 'position:fixed;top:14px;right:14px;z-index:5600;';
      document.body.appendChild(wrap);
    }
  }

  wrap.querySelector('#adminLangControlBtn').onclick = () => {
    buildAdminLanguageModal();
    document.getElementById('adminLanguageModalOverlay').style.display = 'flex';
  };
}

function initAdminLanguageExperience() {
  renderAdminLanguageControl();
  document.documentElement.lang = getAdminLanguage();
  applyAdminTranslations(document);

  const translatedLang = sessionStorage.getItem('mq_admin_translated_lang');
  if (translatedLang && translatedLang !== 'en') {
    translatePageContentAdmin(translatedLang);
  }
}

// ---- Toast Notifications ----
function showToast(title, message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-circle',
    info: 'fas fa-info-circle',
    warning: 'fas fa-exclamation-triangle'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-icon"><i class="${icons[type] || icons.info}"></i></div>
    <div class="toast-content">
      <h4>${title}</h4>
      <p>${message}</p>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
  `;

  container.appendChild(toast);

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.animation = 'toastSlide 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }
  }, 5000);
}

// ---- Browser Notifications ----
function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function sendBrowserNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body: body,
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="80" font-size="80">🏥</text></svg>'
    });
  }
}

// Request on page load
requestNotificationPermission();

// ---- Scroll Animations ----
const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
  initAdminLanguageExperience();
  document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
});

// ---- Navbar Scroll Effect ----
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (navbar) {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }
});

// ---- API Helper ----
async function apiCall(endpoint, options = {}) {
  const bases = Array.from(new Set([
    sanitizeBase(API_BASE),
    '',
    'http://localhost:3000'
  ]));

  let lastError = null;

  for (const base of bases) {
    try {
      const res = await fetch(`${base}${endpoint}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const err = new Error(errorData.error || `HTTP ${res.status}`);
        if (res.status === 404 || res.status === 405) {
          lastError = err;
          continue;
        }
        throw err;
      }
      return await res.json();
    } catch (err) {
      lastError = err;
      if (err && err.name === 'TypeError') continue;
    }
  }

  console.error(`API Error (${endpoint}):`, lastError);
  throw lastError || new Error('API request failed');
}

// ---- Format Helpers ----
function formatTime(slot) {
  if (!slot) return '--';
  const [h, m] = slot.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '--';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

// Department colors mapping
const deptColors = {
  'Cardiology': '#ef4444',
  'General Medicine': '#3b82f6',
  'Orthopedics': '#f97316',
  'Neurology': '#8b5cf6',
  'Pediatrics': '#10b981',
  'Dermatology': '#ec4899',
  'ENT': '#14b8a6',
  'Ophthalmology': '#6366f1',
  'Gastroenterology': '#eab308',
  'Psychiatry': '#7c3aed',
  'Gynecology': '#f43f5e',
  'Dental': '#06b6d4',
  'Pulmonology': '#0891b2',
  'Urology': '#0ea5e9',
  'Endocrinology': '#84cc16'
};

function getDeptColor(dept) {
  return deptColors[dept] || '#64748b';
}

// Department icons
const deptIcons = {
  'Cardiology': 'fas fa-heartbeat',
  'General Medicine': 'fas fa-stethoscope',
  'Orthopedics': 'fas fa-bone',
  'Neurology': 'fas fa-brain',
  'Pediatrics': 'fas fa-baby',
  'Dermatology': 'fas fa-hand-sparkles',
  'ENT': 'fas fa-head-side-cough',
  'Ophthalmology': 'fas fa-eye',
  'Gastroenterology': 'fas fa-stomach',
  'Psychiatry': 'fas fa-comments',
  'Gynecology': 'fas fa-venus',
  'Dental': 'fas fa-tooth',
  'Pulmonology': 'fas fa-lungs',
  'Urology': 'fas fa-kidneys',
  'Endocrinology': 'fas fa-vial'
};

function getDeptIcon(dept) {
  return deptIcons[dept] || 'fas fa-hospital';
}

// ── Sidebar Notification Badges ──
(function () {
  // Map: sidebar link href keyword → badge id
  const BADGE_CONFIG = [
    { keyword: 'patients.html',              badgeId: 'sb-badge-appointments', color: 'red',    fetch: fetchPendingAppointments },
    { keyword: 'ambulance.html',             badgeId: 'sb-badge-ambulance',    color: 'red',    fetch: fetchPendingAmbulance },
    { keyword: 'admin-patients-search.html', badgeId: 'sb-badge-patients',     color: 'orange', fetch: null },
  ];

  async function fetchPendingAppointments() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = await apiCall(`/api/appointments?date=${today}&status=waiting`);
      return Array.isArray(data) ? data.length : 0;
    } catch (_) { return 0; }
  }

  async function fetchPendingAmbulance() {
    try {
      const data = await apiCall('/api/ambulance/requests');
      const list = Array.isArray(data) ? data : [];
      return list.filter(r => r.status === 'pending').length;
    } catch (_) { return 0; }
  }

  function setBadge(badgeId, count, color) {
    // Find or create badge on the matching sidebar link
    let badge = document.getElementById(badgeId);
    if (!badge) {
      // Find the sidebar link that matches
      const cfg = BADGE_CONFIG.find(c => c.badgeId === badgeId);
      if (!cfg) return;
      const link = [...document.querySelectorAll('.sidebar-nav a')]
        .find(a => a.href && a.href.includes(cfg.keyword));
      if (!link) return;
      badge = document.createElement('span');
      badge.id = badgeId;
      badge.className = 'sb-badge';
      link.appendChild(badge);
    }
    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : count;
      badge.style.display = 'inline-flex';
      badge.className = `sb-badge${color === 'orange' ? ' orange' : color === 'green' ? ' green' : ''}`;
    } else {
      badge.style.display = 'none';
    }
  }

  async function refreshBadges() {
    for (const cfg of BADGE_CONFIG) {
      if (!cfg.fetch) continue;
      const count = await cfg.fetch();
      setBadge(cfg.badgeId, count, cfg.color);
    }
  }

  // Run on load + every 15 seconds
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(refreshBadges, 800); // slight delay so sidebar renders
    setInterval(refreshBadges, 15000);
  });

  // Expose so other pages can trigger refresh after action
  window.refreshSidebarBadges = refreshBadges;
})();
