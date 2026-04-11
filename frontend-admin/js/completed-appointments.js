document.addEventListener('DOMContentLoaded', () => {
  loadCompletedRecords();
});

async function loadCompletedRecords() {
  try {
    const appointments = await apiCall('/api/appointments?date=' + new Date().toISOString().split('T')[0] + '&status=completed');
    const normalCompleted = (appointments || []).filter((apt) => String(apt.priority || '').toLowerCase() !== 'emergency');
    const emergencyCompleted = (appointments || []).filter((apt) => String(apt.priority || '').toLowerCase() === 'emergency');

    // Fetch all prescriptions for today's appointments to know which ones already have one
    const phones = [...new Set((appointments || []).map(a => String(a.phone || '').replace(/\D/g, '')).filter(Boolean))];
    const existingPrescIds = new Set();
    await Promise.all(phones.map(async (phone) => {
      try {
        const res = await fetch(API_BASE + '/api/prescriptions?phone=' + phone);
        const data = await res.json();
        (data || []).forEach(p => { if (p.appointmentId) existingPrescIds.add(p.appointmentId); });
      } catch (_) {}
    }));

    renderCompletedList('normalCompletedList', normalCompleted, false, existingPrescIds);
    renderCompletedList('emergencyCompletedList', emergencyCompleted, true, existingPrescIds);
  } catch (err) {
    showToast('Error', 'Failed to load completed records', 'error');
  }
}

function renderCompletedList(containerId, appointments, emergencyStyle, existingPrescIds = new Set()) {
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

        const aptId = apt.appointmentId || apt._id || '';
        const hasPresc = existingPrescIds.has(aptId);

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
        <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;">
          <span class="status-badge status-completed">Completed</span>
          ${hasPresc
            ? `<button class="btn-outline btn-sm view-presc-btn"
                data-phone="${apt.phone||''}"
                data-aptid="${aptId}"
                style="font-size:0.75rem;padding:0.3rem 0.7rem;color:#059669;border-color:#059669;">
                <i class="fas fa-check-circle"></i> View Prescription
              </button>`
            : `<button class="btn-primary btn-sm presc-btn"
                data-id="${aptId}"
                data-name="${(apt.patientName||'').replace(/"/g,'&quot;')}"
                data-phone="${apt.phone||''}"
                data-doctor="${(apt.doctorName||'').replace(/"/g,'&quot;')}"
                data-dept="${apt.department||''}"
                data-date="${apt.date||''}"
                style="font-size:0.75rem;padding:0.3rem 0.7rem;">
                <i class="fas fa-file-prescription"></i> Add Prescription
              </button>`
          }
        </div>
      </div>
    `;
  }).join('');

  // Attach prescription button listeners after render
  container.querySelectorAll('.presc-btn').forEach(btn => {
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

  container.querySelectorAll('.view-presc-btn').forEach(btn => {
    btn.addEventListener('click', () => viewPrescriptionByAptId(btn.dataset.aptid, btn.dataset.phone));
  });
}

// ---- View Prescription Modal ----
async function viewPrescriptionByAptId(aptId, phone) {
  try {
    const res = await fetch(API_BASE + '/api/prescriptions?phone=' + encodeURIComponent(String(phone).replace(/\D/g,'')));
    const list = await res.json();
    const p = list.find(x => x.appointmentId === aptId) || list[0];
    if (!p) { showToast('Not found', 'Prescription not found', 'error'); return; }

    const old = document.getElementById('viewPrescModal');
    if (old) old.remove();

    const modal = document.createElement('div');
    modal.id = 'viewPrescModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(2,6,23,0.72);backdrop-filter:blur(4px);z-index:6000;display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;';

    const medsHtml = (p.medicines || []).filter(m => m.name).map(m => `
      <div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #f1f5f9;font-size:0.85rem;">
        <i class="fas fa-capsules" style="color:#0891b2;width:14px;"></i>
        <strong>${m.name}</strong>
        ${m.dosage ? `<span style="color:#64748b;">· ${m.dosage}</span>` : ''}
        ${m.duration ? `<span style="color:#64748b;">· ${m.duration}</span>` : ''}
        ${m.instructions ? `<span style="color:#059669;">· ${m.instructions}</span>` : ''}
      </div>`).join('');

    const attachHtml = (p.attachments || []).map(a => `
      <a href="${a.url}" target="_blank" style="display:inline-flex;align-items:center;gap:5px;padding:5px 12px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;font-size:0.78rem;color:#059669;text-decoration:none;font-weight:600;margin-right:6px;">
        <i class="fas fa-paperclip"></i> ${a.name || 'Attachment'}
      </a>`).join('');

    modal.innerHTML = `
      <div style="width:100%;max-width:620px;background:white;border-radius:20px;padding:24px;box-shadow:0 30px 80px rgba(0,0,0,0.3);max-height:90vh;overflow-y:auto;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.2rem;">
          <div>
            <h2 style="font-size:1.1rem;font-weight:800;margin:0;color:#0f172a;"><i class="fas fa-file-prescription" style="color:var(--accent);"></i> Prescription</h2>
            <p style="font-size:0.8rem;color:#64748b;margin:4px 0 0;">${p.patientName} &nbsp;·&nbsp; ${p.doctorName} &nbsp;·&nbsp; ${p.visitDate}</p>
          </div>
          <button onclick="document.getElementById('viewPrescModal').remove()" style="background:none;border:none;font-size:1.3rem;cursor:pointer;color:#64748b;">✕</button>
        </div>

        <div style="background:#f8fafc;border-radius:12px;padding:1rem;margin-bottom:1rem;">
          <div style="font-size:0.78rem;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:4px;">Diagnosis</div>
          <div style="font-size:0.95rem;color:#0f172a;font-weight:600;">${p.diagnosis}</div>
        </div>

        ${medsHtml ? `
        <div style="margin-bottom:1rem;">
          <div style="font-size:0.78rem;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:8px;"><i class="fas fa-pills" style="color:#059669;"></i> Medicines</div>
          ${medsHtml}
        </div>` : ''}

        ${p.instructions ? `
        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:0.75rem;margin-bottom:1rem;">
          <div style="font-size:0.78rem;font-weight:700;color:#92400e;margin-bottom:3px;"><i class="fas fa-info-circle"></i> Instructions</div>
          <div style="font-size:0.88rem;color:#78350f;">${p.instructions}</div>
        </div>` : ''}

        ${p.nextVisitDate ? `
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:0.75rem;margin-bottom:1rem;">
          <div style="font-size:0.78rem;font-weight:700;color:#065f46;"><i class="fas fa-calendar-check"></i> Next Visit: ${p.nextVisitDate}</div>
        </div>` : ''}

        ${attachHtml ? `<div style="margin-bottom:1rem;">${attachHtml}</div>` : ''}

        <div style="text-align:right;">
          <button class="btn-outline" onclick="document.getElementById('viewPrescModal').remove()">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  } catch (err) {
    showToast('Error', err.message, 'error');
  }
}

function openPrescriptionModal(aptData) {
  currentAptData = aptData;

  // Remove old modal if exists
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
        <textarea id="mInstructions" class="form-control" rows="2" placeholder="Rest, diet, precautions, follow-up advice..."></textarea>
      </div>

      <div class="form-group" style="margin-bottom:1rem;">
        <label style="font-size:0.82rem;font-weight:600;color:#374151;display:block;margin-bottom:4px;">Next Visit Date</label>
        <input type="date" id="mNextVisit" class="form-control">
      </div>

      <!-- Medicines -->
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

      <!-- File attachment -->
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
  addMedRow(); // add one empty medicine row by default
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

  const instructions = document.getElementById('mInstructions').value.trim();
  const nextVisit = document.getElementById('mNextVisit').value;

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
  formData.append('instructions', instructions);
  formData.append('nextVisitDate', nextVisit);
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
      loadCompletedRecords(); // refresh list so button changes to "View Prescription"
    } else {
      showToast('Error', data.error || 'Save failed', 'error');
    }
  } catch (err) {
    showToast('Error', err.message, 'error');
  }
}
