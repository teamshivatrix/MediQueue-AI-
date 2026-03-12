// MediQueue AI - Doctor Management JavaScript

let editingDoctorId = null;

document.addEventListener('DOMContentLoaded', () => {
  loadDoctors();
});

async function loadDoctors() {
  const dept = document.getElementById('filterDept').value;
  const query = dept ? `?department=${encodeURIComponent(dept)}` : '';

  try {
    const doctors = await apiCall('/api/doctors' + query);
    renderDoctorTable(doctors);
  } catch (err) {
    console.error('Failed to load doctors:', err);
  }
}

const avatarColors = ['#0891b2', '#059669', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#3b82f6'];

function renderDoctorTable(doctors) {
  const tbody = document.getElementById('doctorTableBody');
  if (!tbody) return;

  if (!doctors || doctors.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:2rem; color:#64748b;">No doctors found</td></tr>';
    return;
  }

  tbody.innerHTML = doctors.map((doc, i) => {
    const initials = doc.name.replace('Dr. ', '').split(' ').map(w => w[0]).join('').slice(0, 2);
    const color = avatarColors[i % avatarColors.length];
    const slotsCount = doc.availableSlots ? doc.availableSlots.length : 0;
    const schedDays = doc.schedule ? Object.entries(doc.schedule).filter(([, v]) => v).map(([k]) => k.slice(0, 3)).join(', ') : 'Mon-Fri';

    return `
      <tr>
        <td>
          <div class="doctor-name-cell">
            <div class="doctor-avatar" style="background:${color};">${initials}</div>
            <div>
              <div style="font-weight:600;">${doc.name}</div>
              <div style="font-size:0.75rem; color:#64748b;">${schedDays}</div>
            </div>
          </div>
        </td>
        <td><span class="dept-badge" style="background:${getDeptColor(doc.department)}22; color:${getDeptColor(doc.department)};">${doc.department}</span></td>
        <td>${doc.specialization || '--'}</td>
        <td>${doc.averageConsultationTime || 10} min</td>
        <td>${slotsCount} slots</td>
        <td><span class="status-badge ${doc.isAvailable ? 'status-available' : 'status-unavailable'}">${doc.isAvailable ? 'Available' : 'Unavailable'}</span></td>
        <td>
          <div style="display:flex; gap:0.4rem;">
            <button class="btn-primary btn-sm" onclick='editDoctor(${JSON.stringify(doc).replace(/'/g, "\\'")})'><i class="fas fa-edit"></i></button>
            <button class="btn-danger btn-sm" onclick="deleteDoctor('${doc._id}')"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openAddModal() {
  editingDoctorId = null;
  document.getElementById('modalTitle').innerHTML = '<i class="fas fa-user-md"></i> Add Doctor';
  document.getElementById('doctorForm').reset();
  document.getElementById('docConsultTime').value = 10;
  document.getElementById('docMaxPatients').value = 30;
  document.getElementById('docAvailable').value = 'true';
  // Reset schedule checkboxes
  ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].forEach(d => { document.getElementById('sched' + d).checked = true; });
  ['Sat', 'Sun'].forEach(d => { document.getElementById('sched' + d).checked = false; });
  document.getElementById('doctorModal').classList.add('show');
}

function editDoctor(doc) {
  editingDoctorId = doc._id;
  document.getElementById('modalTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Doctor';
  document.getElementById('docName').value = doc.name || '';
  document.getElementById('docDept').value = doc.department || '';
  document.getElementById('docSpec').value = doc.specialization || '';
  document.getElementById('docPhone').value = doc.phone || '';
  document.getElementById('docEmail').value = doc.email || '';
  document.getElementById('docConsultTime').value = doc.averageConsultationTime || 10;
  document.getElementById('docMaxPatients').value = doc.maxPatientsPerDay || 30;
  document.getElementById('docAvailable').value = doc.isAvailable ? 'true' : 'false';

  if (doc.schedule) {
    document.getElementById('schedMon').checked = doc.schedule.monday || false;
    document.getElementById('schedTue').checked = doc.schedule.tuesday || false;
    document.getElementById('schedWed').checked = doc.schedule.wednesday || false;
    document.getElementById('schedThu').checked = doc.schedule.thursday || false;
    document.getElementById('schedFri').checked = doc.schedule.friday || false;
    document.getElementById('schedSat').checked = doc.schedule.saturday || false;
    document.getElementById('schedSun').checked = doc.schedule.sunday || false;
  }

  document.getElementById('doctorModal').classList.add('show');
}

function closeModal() {
  document.getElementById('doctorModal').classList.remove('show');
  editingDoctorId = null;
}

async function saveDoctor() {
  const name = document.getElementById('docName').value.trim();
  const department = document.getElementById('docDept').value;

  if (!name || !department) {
    showToast('Missing Fields', 'Name and department are required', 'warning');
    return;
  }

  const data = {
    name,
    department,
    specialization: document.getElementById('docSpec').value.trim(),
    phone: document.getElementById('docPhone').value.trim(),
    email: document.getElementById('docEmail').value.trim(),
    averageConsultationTime: parseInt(document.getElementById('docConsultTime').value) || 10,
    maxPatientsPerDay: parseInt(document.getElementById('docMaxPatients').value) || 30,
    isAvailable: document.getElementById('docAvailable').value === 'true',
    schedule: {
      monday: document.getElementById('schedMon').checked,
      tuesday: document.getElementById('schedTue').checked,
      wednesday: document.getElementById('schedWed').checked,
      thursday: document.getElementById('schedThu').checked,
      friday: document.getElementById('schedFri').checked,
      saturday: document.getElementById('schedSat').checked,
      sunday: document.getElementById('schedSun').checked
    }
  };

  const btn = document.getElementById('saveDocBtn');
  btn.innerHTML = '<div class="spinner"></div> Saving...';
  btn.disabled = true;

  try {
    if (editingDoctorId) {
      await apiCall(`/api/doctors/${editingDoctorId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      showToast('Updated', `${name} has been updated`, 'success');
    } else {
      await apiCall('/api/doctors', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      showToast('Added', `${name} has been added`, 'success');
    }

    closeModal();
    loadDoctors();
  } catch (err) {
    showToast('Error', err.message || 'Failed to save doctor', 'error');
  } finally {
    btn.innerHTML = '<i class="fas fa-save"></i> Save Doctor';
    btn.disabled = false;
  }
}

async function deleteDoctor(id) {
  if (!confirm('Are you sure you want to remove this doctor?')) return;

  try {
    await apiCall(`/api/doctors/${id}`, { method: 'DELETE' });
    showToast('Deleted', 'Doctor removed successfully', 'success');
    loadDoctors();
  } catch (err) {
    showToast('Error', 'Failed to delete doctor', 'error');
  }
}

// Close modal on backdrop click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    closeModal();
  }
});
