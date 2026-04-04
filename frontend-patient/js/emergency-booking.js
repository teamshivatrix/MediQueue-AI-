async function submitEmergencyBooking() {
  const patientName = document.getElementById('emPatientName').value.trim();
  const age = document.getElementById('emAge').value;
  const phone = document.getElementById('emPhone').value.trim();
  const symptoms = document.getElementById('emSymptoms').value.trim();

  if (!patientName || !age || !phone || !symptoms) {
    showToast('Missing Fields', 'Please fill all required emergency details', 'warning');
    return;
  }

  if (String(phone).replace(/\D/g, '').length !== 10) {
    showToast('Invalid Phone', 'Please enter a valid 10-digit phone number', 'warning');
    return;
  }

  const btn = document.getElementById('emSubmitBtn');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div> Sending Emergency Alert...';

  try {
    const result = await apiCall('/api/emergency/book', {
      method: 'POST',
      body: JSON.stringify({ patientName, age, phone, symptoms })
    });

    if (!result.success || !result.appointment) {
      throw new Error(result.message || 'Could not book emergency appointment');
    }

    const apt = result.appointment;

    document.getElementById('emergencyFormCard').style.display = 'none';
    const successCard = document.getElementById('emergencySuccessCard');
    successCard.classList.add('show');

    document.getElementById('emergencySuccessDetails').innerHTML = `
      <div class="success-detail-row"><span class="success-detail-label">Appointment ID</span><span class="success-detail-value">${apt.appointmentId}</span></div>
      <div class="success-detail-row"><span class="success-detail-label">Token Number</span><span class="success-detail-value" style="font-size:1.2rem; font-weight:800; color:#b91c1c;">#${apt.tokenNumber}</span></div>
      <div class="success-detail-row"><span class="success-detail-label">Department</span><span class="success-detail-value">${apt.department}</span></div>
      <div class="success-detail-row"><span class="success-detail-label">Doctor</span><span class="success-detail-value">${apt.doctorName}</span></div>
      <div class="success-detail-row"><span class="success-detail-label">Priority</span><span class="success-detail-value" style="text-transform:uppercase; color:#dc2626;">${apt.priority}</span></div>
      <div class="success-detail-row"><span class="success-detail-label">Estimated Wait</span><span class="success-detail-value">${apt.estimatedWaitTime || 0} min</span></div>
    `;

    showToast('Emergency Booked', 'Admin notified with RED emergency alert', 'success');
  } catch (err) {
    showToast('Booking Failed', err.message || 'Please try again', 'error');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-bell"></i> Book Emergency Appointment';
  }
}
