// MediQueue AI - Patients Data Page

let lastEmergencyAlertTimestamp = 0;
let emergencyAlertTimer = null;

document.addEventListener('DOMContentLoaded', () => {
  loadPatients();
  pollEmergencyAlerts();
  setInterval(loadPatients, 30000);
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
  } catch (err) {}
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
  showToast('Emergency Alert', `${patient} booked emergency appointment`, 'error');
  if (emergencyAlertTimer) clearTimeout(emergencyAlertTimer);
  emergencyAlertTimer = setTimeout(hideEmergencyAlert, 5000);
}

function hideEmergencyAlert() {
  const box = document.getElementById('emergencyAlertBox');
  if (box) box.style.display = 'none';
}

async function loadPatients() {
  try {
    const appointments = await apiCall('/api/appointments?date=' + new Date().toISOString().split('T')[0]);
    const active = (appointments || []).filter(apt => apt.status !== 'completed');
    const normal = active.filter(apt => String(apt.priority || '').toLowerCase() !== 'emergency');
    const emergency = active.filter(apt => String(apt.priority || '').toLowerCase() === 'emergency');
    renderEmergencyAppointments(emergency);
    renderNormalAppointments(normal);
  } catch (err) {
    showToast('Error', 'Failed to load appointments', 'error');
  }
}

function renderNormalAppointments(appointments) {
  const container = document.getElementById('normalAppointmentsList');
  if (!container) return;
  if (!appointments || appointments.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:#64748b; padding:2rem;">No normal active appointments</p>';
    return;
  }
  container.innerHTML = appointments.map(apt => {
    const statusClass = apt.status === 'completed' ? 'status-completed' : apt.status === 'in-progress' ? 'status-in-progress' : 'status-waiting';
    const statusLabel = apt.status === 'in-progress' ? 'In Progress' : apt.status.charAt(0).toUpperCase() + apt.status.slice(1);
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
    const statusClass = apt.status === 'completed' ? 'status-completed' : apt.status === 'in-progress' ? 'status-in-progress' : 'status-waiting';
    const statusLabel = apt.status === 'in-progress' ? 'In Progress' : apt.status.charAt(0).toUpperCase() + apt.status.slice(1);
    return renderAppointmentCard(apt, { emergencyStyle: true, statusClass, statusLabel });
  }).join('');
}

function renderAppointmentCard(apt, { emergencyStyle, statusClass, statusLabel }) {
  const cardStyle = emergencyStyle
    ? 'background:linear-gradient(135deg, #7f1d1d 0%, #b91c1c 45%, #dc2626 100%); border:2px solid #fecaca; box-shadow:0 10px 28px rgba(220,38,38,0.38);'
    : '';
  const tokenStyle = emergencyStyle ? 'background:linear-gradient(135deg, #fee2e2, #fecaca); color:#991b1b;' : '';
  const nameStyle = emergencyStyle ? 'color:#ffffff;' : '';
  const metaStyle = emergencyStyle ? 'color:#fee2e2;' : '';
  const emergencyPill = emergencyStyle
    ? '<span style="display:inline-flex; align-items:center; gap:4px; font-size:0.72rem; font-weight:800; color:#7f1d1d; background:#fee2e2; border:1px solid #fecaca; border-radius:999px; padding:0.18rem 0.55rem; margin-left:0.55rem;"><i class="fas fa-triangle-exclamation"></i> EMERGENCY</span>'
    : '';

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
        ${apt.status === 'waiting' ? `<button class="${emergencyStyle ? 'btn-danger' : 'btn-primary'} btn-sm" onclick="updateStatus('${apt._id || apt.appointmentId}', 'in-progress')"><i class="fas fa-play"></i></button>` : ''}
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
    loadPatients();
  } catch (err) {
    showToast('Error', 'Failed to update appointment', 'error');
  }
}
