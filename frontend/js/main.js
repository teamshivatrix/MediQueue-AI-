// MediQueue AI - Main JavaScript (shared utilities)
// If opened via Live Server (port 5500/5501) or file://, point API calls to the actual backend server
const API_BASE = window.location.port === '3000' ? '' : 'http://localhost:3000';

function sanitizeBase(raw) {
  return String(raw || '').trim().replace(/\/+$/, '');
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
