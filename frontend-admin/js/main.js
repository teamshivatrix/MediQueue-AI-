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
  if (document.getElementById('adminLanguageModalOverlay')) return;
  const overlay = document.createElement('div');
  overlay.id = 'adminLanguageModalOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(2,6,23,0.72);backdrop-filter:blur(4px);z-index:5500;display:none;align-items:center;justify-content:center;padding:16px;';
  overlay.innerHTML = `
    <div style="width:100%;max-width:660px;background:white;border-radius:18px;padding:18px;box-shadow:0 30px 80px rgba(0,0,0,0.3);">
      <h3 style="margin:0 0 0.35rem;font-size:1.25rem;font-weight:800;" data-i18n="lang.choose"></h3>
      <p style="margin:0 0 0.8rem;color:#64748b;" data-i18n="lang.subtitle"></p>
      <div style="font-size:0.8rem;color:#0e7490;font-weight:700;margin-bottom:0.5rem;" data-i18n="lang.quick"></div>
      <div id="adminLangQuick" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:0.9rem;"></div>
      <div style="font-size:0.8rem;color:#0e7490;font-weight:700;margin-bottom:0.5rem;" data-i18n="lang.more"></div>
      <select id="adminLangSelect" style="width:100%;padding:10px;border-radius:10px;border:1px solid #cbd5e1;margin-bottom:0.9rem;"></select>
      <div style="display:flex;justify-content:flex-end;">
        <button id="adminLangContinue" class="btn-primary btn-sm" type="button" data-i18n="lang.continue"></button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const quickWrap = document.getElementById('adminLangQuick');
  ['en', 'hi', 'ta', 'te'].forEach((code) => {
    const lang = ADMIN_LANG_OPTIONS.find((l) => l.code === code);
    if (!lang) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-outline btn-sm';
    btn.style.justifyContent = 'center';
    btn.textContent = `${lang.native} (${lang.label})`;
    btn.onclick = () => {
      const select = document.getElementById('adminLangSelect');
      select.value = code;
    };
    quickWrap.appendChild(btn);
  });

  const select = document.getElementById('adminLangSelect');
  ADMIN_LANG_OPTIONS.forEach((lang) => {
    const option = document.createElement('option');
    option.value = lang.code;
    option.textContent = `${lang.native} - ${lang.label}`;
    select.appendChild(option);
  });

  document.getElementById('adminLangContinue').onclick = () => {
    localStorage.setItem(ADMIN_LANG_STORAGE_KEY, select.value);
    document.documentElement.lang = select.value;
    applyAdminTranslations(document);
    overlay.style.display = 'none';
  };
}

function renderAdminLanguageControl() {
  if (document.getElementById('adminLangControlBtn')) return;
  const navContainer = document.querySelector('.nav-container');

  const wrap = document.createElement('div');
  wrap.style.display = 'flex';
  wrap.style.alignItems = 'center';
  wrap.style.gap = '8px';
  wrap.innerHTML = `<button id="adminLangControlBtn" class="btn-outline btn-sm" type="button" style="padding:0.45rem 0.8rem;"><i class="fas fa-language"></i> <span id="adminLangFloatingLabel"></span></button>`;

  if (navContainer) {
    const mobileToggle = navContainer.querySelector('.mobile-toggle');
    if (mobileToggle) navContainer.insertBefore(wrap, mobileToggle);
    else navContainer.appendChild(wrap);
  } else {
    wrap.style.position = 'fixed';
    wrap.style.top = '14px';
    wrap.style.right = '14px';
    wrap.style.zIndex = '5600';
    document.body.appendChild(wrap);
  }

  wrap.querySelector('#adminLangControlBtn').onclick = () => {
    buildAdminLanguageModal();
    const overlay = document.getElementById('adminLanguageModalOverlay');
    const select = document.getElementById('adminLangSelect');
    select.value = getAdminLanguage();
    applyAdminTranslations(overlay);
    overlay.style.display = 'flex';
  };
}

function initAdminLanguageExperience() {
  renderAdminLanguageControl();
  document.documentElement.lang = getAdminLanguage();
  applyAdminTranslations(document);
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
