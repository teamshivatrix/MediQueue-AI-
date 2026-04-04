// MediQueue AI - Admin Dashboard JavaScript

let deptChart, hourChart, doctorChart, statusChart;
let lastEmergencyAlertTimestamp = 0;
let emergencyAlertTimer = null;

document.addEventListener('DOMContentLoaded', () => {
  loadDashboard();
  pollEmergencyAlerts();
  // Auto-refresh every 30 seconds
  setInterval(loadDashboard, 30000);
  setInterval(pollEmergencyAlerts, 3000);
});

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
