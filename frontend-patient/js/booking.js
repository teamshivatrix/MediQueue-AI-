// MediQueue AI - Booking Page JavaScript

let allDoctors = [];
let selectedDoctor = null;

function defaultSlots() {
  // 24/7 slots — every 30 min from 00:00 to 23:30
  const slots = [];
  for (let h = 0; h < 24; h++) {
    const hh = String(h).padStart(2, '0');
    slots.push(`${hh}:00`, `${hh}:30`);
  }
  return slots;
}

async function fetchDoctorsByDepartment(dept) {
  const encodedDept = encodeURIComponent(dept);
  const primary = (typeof API_BASE === 'string' ? API_BASE : '');
  const candidates = [
    `${primary}/api/doctors?department=${encodedDept}&available=true`,
    `${primary}/api/doctors?department=${encodedDept}`,
    `/api/doctors?department=${encodedDept}&available=true`,
    `http://localhost:3000/api/doctors?department=${encodedDept}&available=true`
  ];

  const tried = new Set();
  let lastError = new Error('Unable to fetch doctors');

  for (const url of candidates) {
    const normalizedUrl = url.replace('///', '//');
    if (tried.has(normalizedUrl)) continue;
    tried.add(normalizedUrl);

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(normalizedUrl, { signal: controller.signal });
      clearTimeout(timer);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = await res.json();

      const list = Array.isArray(payload)
        ? payload
        : (Array.isArray(payload.doctors) ? payload.doctors : []);

      return list
        .filter(doc => doc && (doc.isAvailable !== false))
        .map(doc => ({
          ...doc,
          availableSlots: Array.isArray(doc.availableSlots) && doc.availableSlots.length > 0
            ? doc.availableSlots
            : defaultSlots()
        }));
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError;
}

document.addEventListener('DOMContentLoaded', () => {
  // Set minimum date to today
  const dateInput = document.getElementById('appointmentDate');
  if (dateInput) {
    dateInput.min = new Date().toISOString().split('T')[0];
    dateInput.value = new Date().toISOString().split('T')[0];
    dateInput.addEventListener('change', () => {
      if (document.getElementById('doctor').value) loadTimeSlots();
    });
  }

  // Auto-fill from logged-in session
  const session = getCurrentUser();
  if (session && session.user) {
    const u = session.user;
    if (u.name)  document.getElementById('patientName').value  = u.name;
    if (u.phone) document.getElementById('patientPhone').value = u.phone;

    // Age from dateOfBirth if available
    if (u.dateOfBirth) {
      const dob = new Date(u.dateOfBirth);
      const age = Math.floor((new Date() - dob) / (365.25 * 24 * 60 * 60 * 1000));
      if (age > 0 && age < 120) document.getElementById('patientAge').value = age;
    }

    // Fetch full profile for age if not in session
    if (!u.dateOfBirth && u.id) {
      fetch(API_BASE + '/api/patients/profile', {
        headers: { 'Authorization': 'Bearer ' + session.token }
      }).then(r => r.json()).then(data => {
        if (data.patient && data.patient.dateOfBirth) {
          const dob = new Date(data.patient.dateOfBirth);
          const age = Math.floor((new Date() - dob) / (365.25 * 24 * 60 * 60 * 1000));
          if (age > 0 && age < 120) document.getElementById('patientAge').value = age;
        }
      }).catch(() => {});
    }
  }
});

function getFilteredFutureSlots(slots) {
  const dateInput = document.getElementById('appointmentDate');
  const selectedDate = dateInput ? dateInput.value : '';
  const today = new Date().toISOString().split('T')[0];

  if (!selectedDate || selectedDate !== today) return slots;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return slots.filter((slot) => {
    const [hh, mm] = String(slot).split(':').map(Number);
    const slotMinutes = (hh * 60) + mm;
    return slotMinutes > currentMinutes;
  });
}

// Load doctors when department is selected - always fresh fetch
function loadDoctors() {
  const dept = document.getElementById('department').value;
  const doctorSelect = document.getElementById('doctor');
  const timeSlotSelect = document.getElementById('timeSlot');

  doctorSelect.innerHTML = '<option value="">Select Doctor</option>';
  timeSlotSelect.innerHTML = '<option value="">Select doctor first</option>';

  if (!dept) return;

  doctorSelect.innerHTML = '<option value="">Loading doctors...</option>';

  fetchDoctorsByDepartment(dept)
    .then(doctors => {
      allDoctors = doctors;
      doctorSelect.innerHTML = '<option value="">Select Doctor</option>';

      if (doctors.length === 0) {
        doctorSelect.innerHTML = '<option value="">No doctors available</option>';
        return;
      }

      doctors.forEach(doc => {
        const option = document.createElement('option');
        option.value = doc._id;
        option.textContent = doc.name + ' (' + (doc.specialization || doc.department) + ')';
        option.dataset.name = doc.name;
        doctorSelect.appendChild(option);
      });
    })
    .catch(err => {
      console.error('Failed to load doctors:', err);
      doctorSelect.innerHTML = '<option value="">Error loading - check server</option>';
    });
}

// Load time slots when doctor is selected
function loadTimeSlots() {
  const doctorId = document.getElementById('doctor').value;
  const timeSlotSelect = document.getElementById('timeSlot');

  timeSlotSelect.innerHTML = '<option value="">Select time slot</option>';
  if (!doctorId) return;

  selectedDoctor = allDoctors.find(d => d._id === doctorId);
  if (!selectedDoctor) return;

  // Use doctor's slots or full 24/7 default
  const slots = (Array.isArray(selectedDoctor.availableSlots) && selectedDoctor.availableSlots.length > 0)
    ? selectedDoctor.availableSlots
    : defaultSlots();

  slots.forEach(slot => {
    const option = document.createElement('option');
    option.value = slot;
    option.textContent = formatTime(slot);
    timeSlotSelect.appendChild(option);
  });
}

// AI Symptom Analysis for department suggestion
async function analyzeSymptoms() {
  const symptoms = document.getElementById('patientSymptoms').value.trim();
  if (!symptoms) {
    showToast('Missing Info', 'Please enter your symptoms first', 'warning');
    return;
  }

  const suggestion = document.getElementById('aiSuggestion');
  const suggestionText = document.getElementById('aiSuggestionText');
  suggestion.style.display = 'block';
  suggestionText.textContent = 'Analyzing symptoms...';

  try {
    const age = document.getElementById('patientAge').value || 30;

    // Run symptom analysis + risk scoring in parallel
    const [result, riskResult] = await Promise.all([
      apiCall('/api/ai/analyze-symptoms', { method: 'POST', body: JSON.stringify({ symptoms }) }),
      apiCall('/api/ai/risk-score', { method: 'POST', body: JSON.stringify({ symptoms, age }) }).catch(() => null)
    ]);

    let riskBadge = '';
    if (riskResult) {
      const riskColors = { low: '#059669', medium: '#f59e0b', high: '#f97316', emergency: '#dc2626' };
      const rc = riskColors[riskResult.riskLevel] || '#64748b';
      riskBadge = `<span style="display:inline-block;background:${rc};color:white;font-size:0.72rem;font-weight:700;padding:2px 8px;border-radius:20px;margin-left:6px;text-transform:uppercase;">${riskResult.riskLevel} risk</span>`;
    }

    suggestionText.innerHTML = `
      <strong>${result.department}</strong>${riskBadge}
      <br><small style="color:#64748b;">Confidence: ${Math.round((result.confidence || 0.8) * 100)}% | AI: ${result.aiProvider || 'built-in'}</small>
      ${riskResult ? `<br><small style="color:#64748b;">${riskResult.action}</small>` : ''}
    `;

    // Auto-select department
    const deptSelect = document.getElementById('department');
    if (deptSelect) {
      const options = Array.from(deptSelect.options);
      const match = options.find(o => o.value === result.department);
      if (match) {
        deptSelect.value = result.department;
        loadDoctors();
      }
    }

    // Emergency alert
    if (riskResult && riskResult.riskLevel === 'emergency') {
      showToast('⚠️ Emergency Risk Detected', 'Please go to Emergency immediately!', 'error');
    } else {
      showToast('AI Analysis Complete', `Suggested: ${result.department}`, 'success');
    }
  } catch (err) {
    suggestionText.textContent = 'Could not analyze symptoms. Please select department manually.';
    showToast('Analysis Failed', 'Please select department manually', 'error');
  }
}

// Submit booking
async function submitBooking() {
  const patientName = document.getElementById('patientName').value.trim();
  const age = document.getElementById('patientAge').value;
  const phone = document.getElementById('patientPhone').value.trim();
  const symptoms = document.getElementById('patientSymptoms').value.trim();
  const department = document.getElementById('department').value;
  const doctorId = document.getElementById('doctor').value;
  const date = document.getElementById('appointmentDate').value;
  const timeSlot = document.getElementById('timeSlot').value;

  // Validation
  if (!patientName || !age || !phone || !symptoms || !department || !doctorId || !date || !timeSlot) {
    showToast('Missing Fields', 'Please fill in all required fields', 'warning');
    return;
  }

  if (phone.length < 10) {
    showToast('Invalid Phone', 'Please enter a valid 10-digit phone number', 'warning');
    return;
  }

  const doctorOption = document.getElementById('doctor').selectedOptions[0];
  const doctorName = doctorOption ? doctorOption.dataset.name : 'Doctor';

  const btn = document.getElementById('submitBtn');
  btn.innerHTML = '<div class="spinner"></div> Booking...';
  btn.disabled = true;

  try {
    const result = await apiCall('/api/appointments', {
      method: 'POST',
      body: JSON.stringify({
        patientName, age, phone, symptoms, department,
        doctorId, doctorName, date, timeSlot
      })
    });

    const apt = result.appointment;

    // Show success card
    document.getElementById('bookingForm').style.display = 'none';
    const successCard = document.getElementById('bookingSuccess');
    successCard.classList.add('show');

    // Fill success details
    document.getElementById('successDetails').innerHTML = `
      <div class="success-detail-row"><span class="success-detail-label">Appointment ID</span><span class="success-detail-value">${apt.appointmentId}</span></div>
      <div class="success-detail-row"><span class="success-detail-label">Token Number</span><span class="success-detail-value" style="font-size:1.2rem; font-weight:800;">#${apt.tokenNumber}</span></div>
      <div class="success-detail-row"><span class="success-detail-label">Patient</span><span class="success-detail-value">${apt.patientName}</span></div>
      <div class="success-detail-row"><span class="success-detail-label">Doctor</span><span class="success-detail-value">${apt.doctorName}</span></div>
      <div class="success-detail-row"><span class="success-detail-label">Department</span><span class="success-detail-value">${apt.department}</span></div>
      <div class="success-detail-row"><span class="success-detail-label">Date</span><span class="success-detail-value">${formatDate(apt.date)}</span></div>
      <div class="success-detail-row"><span class="success-detail-label">Time</span><span class="success-detail-value">${formatTime(apt.timeSlot)}</span></div>
    `;

    // Show wait time progress
    const waitTime = apt.estimatedWaitTime || 0;
    document.getElementById('waitTimeText').textContent = `${waitTime} minutes`;
    setTimeout(() => {
      const fillPct = Math.min((waitTime / 60) * 100, 100);
      document.getElementById('waitProgressFill').style.width = fillPct + '%';
    }, 300);

    // Toast notification
    showToast('Appointment Booked!',
      `Token #${apt.tokenNumber} | ${apt.doctorName} | ${formatTime(apt.timeSlot)} | Wait: ${waitTime} min`,
      'success'
    );

    // Browser notification
    sendBrowserNotification(
      'Appointment Confirmed! 🏥',
      `Token #${apt.tokenNumber} - ${apt.doctorName} at ${formatTime(apt.timeSlot)}\nEstimated wait: ${waitTime} minutes`
    );

    // Store apt data for print
    window._lastBookedApt = apt;

  } catch (err) {
    showToast('Booking Failed', err.message || 'Please try again', 'error');
  } finally {
    btn.innerHTML = '<i class="fas fa-check-circle"></i> Book Appointment';
    btn.disabled = false;
  }
}

function resetForm() {
  document.getElementById('appointmentForm').reset();
  document.getElementById('aiSuggestion').style.display = 'none';
  document.getElementById('doctor').innerHTML = '<option value="">Select department first</option>';
  document.getElementById('timeSlot').innerHTML = '<option value="">Select doctor first</option>';
  const dateInput = document.getElementById('appointmentDate');
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
}

function newBooking() {
  document.getElementById('bookingSuccess').classList.remove('show');
  document.getElementById('bookingForm').style.display = 'block';
  resetForm();
}

function printAppointmentSlip() {
  const apt = window._lastBookedApt;
  if (!apt) return;

  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head><title>Appointment Slip - MediQueue AI</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 30px; max-width: 420px; margin: 0 auto; color: #0f172a; }
    .header { text-align: center; border-bottom: 3px solid #0891b2; padding-bottom: 16px; margin-bottom: 20px; }
    .logo { font-size: 1.4rem; font-weight: 900; color: #0891b2; }
    .token-box { background: linear-gradient(135deg, #0891b2, #0e7490); color: white; border-radius: 16px; padding: 20px; text-align: center; margin: 20px 0; }
    .token-num { font-size: 3.5rem; font-weight: 900; line-height: 1; }
    .token-label { font-size: 0.85rem; opacity: 0.85; margin-top: 4px; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; }
    .detail-label { color: #64748b; font-weight: 600; }
    .detail-value { font-weight: 700; color: #0f172a; }
    .footer { margin-top: 24px; text-align: center; font-size: 0.75rem; color: #94a3b8; }
    .wait-badge { background: #fef3c7; color: #92400e; border-radius: 8px; padding: 8px 16px; text-align: center; margin: 12px 0; font-weight: 700; font-size: 0.88rem; }
    @media print { body { padding: 10px; } }
  </style></head><body>
  <div class="header">
    <div class="logo">🏥 MediQueue AI</div>
    <div style="font-size:0.8rem;color:#64748b;margin-top:4px;">Government Hospital · Appointment Slip</div>
  </div>
  <div class="token-box">
    <div class="token-label">YOUR TOKEN NUMBER</div>
    <div class="token-num">#${apt.tokenNumber}</div>
    <div class="token-label">${apt.appointmentId}</div>
  </div>
  <div class="detail-row"><span class="detail-label">Patient</span><span class="detail-value">${apt.patientName}</span></div>
  <div class="detail-row"><span class="detail-label">Doctor</span><span class="detail-value">${apt.doctorName}</span></div>
  <div class="detail-row"><span class="detail-label">Department</span><span class="detail-value">${apt.department}</span></div>
  <div class="detail-row"><span class="detail-label">Date</span><span class="detail-value">${apt.date}</span></div>
  <div class="detail-row"><span class="detail-label">Time</span><span class="detail-value">${formatTime(apt.timeSlot)}</span></div>
  ${apt.estimatedWaitTime ? `<div class="wait-badge">⏱ Estimated Wait: ${apt.estimatedWaitTime} minutes</div>` : ''}
  <div class="footer">
    Please arrive 10 minutes before your appointment time.<br>
    Carry this slip and a valid ID. Emergency: 108
  </div>
  <script>window.onload = () => { window.print(); }<\/script>
  </body></html>`);
  win.document.close();
}
