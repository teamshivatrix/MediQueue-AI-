// MediQueue AI - Booking Page JavaScript

let allDoctors = [];
let selectedDoctor = null;

document.addEventListener('DOMContentLoaded', () => {
  // Set minimum date to today
  const dateInput = document.getElementById('appointmentDate');
  if (dateInput) {
    dateInput.min = new Date().toISOString().split('T')[0];
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  // Load all doctors upfront
  fetchAllDoctors();
});

async function fetchAllDoctors() {
  try {
    allDoctors = await apiCall('/api/doctors');
  } catch (err) {
    console.error('Failed to load doctors:', err);
  }
}

// Load doctors when department is selected
function loadDoctors() {
  const dept = document.getElementById('department').value;
  const doctorSelect = document.getElementById('doctor');
  const timeSlotSelect = document.getElementById('timeSlot');

  doctorSelect.innerHTML = '<option value="">Select Doctor</option>';
  timeSlotSelect.innerHTML = '<option value="">Select doctor first</option>';

  if (!dept) return;

  const filtered = allDoctors.filter(d => d.department === dept && d.isAvailable);

  if (filtered.length === 0) {
    doctorSelect.innerHTML = '<option value="">No doctors available</option>';
    return;
  }

  filtered.forEach(doc => {
    const option = document.createElement('option');
    option.value = doc._id;
    option.textContent = `${doc.name} (${doc.specialization || doc.department})`;
    option.dataset.name = doc.name;
    doctorSelect.appendChild(option);
  });
}

// Load time slots when doctor is selected
function loadTimeSlots() {
  const doctorId = document.getElementById('doctor').value;
  const timeSlotSelect = document.getElementById('timeSlot');

  timeSlotSelect.innerHTML = '<option value="">Select time slot</option>';

  if (!doctorId) return;

  selectedDoctor = allDoctors.find(d => d._id === doctorId);
  if (!selectedDoctor || !selectedDoctor.availableSlots) return;

  selectedDoctor.availableSlots.forEach(slot => {
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
    const result = await apiCall('/api/ai/analyze-symptoms', {
      method: 'POST',
      body: JSON.stringify({ symptoms })
    });

    suggestionText.innerHTML = `
      <strong>${result.department}</strong> (${result.priority} priority)
      <br><small style="color:#64748b;">Confidence: ${Math.round((result.confidence || 0.8) * 100)}% | AI: ${result.aiProvider || 'built-in'}</small>
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

    // Auto-select priority
    if (result.priority) {
      const prioSelect = document.getElementById('priority');
      if (prioSelect) prioSelect.value = result.priority;
    }

    showToast('AI Analysis Complete', `Suggested: ${result.department}`, 'success');
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
  const priority = document.getElementById('priority').value;

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
        doctorId, doctorName, date, timeSlot, priority
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
      <div class="success-detail-row"><span class="success-detail-label">Priority</span><span class="success-detail-value" style="text-transform:capitalize;">${apt.priority}</span></div>
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
