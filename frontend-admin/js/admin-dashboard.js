// MediQueue AI - Admin Dashboard JavaScript

let deptChart, hourChart, doctorChart, statusChart;
let lastEmergencyAlertTimestamp = 0;
let emergencyAlertTimer = null;
let unreadAppointments = 0;

document.addEventListener('DOMContentLoaded', () => {
  loadDashboard();
  pollEmergencyAlerts();
  connectAppointmentSSE();
  connectAmbulanceSSE();
  setInterval(loadDashboard, 30000);
  setInterval(pollEmergencyAlerts, 3000);
});

// ---- Ambulance SSE ----
function connectAmbulanceSSE() {
  const es = new EventSource(API_BASE + '/api/ambulance/events');
  es.addEventListener('new_request', (e) => {
    const req = JSON.parse(e.data);
    showAmbulanceAlert(req);
  });
  es.onerror = () => setTimeout(connectAmbulanceSSE, 3000);
}

function showAmbulanceAlert(req) {
  const old = document.getElementById('ambAlertOverlay');
  if (old) old.remove();

  const overlay = document.createElement('div');
  overlay.id = 'ambAlertOverlay';
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:9999;
    display:flex;align-items:center;justify-content:center;
    background:rgba(80,0,0,0.75);backdrop-filter:blur(8px);
    animation:ambFadeIn 0.3s ease;
  `;

  overlay.innerHTML = `
    <div style="
      background:linear-gradient(145deg,#1a0000,#3d0000,#7f1d1d);
      border:2px solid rgba(239,68,68,0.6);
      border-radius:24px;padding:2rem 2.5rem;
      max-width:500px;width:90%;text-align:center;
      box-shadow:0 0 60px rgba(220,38,38,0.8), 0 0 120px rgba(220,38,38,0.4), 0 40px 80px rgba(0,0,0,0.6);
      animation:ambSlideUp 0.4s cubic-bezier(0.34,1.56,0.64,1);
      position:relative;overflow:hidden;
    ">
      <!-- 3D glow rings -->
      <div style="position:absolute;inset:-20px;border-radius:30px;border:2px solid rgba(239,68,68,0.2);animation:ambRing 1.5s ease-in-out infinite;pointer-events:none;"></div>
      <div style="position:absolute;inset:-40px;border-radius:40px;border:1px solid rgba(239,68,68,0.1);animation:ambRing 1.5s ease-in-out 0.3s infinite;pointer-events:none;"></div>

      <!-- Flashing red overlay -->
      <div style="position:absolute;inset:0;background:rgba(220,38,38,0.08);animation:ambFlash 0.5s ease-in-out infinite;pointer-events:none;border-radius:24px;"></div>

      <div style="position:relative;z-index:2;">
        <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#dc2626,#7f1d1d);display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;box-shadow:0 0 30px rgba(220,38,38,0.8),0 8px 20px rgba(0,0,0,0.4);animation:ambPulse 0.8s ease-in-out infinite;">
          <i class="fas fa-truck-medical" style="font-size:2rem;color:white;"></i>
        </div>

        <div style="font-size:0.75rem;font-weight:800;color:#fca5a5;text-transform:uppercase;letter-spacing:3px;margin-bottom:0.4rem;">🚨 Emergency Ambulance Request</div>
        <h2 style="font-size:1.7rem;font-weight:900;color:white;margin:0 0 0.3rem;text-shadow:0 2px 10px rgba(220,38,38,0.5);">${req.patientName || 'Unknown'}</h2>
        <div style="font-size:0.9rem;color:#fca5a5;margin-bottom:0.75rem;"><i class="fas fa-phone"></i> ${req.phone || '--'}</div>

        <div style="background:rgba(0,0,0,0.3);border:1px solid rgba(239,68,68,0.3);border-radius:12px;padding:0.75rem 1rem;margin-bottom:1rem;font-size:0.85rem;color:#fecaca;text-align:left;">
          <div style="margin-bottom:4px;"><i class="fas fa-map-marker-alt" style="color:#f87171;width:16px;"></i> ${req.location || 'Location not provided'}</div>
          ${req.condition ? `<div><i class="fas fa-notes-medical" style="color:#f87171;width:16px;"></i> ${req.condition}</div>` : ''}
        </div>

        <div style="display:flex;gap:0.75rem;justify-content:center;margin-bottom:1rem;">
          <a href="ambulance.html" style="background:linear-gradient(135deg,#dc2626,#b91c1c);color:white;border:none;padding:0.6rem 1.4rem;border-radius:10px;font-size:0.88rem;font-weight:700;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:6px;box-shadow:0 4px 15px rgba(220,38,38,0.5);">
            <i class="fas fa-truck-medical"></i> Go to Ambulance Panel
          </a>
          <button onclick="document.getElementById('ambAlertOverlay').remove()" style="background:rgba(255,255,255,0.1);color:white;border:1px solid rgba(255,255,255,0.2);padding:0.6rem 1.2rem;border-radius:10px;font-size:0.88rem;font-weight:600;cursor:pointer;">
            Dismiss
          </button>
        </div>

        <div style="width:100%;height:4px;background:rgba(255,255,255,0.1);border-radius:999px;overflow:hidden;">
          <div id="ambAlertProgress" style="height:100%;background:linear-gradient(90deg,#dc2626,#f87171);border-radius:999px;width:100%;transition:width 3s linear;"></div>
        </div>
      </div>
    </div>
  `;

  // Inject keyframes once
  if (!document.getElementById('ambAlertStyles')) {
    const style = document.createElement('style');
    style.id = 'ambAlertStyles';
    style.textContent = `
      @keyframes ambFadeIn { from { opacity:0; } to { opacity:1; } }
      @keyframes ambSlideUp { from { transform:translateY(50px) scale(0.85); opacity:0; } to { transform:translateY(0) scale(1); opacity:1; } }
      @keyframes ambPulse { 0%,100% { transform:scale(1); box-shadow:0 0 30px rgba(220,38,38,0.8); } 50% { transform:scale(1.08); box-shadow:0 0 50px rgba(220,38,38,1); } }
      @keyframes ambFlash { 0%,100% { opacity:0; } 50% { opacity:1; } }
      @keyframes ambRing { 0%,100% { transform:scale(1); opacity:0.5; } 50% { transform:scale(1.05); opacity:0.2; } }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(overlay);

  // Progress bar shrink
  requestAnimationFrame(() => {
    const bar = document.getElementById('ambAlertProgress');
    if (bar) bar.style.width = '0%';
  });

  // Siren sound for 3 seconds
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const endTime = ctx.currentTime + 3;
    for (let t = ctx.currentTime; t < endTime; t += 0.5) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.linearRampToValueAtTime(440, t + 0.25);
      osc.frequency.linearRampToValueAtTime(880, t + 0.5);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.48);
      osc.start(t); osc.stop(t + 0.5);
    }
  } catch (_) {}

  // Auto dismiss after 5 seconds
  setTimeout(() => {
    if (document.getElementById('ambAlertOverlay')) {
      overlay.style.transition = 'opacity 0.4s ease';
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 400);
    }
  }, 5000);
}

// ---- Real-time Appointment SSE ----
function connectAppointmentSSE() {
  const es = new EventSource(API_BASE + '/api/appointments/events');

  es.addEventListener('new_appointment', (e) => {
    const apt = JSON.parse(e.data);
    showNewAppointmentAlert(apt);
    unreadAppointments++;
    updateUnreadBadge();
    loadDashboard(); // refresh stats
  });

  es.onerror = () => setTimeout(connectAppointmentSSE, 3000);
}

function updateUnreadBadge() {
  let badge = document.getElementById('aptUnreadBadge');
  const navLink = document.querySelector('a[href="patients.html"]');
  if (!navLink) return;

  if (!badge) {
    badge = document.createElement('span');
    badge.id = 'aptUnreadBadge';
    badge.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;background:#dc2626;color:white;font-size:0.65rem;font-weight:800;width:18px;height:18px;border-radius:50%;margin-left:6px;animation:pulse 1s infinite;';
    navLink.appendChild(badge);
  }
  badge.textContent = unreadAppointments;
  badge.style.display = unreadAppointments > 0 ? 'inline-flex' : 'none';
}

function showNewAppointmentAlert(apt) {
  // Remove existing
  const old = document.getElementById('aptAlertOverlay');
  if (old) old.remove();

  const overlay = document.createElement('div');
  overlay.id = 'aptAlertOverlay';
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:9999;
    display:flex;align-items:center;justify-content:center;
    background:rgba(2,6,23,0.6);backdrop-filter:blur(6px);
    animation:aptFadeIn 0.3s ease;
  `;

  overlay.innerHTML = `
    <div style="
      background:white;border-radius:24px;padding:2rem 2.5rem;
      max-width:480px;width:90%;text-align:center;
      box-shadow:0 40px 100px rgba(0,0,0,0.4);
      animation:aptSlideUp 0.4s cubic-bezier(0.34,1.56,0.64,1);
      position:relative;overflow:hidden;
    ">
      <div style="position:absolute;inset:0;background:linear-gradient(135deg,rgba(8,145,178,0.06),rgba(5,150,105,0.04));pointer-events:none;"></div>
      <div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#0891b2,#059669);display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;box-shadow:0 12px 30px rgba(8,145,178,0.4);">
        <i class="fas fa-calendar-check" style="font-size:1.8rem;color:white;"></i>
      </div>
      <div style="font-size:0.78rem;font-weight:700;color:#0891b2;text-transform:uppercase;letter-spacing:2px;margin-bottom:0.4rem;">New Appointment</div>
      <h2 style="font-size:1.6rem;font-weight:900;color:#0f172a;margin:0 0 0.3rem;">${apt.patientName}</h2>
      <div style="font-size:1rem;color:#0891b2;font-weight:700;margin-bottom:0.5rem;">Token #${apt.tokenNumber}</div>
      <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:1.2rem;flex-wrap:wrap;">
        <span style="background:#ecfeff;color:#0e7490;padding:4px 12px;border-radius:999px;font-size:0.82rem;font-weight:600;">${apt.department}</span>
        <span style="background:#f0fdf4;color:#059669;padding:4px 12px;border-radius:999px;font-size:0.82rem;font-weight:600;">${apt.doctorName}</span>
        <span style="background:#f8fafc;color:#475569;padding:4px 12px;border-radius:999px;font-size:0.82rem;">${apt.timeSlot}</span>
      </div>
      <div style="font-size:0.85rem;color:#64748b;margin-bottom:1.2rem;background:#f8fafc;border-radius:10px;padding:0.6rem 1rem;">${apt.symptoms || ''}</div>
      <div style="width:100%;height:4px;background:#f1f5f9;border-radius:999px;overflow:hidden;">
        <div id="aptAlertProgress" style="height:100%;background:linear-gradient(90deg,#0891b2,#059669);border-radius:999px;width:100%;transition:width 2s linear;"></div>
      </div>
    </div>
  `;

  // Inject keyframes once
  if (!document.getElementById('aptAlertStyles')) {
    const style = document.createElement('style');
    style.id = 'aptAlertStyles';
    style.textContent = `
      @keyframes aptFadeIn { from { opacity:0; } to { opacity:1; } }
      @keyframes aptSlideUp { from { transform:translateY(40px) scale(0.9); opacity:0; } to { transform:translateY(0) scale(1); opacity:1; } }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(overlay);

  // Progress bar shrink
  requestAnimationFrame(() => {
    const bar = document.getElementById('aptAlertProgress');
    if (bar) bar.style.width = '0%';
  });

  // Auto dismiss after 3 seconds
  setTimeout(() => {
    overlay.style.transition = 'opacity 0.4s ease';
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 400);
  }, 3000);

  // Click to dismiss
  overlay.addEventListener('click', () => overlay.remove());

  // Play a soft notification sound
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.15, 0.3].forEach((t, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = [880, 1100, 1320][i];
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.2, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.2);
    });
  } catch (_) {}
}

async function pollEmergencyAlerts() {
  try {
    const response = await apiCall('/api/emergency/alerts?since=' + lastEmergencyAlertTimestamp);
    const alerts = response.alerts || [];
    if (alerts.length === 0) return;

    const latest = alerts[alerts.length - 1];
    lastEmergencyAlertTimestamp = response.latestTimestamp || latest.createdAtMs || lastEmergencyAlertTimestamp;
    showEmergencyAlert(latest);
  } catch (err) {
    // Keep polling even if one request fails.
  }
}

function showEmergencyAlert(alert) {
  const box = document.getElementById('emergencyAlertBox');
  const text = document.getElementById('emergencyAlertText');
  if (!box || !text) return;

  const patient = alert.patientName || 'Unknown patient';
  const dept = alert.department || 'General';
  const token = alert.tokenNumber ? `#${alert.tokenNumber}` : '--';
  text.textContent = `Emergency Appointment Alert - ${patient} (${dept}) Token ${token}`;

  box.style.display = 'block';
  box.style.animation = 'none';
  box.offsetHeight;
  box.style.animation = 'pulse 0.9s ease-in-out 5';

  showToast('Emergency Alert', `${patient} booked emergency appointment`, 'error');

  if (emergencyAlertTimer) clearTimeout(emergencyAlertTimer);
  emergencyAlertTimer = setTimeout(() => {
    hideEmergencyAlert();
  }, 5000);
}

function hideEmergencyAlert() {
  const box = document.getElementById('emergencyAlertBox');
  if (!box) return;
  box.style.display = 'none';
}

async function loadEmergencyAppointments() {
  try {
    const appointments = await apiCall('/api/appointments?date=' + new Date().toISOString().split('T')[0] + '&priority=emergency');
    const activeEmergency = (appointments || []).filter((apt) => apt.status !== 'completed');

    renderNormalAppointments([]);
    renderEmergencyAppointments(activeEmergency);
    showToast('Emergency Filter', 'Showing emergency appointments only', 'warning');
  } catch (err) {
    showToast('Error', 'Failed to load emergency appointments', 'error');
  }
}

async function loadDashboard() {
  try {
    const [stats, appointments] = await Promise.all([
      apiCall('/api/appointments/stats'),
      apiCall('/api/appointments?date=' + new Date().toISOString().split('T')[0])
    ]);

    updateStatCards(stats);
    renderDeptChart(stats.departmentStats);
    renderHourChart(stats.hourlyStats);
    renderDoctorChart(stats.doctorWorkload);
    renderStatusChart(stats);
    const activeAppointments = (appointments || []).filter((apt) => apt.status !== 'completed');
    const normalAppointments = activeAppointments.filter((apt) => String(apt.priority || '').toLowerCase() !== 'emergency');
    const emergencyAppointments = activeAppointments.filter((apt) => String(apt.priority || '').toLowerCase() === 'emergency');

    renderNormalAppointments(normalAppointments);
    renderEmergencyAppointments(emergencyAppointments);
  } catch (err) {
    console.error('Dashboard load error:', err);
  }
}

function updateStatCards(stats) {
  animateValue('dashTotal', stats.totalToday || 0);
  animateValue('dashWaiting', stats.waiting || 0);
  animateValue('dashAvgWait', stats.avgWaitTime || 0);
  animateValue('dashCompleted', stats.completed || 0);
}

function animateValue(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const suffix = id === 'dashAvgWait' ? '<span style="font-size:0.9rem;"> min</span>' : '';
  let current = 0;
  const step = Math.ceil(target / 30);
  const timer = setInterval(() => {
    current += step;
    if (current >= target) { current = target; clearInterval(timer); }
    el.innerHTML = current + suffix;
  }, 25);
}

// Chart colors palette
const chartColors = [
  '#0891b2', '#059669', '#6366f1', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#3b82f6'
];

function renderDeptChart(deptStats) {
  const ctx = document.getElementById('deptChart');
  if (!ctx) return;

  const labels = Object.keys(deptStats || {});
  const data = Object.values(deptStats || {});

  if (deptChart) deptChart.destroy();

  deptChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Patients',
        data,
        backgroundColor: labels.map((l, i) => getDeptColor(l) || chartColors[i % chartColors.length]),
        borderRadius: 8,
        borderSkipped: false,
        barThickness: 30
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1, font: { size: 11 } },
          grid: { color: '#f1f5f9' }
        },
        x: {
          ticks: { font: { size: 10 }, maxRotation: 45 },
          grid: { display: false }
        }
      }
    }
  });
}

function renderHourChart(hourStats) {
  const ctx = document.getElementById('hourChart');
  if (!ctx) return;

  // Fill all hours 9-17
  const labels = [];
  const data = [];
  for (let h = 9; h <= 17; h++) {
    const key = h.toString().padStart(2, '0');
    labels.push(formatTime(key + ':00'));
    data.push((hourStats || {})[key] || 0);
  }

  if (hourChart) hourChart.destroy();

  hourChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Appointments',
        data,
        borderColor: '#0891b2',
        backgroundColor: 'rgba(8, 145, 178, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#0891b2',
        pointRadius: 5,
        pointHoverRadius: 8,
        borderWidth: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1, font: { size: 11 } },
          grid: { color: '#f1f5f9' }
        },
        x: {
          ticks: { font: { size: 10 } },
          grid: { display: false }
        }
      }
    }
  });
}

function renderDoctorChart(doctorWorkload) {
  const ctx = document.getElementById('doctorChart');
  if (!ctx) return;

  const labels = Object.keys(doctorWorkload || {});
  const data = Object.values(doctorWorkload || {});

  if (doctorChart) doctorChart.destroy();

  doctorChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: chartColors.slice(0, labels.length),
        borderWidth: 3,
        borderColor: '#ffffff',
        hoverOffset: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { font: { size: 11 }, padding: 12, usePointStyle: true, pointStyleWidth: 10 }
        }
      }
    }
  });
}

function renderStatusChart(stats) {
  const ctx = document.getElementById('statusChart');
  if (!ctx) return;

  if (statusChart) statusChart.destroy();

  statusChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Waiting', 'In Progress', 'Completed'],
      datasets: [{
        data: [stats.waiting || 0, stats.inProgress || 0, stats.completed || 0],
        backgroundColor: ['#f59e0b', '#3b82f6', '#10b981'],
        borderWidth: 3,
        borderColor: '#ffffff',
        hoverOffset: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { font: { size: 12 }, padding: 15, usePointStyle: true }
        }
      }
    }
  });
}

function renderNormalAppointments(appointments) {
  const container = document.getElementById('normalAppointmentsList');
  if (!container) return;

  if (!appointments || appointments.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:#64748b; padding:2rem;">No normal active appointments</p>';
    return;
  }

  container.innerHTML = appointments.map(apt => {
    const statusClass = apt.status === 'completed' ? 'status-completed' :
                        apt.status === 'in-progress' ? 'status-in-progress' : 'status-waiting';
    const statusLabel = apt.status === 'in-progress' ? 'In Progress' :
                        apt.status.charAt(0).toUpperCase() + apt.status.slice(1);
    return renderAppointmentCard(apt, { emergencyStyle: false, statusClass, statusLabel });
  }).join('');
}

function renderEmergencyAppointments(appointments) {
  const container = document.getElementById('emergencyAppointmentsList');
  if (!container) return;

  if (!appointments || appointments.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:#64748b; padding:2rem;">No active emergency appointments</p>';
    return;
  }

  container.innerHTML = appointments.map(apt => {
    const statusClass = apt.status === 'completed' ? 'status-completed' :
                        apt.status === 'in-progress' ? 'status-in-progress' : 'status-waiting';
    const statusLabel = apt.status === 'in-progress' ? 'In Progress' :
                        apt.status.charAt(0).toUpperCase() + apt.status.slice(1);

    return renderAppointmentCard(apt, { emergencyStyle: true, statusClass, statusLabel });
  }).join('');
}

function renderAppointmentCard(apt, { emergencyStyle, statusClass, statusLabel }) {
  const cardStyle = emergencyStyle
    ? 'background:linear-gradient(135deg, #7f1d1d 0%, #b91c1c 45%, #dc2626 100%); border:2px solid #fecaca; box-shadow:0 10px 28px rgba(220,38,38,0.38);'
    : '';
  const tokenStyle = emergencyStyle
    ? 'background:linear-gradient(135deg, #fee2e2, #fecaca); color:#991b1b;'
    : '';
  const nameStyle = emergencyStyle ? 'color:#ffffff;' : '';
  const metaStyle = emergencyStyle ? 'color:#fee2e2;' : '';
  const emergencyPill = emergencyStyle
    ? '<span style="display:inline-flex; align-items:center; gap:4px; font-size:0.72rem; font-weight:800; color:#7f1d1d; background:#fee2e2; border:1px solid #fecaca; border-radius:999px; padding:0.18rem 0.55rem; margin-left:0.55rem;"><i class="fas fa-triangle-exclamation"></i> EMERGENCY</span>'
    : '';
  const actionBtnClass = emergencyStyle ? 'btn-danger btn-sm' : 'btn-primary btn-sm';

  return `
    <div class="appointment-card" style="${cardStyle}">
      <div class="appointment-token" style="${tokenStyle}">#${apt.tokenNumber}</div>
      <div class="appointment-info">
        <div class="appointment-name" style="${nameStyle}">${apt.patientName}${emergencyPill}</div>
        <div class="appointment-meta" style="${metaStyle}">
          <span style="color:${getDeptColor(apt.department)}; font-weight:600;">${apt.department}</span>
          &nbsp;•&nbsp; ${apt.doctorName} &nbsp;•&nbsp; ${formatTime(apt.timeSlot)}
          &nbsp;•&nbsp; Wait: ${apt.estimatedWaitTime}m
        </div>
      </div>
      <span class="status-badge ${statusClass}">${statusLabel}</span>
      <div class="appointment-actions">
        ${apt.status === 'waiting' ? `<button class="${actionBtnClass}" onclick="updateStatus('${apt._id || apt.appointmentId}', 'in-progress')"><i class="fas fa-play"></i></button>` : ''}
        ${apt.status === 'in-progress' ? `<button class="btn-secondary btn-sm" onclick="updateStatus('${apt._id || apt.appointmentId}', 'completed')"><i class="fas fa-check"></i></button>` : ''}
      </div>
    </div>
  `;
}

async function updateStatus(id, status) {
  try {
    await apiCall(`/api/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    showToast('Updated', `Appointment marked as ${status}`, 'success');
    loadDashboard();
  } catch (err) {
    showToast('Error', 'Failed to update appointment', 'error');
  }
}
