// MediQueue AI - Admin Dashboard JavaScript

let deptChart, hourChart, doctorChart, statusChart;

document.addEventListener('DOMContentLoaded', () => {
  loadDashboard();
  // Auto-refresh every 30 seconds
  setInterval(loadDashboard, 30000);
});

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
    renderAppointmentsList(appointments);
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

function renderAppointmentsList(appointments) {
  const container = document.getElementById('appointmentsList');
  if (!container) return;

  if (!appointments || appointments.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:#64748b; padding:2rem;">No appointments for today</p>';
    return;
  }

  container.innerHTML = appointments.map(apt => {
    const statusClass = apt.status === 'completed' ? 'status-completed' :
                        apt.status === 'in-progress' ? 'status-in-progress' : 'status-waiting';
    const statusLabel = apt.status === 'in-progress' ? 'In Progress' :
                        apt.status.charAt(0).toUpperCase() + apt.status.slice(1);

    return `
      <div class="appointment-card">
        <div class="appointment-token">#${apt.tokenNumber}</div>
        <div class="appointment-info">
          <div class="appointment-name">${apt.patientName}</div>
          <div class="appointment-meta">
            <span style="color:${getDeptColor(apt.department)}; font-weight:600;">${apt.department}</span>
            &nbsp;•&nbsp; ${apt.doctorName} &nbsp;•&nbsp; ${formatTime(apt.timeSlot)}
            &nbsp;•&nbsp; Wait: ${apt.estimatedWaitTime}m
          </div>
        </div>
        <span class="status-badge ${statusClass}">${statusLabel}</span>
        <div class="appointment-actions">
          ${apt.status === 'waiting' ? `<button class="btn-primary btn-sm" onclick="updateStatus('${apt._id || apt.appointmentId}', 'in-progress')"><i class="fas fa-play"></i></button>` : ''}
          ${apt.status === 'in-progress' ? `<button class="btn-secondary btn-sm" onclick="updateStatus('${apt._id || apt.appointmentId}', 'completed')"><i class="fas fa-check"></i></button>` : ''}
        </div>
      </div>
    `;
  }).join('');
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
