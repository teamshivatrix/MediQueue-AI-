// MediQueue AI - Patients Data Page

let lastEmergencyAlertTimestamp = 0;
let emergencyAlertTimer = null;

document.addEventListener('DOMContentLoaded', () => {
  loadPatients();
  pollEmergencyAlerts();
  connectAppointmentSSEPatients();
  setInterval(loadPatients, 30000);
  setInterval(pollEmergencyAlerts, 3000);
});

// SSE for new appointments — auto reload list + show badge
function connectAppointmentSSEPatients() {
  const es = new EventSource(API_BASE + '/api/appointments/events');
  es.addEventListener('new_appointment', (e) => {
    const apt = JSON.parse(e.data);
    loadPatients(); // auto refresh list
    showToast('New Appointment', `${apt.patientName} — ${apt.department} — Token #${apt.tokenNumber}`, 'info');
  });
  es.onerror = () => setTimeout(connectAppointmentSSEPatients, 3000);
}

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
    // Attach prescription button listeners after render
    document.querySelectorAll('.presc-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        openPrescriptionModal({
          appointmentId: btn.dataset.id,
          patientName: btn.dataset.name,
          patientPhone: btn.dataset.phone,
          doctorName: btn.dataset.doctor,
          department: btn.dataset.dept,
          visitDate: btn.dataset.date
        });
      });
    });
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

  const aptId = apt._id || apt.appointmentId || '';
  const showPrescBtn = apt.status === 'in-progress' || apt.status === 'completed';

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
        ${apt.status === 'waiting' ? `
          <button class="${emergencyStyle ? 'btn-danger' : 'btn-primary'} btn-sm" onclick="updateStatus('${aptId}', 'in-progress')" title="Call Next / Start">
            <i class="fas fa-play"></i> Call
          </button>
          <button class="btn-outline btn-sm" onclick="cancelAppointment('${aptId}')" title="Cancel Appointment" style="color:#dc2626;border-color:#dc2626;">
            <i class="fas fa-times"></i>
          </button>
        ` : ''}
        ${apt.status === 'in-progress' ? `
          <button class="btn-secondary btn-sm" onclick="updateStatus('${aptId}', 'completed')" title="Mark Completed">
            <i class="fas fa-check"></i> Done
          </button>
        ` : ''}
        ${showPrescBtn ? `<button class="btn-outline btn-sm presc-btn"
          data-id="${aptId}"
          data-name="${(apt.patientName||'').replace(/"/g,'&quot;')}"
          data-phone="${apt.phone||''}"
          data-doctor="${(apt.doctorName||'').replace(/"/g,'&quot;')}"
          data-dept="${apt.department||''}"
          data-date="${apt.date||''}"
          style="font-size:0.72rem;padding:0.28rem 0.6rem;">
          <i class="fas fa-file-prescription"></i> Prescription
        </button>` : ''}
      </div>
    </div>
  `;
}

async function cancelAppointment(id) {
  if (!confirm('Cancel this appointment?')) return;
  try {
    await apiCall(`/api/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'cancelled' })
    });
    showToast('Cancelled', 'Appointment has been cancelled', 'success');
    loadPatients();
  } catch (err) {
    showToast('Error', 'Failed to cancel appointment', 'error');
  }
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

// ---- Prescription Modal (shared with completed-appointments) ----
let currentAptData = null;

function openPrescriptionModal(aptData) {
  currentAptData = aptData;
  const old = document.getElementById('prescModal');
  if (old) old.remove();

  const modal = document.createElement('div');
  modal.id = 'prescModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(2,6,23,0.72);backdrop-filter:blur(4px);z-index:6000;display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;';
  modal.innerHTML = `
    <div style="width:100%;max-width:680px;background:white;border-radius:20px;padding:24px;box-shadow:0 30px 80px rgba(0,0,0,0.3);max-height:90vh;overflow-y:auto;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.2rem;">
        <div>
          <h2 style="font-size:1.15rem;font-weight:800;margin:0;color:#0f172a;"><i class="fas fa-file-prescription" style="color:var(--accent);"></i> Add Prescription</h2>
          <p style="font-size:0.8rem;color:#64748b;margin:4px 0 0;">${aptData.patientName} &nbsp;·&nbsp; ${aptData.doctorName} &nbsp;·&nbsp; ${aptData.visitDate}</p>
        </div>
        <button onclick="document.getElementById('prescModal').remove()" style="background:none;border:none;font-size:1.3rem;cursor:pointer;color:#64748b;">✕</button>
      </div>

      <div class="form-group" style="margin-bottom:1rem;">
        <label style="font-size:0.82rem;font-weight:600;color:#374151;display:block;margin-bottom:4px;">Diagnosis *</label>
        <textarea id="mDiagnosis" class="form-control" rows="2" placeholder="Patient diagnosis / condition..."></textarea>
      </div>
      <div class="form-group" style="margin-bottom:1rem;">
        <label style="font-size:0.82rem;font-weight:600;color:#374151;display:block;margin-bottom:4px;">Doctor Instructions</label>
        <textarea id="mInstructions" class="form-control" rows="2" placeholder="Rest, diet, precautions..."></textarea>
      </div>
      <div class="form-group" style="margin-bottom:1rem;">
        <label style="font-size:0.82rem;font-weight:600;color:#374151;display:block;margin-bottom:4px;">Next Visit Date</label>
        <input type="date" id="mNextVisit" class="form-control">
      </div>

      <div style="margin-bottom:1rem;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.6rem;">
          <label style="font-size:0.82rem;font-weight:600;color:#374151;"><i class="fas fa-pills" style="color:var(--secondary);"></i> Medicines</label>
          <button type="button" class="btn-outline btn-sm" onclick="addMedRow()"><i class="fas fa-plus"></i> Add</button>
        </div>
        <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr auto;gap:4px;margin-bottom:4px;">
          <span style="font-size:0.72rem;color:#64748b;font-weight:600;">Name</span>
          <span style="font-size:0.72rem;color:#64748b;font-weight:600;">Dosage</span>
          <span style="font-size:0.72rem;color:#64748b;font-weight:600;">Duration</span>
          <span style="font-size:0.72rem;color:#64748b;font-weight:600;">When</span>
          <span></span>
        </div>
        <div id="mMedContainer"></div>
      </div>

      <div class="form-group" style="margin-bottom:1.2rem;">
        <label style="font-size:0.82rem;font-weight:600;color:#374151;display:block;margin-bottom:4px;">Attach Files (PDF / Image) — optional</label>
        <input type="file" id="mFiles" class="form-control" accept=".pdf,.jpg,.jpeg,.png" multiple>
      </div>

      <div style="display:flex;gap:0.75rem;justify-content:flex-end;">
        <button class="btn-outline" onclick="document.getElementById('prescModal').remove()">Cancel</button>
        <button class="btn-primary" onclick="savePrescriptionFromModal()"><i class="fas fa-save"></i> Save Prescription</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  addMedRow();
}

function addMedRow() {
  const row = document.createElement('div');
  row.className = 'med-row';
  row.style.cssText = 'display:grid;grid-template-columns:2fr 1fr 1fr 1fr auto;gap:4px;margin-bottom:4px;align-items:center;';
  row.innerHTML = `
    <input type="text" class="form-control med-name" placeholder="e.g. Paracetamol" style="font-size:0.82rem;padding:0.4rem 0.6rem;">
    <input type="text" class="form-control med-dosage" placeholder="500mg" style="font-size:0.82rem;padding:0.4rem 0.6rem;">
    <input type="text" class="form-control med-duration" placeholder="5 days" style="font-size:0.82rem;padding:0.4rem 0.6rem;">
    <input type="text" class="form-control med-when" placeholder="After food" style="font-size:0.82rem;padding:0.4rem 0.6rem;">
    <button type="button" onclick="this.closest('.med-row').remove()" style="background:none;border:none;color:#dc2626;cursor:pointer;font-size:1rem;padding:0 4px;"><i class="fas fa-times"></i></button>
  `;
  document.getElementById('mMedContainer').appendChild(row);
}

async function savePrescriptionFromModal() {
  const diagnosis = document.getElementById('mDiagnosis').value.trim();
  if (!diagnosis) { showToast('Required', 'Please enter diagnosis', 'warning'); return; }

  const medicines = [...document.querySelectorAll('.med-row')].map(row => ({
    name: row.querySelector('.med-name').value.trim(),
    dosage: row.querySelector('.med-dosage').value.trim(),
    duration: row.querySelector('.med-duration').value.trim(),
    instructions: row.querySelector('.med-when').value.trim()
  })).filter(m => m.name);

  const formData = new FormData();
  formData.append('appointmentId', currentAptData.appointmentId || '');
  formData.append('patientName', currentAptData.patientName);
  formData.append('patientPhone', currentAptData.patientPhone || '');
  formData.append('doctorName', currentAptData.doctorName);
  formData.append('department', currentAptData.department || '');
  formData.append('visitDate', currentAptData.visitDate);
  formData.append('diagnosis', diagnosis);
  formData.append('instructions', document.getElementById('mInstructions').value.trim());
  formData.append('nextVisitDate', document.getElementById('mNextVisit').value);
  formData.append('medicines', JSON.stringify(medicines));
  const files = document.getElementById('mFiles').files;
  for (const f of files) formData.append('attachments', f);

  try {
    showToast('Saving...', 'Please wait', 'info');
    const res = await fetch(API_BASE + '/api/prescriptions', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.success) {
      showToast('Saved!', `Prescription saved for ${currentAptData.patientName}`, 'success');
      document.getElementById('prescModal').remove();
    } else {
      showToast('Error', data.error || 'Save failed', 'error');
    }
  } catch (err) {
    showToast('Error', err.message, 'error');
  }
}
