document.addEventListener('DOMContentLoaded', () => {
  loadCompletedRecords();
});

async function loadCompletedRecords() {
  try {
    const appointments = await apiCall('/api/appointments?date=' + new Date().toISOString().split('T')[0] + '&status=completed');
    const normalCompleted = (appointments || []).filter((apt) => String(apt.priority || '').toLowerCase() !== 'emergency');
    const emergencyCompleted = (appointments || []).filter((apt) => String(apt.priority || '').toLowerCase() === 'emergency');

    renderCompletedList('normalCompletedList', normalCompleted, false);
    renderCompletedList('emergencyCompletedList', emergencyCompleted, true);
  } catch (err) {
    showToast('Error', 'Failed to load completed records', 'error');
  }
}

function renderCompletedList(containerId, appointments, emergencyStyle) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!appointments || appointments.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:#64748b; padding:2rem;">No records found</p>';
    return;
  }

  container.innerHTML = appointments.map((apt) => {
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
        <span class="status-badge status-completed">Completed</span>
      </div>
    `;
  }).join('');
}
