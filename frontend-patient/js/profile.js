// MediQueue AI - Patient Profile

document.addEventListener('DOMContentLoaded', () => {
  const session = getCurrentUser();
  if (!session) { window.location.href = 'auth.html'; return; }

  const name = session.user?.name || 'Patient';
  const firstName = name.split(' ')[0];
  document.getElementById('sidebarUserName').textContent = firstName;
  document.getElementById('userAvatar').textContent = firstName.charAt(0).toUpperCase();
  document.getElementById('bigAvatar').textContent = firstName.charAt(0).toUpperCase();
  document.getElementById('headerName').textContent = name;
  document.getElementById('headerEmail').textContent = session.user?.email || '';

  // Pre-fill from session
  document.getElementById('pEmail').value = session.user?.email || '';
  document.getElementById('pPhone').value = session.user?.phone || '';

  loadProfile();
});

async function loadProfile() {
  const session = getCurrentUser();
  try {
    const res = await fetch(API_BASE + '/api/patients/profile?token=' + session.token);
    const data = await res.json();
    if (!data.success) return;
    const p = data.profile;

    // Basic
    document.getElementById('pName').value = p.name || '';
    document.getElementById('pDob').value = p.dateOfBirth || '';
    document.getElementById('pGender').value = p.gender || '';
    document.getElementById('pBloodGroup').value = p.bloodGroup || '';

    // Address
    document.getElementById('pAddress').value = p.address || '';
    document.getElementById('pCity').value = p.city || '';
    document.getElementById('pState').value = p.state || '';
    document.getElementById('pPincode').value = p.pincode || '';

    // Emergency
    document.getElementById('pEcName').value = p.emergencyContactName || '';
    document.getElementById('pEcPhone').value = p.emergencyContactPhone || '';
    document.getElementById('pEcRelation').value = p.emergencyContactRelation || '';

    // Medical
    document.getElementById('pAllergies').value = p.allergies || '';
    document.getElementById('pChronic').value = p.chronicConditions || '';
    document.getElementById('pMedications').value = p.currentMedications || '';

    // Badge
    updateCompleteBadge(p.profileComplete);
  } catch (e) {
    console.error('Profile load error:', e);
  }
}

function updateCompleteBadge(complete) {
  const badge = document.getElementById('completeBadge');
  if (complete) {
    badge.className = 'profile-complete-badge badge-complete';
    badge.innerHTML = '<i class="fas fa-check-circle"></i> Profile Complete';
  } else {
    badge.className = 'profile-complete-badge badge-incomplete';
    badge.innerHTML = '<i class="fas fa-clock"></i> Profile Incomplete';
  }
}

async function patchProfile(updates, successMsg) {
  const session = getCurrentUser();
  try {
    const res = await fetch(API_BASE + '/api/patients/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session.token },
      body: JSON.stringify({ token: session.token, ...updates })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Saved', successMsg, 'success');
      updateCompleteBadge(data.profileComplete);
      // Update session name if changed
      if (updates.name) {
        const s = getCurrentUser();
        if (s && s.user) { s.user.name = updates.name; setCurrentUser(s); }
        document.getElementById('headerName').textContent = updates.name;
        const fn = updates.name.split(' ')[0];
        document.getElementById('sidebarUserName').textContent = fn;
        document.getElementById('userAvatar').textContent = fn.charAt(0).toUpperCase();
        document.getElementById('bigAvatar').textContent = fn.charAt(0).toUpperCase();
      }
    } else {
      showToast('Error', data.message || 'Failed to save', 'error');
    }
  } catch (e) {
    showToast('Error', 'Could not save. Try again.', 'error');
  }
}

function saveBasicInfo() {
  const name = document.getElementById('pName').value.trim();
  const dateOfBirth = document.getElementById('pDob').value;
  const gender = document.getElementById('pGender').value;
  const bloodGroup = document.getElementById('pBloodGroup').value;
  if (!name) { showToast('Required', 'Please enter your name', 'warning'); return; }
  patchProfile({ name, dateOfBirth, gender, bloodGroup }, 'Basic info saved');
}

function saveAddress() {
  const address = document.getElementById('pAddress').value.trim();
  const city = document.getElementById('pCity').value.trim();
  const state = document.getElementById('pState').value.trim();
  const pincode = document.getElementById('pPincode').value.trim();
  if (!address || !city) { showToast('Required', 'Address and city are required', 'warning'); return; }
  patchProfile({ address, city, state, pincode }, 'Address saved');
}

function saveEmergencyContact() {
  const emergencyContactName = document.getElementById('pEcName').value.trim();
  const emergencyContactPhone = document.getElementById('pEcPhone').value.trim();
  const emergencyContactRelation = document.getElementById('pEcRelation').value;
  if (!emergencyContactName || !emergencyContactPhone) { showToast('Required', 'Name and phone are required', 'warning'); return; }
  if (!/^\d{10}$/.test(emergencyContactPhone)) { showToast('Invalid', 'Enter valid 10-digit phone', 'warning'); return; }
  patchProfile({ emergencyContactName, emergencyContactPhone, emergencyContactRelation }, 'Emergency contact saved');
}

function saveMedicalInfo() {
  const allergies = document.getElementById('pAllergies').value.trim();
  const chronicConditions = document.getElementById('pChronic').value.trim();
  const currentMedications = document.getElementById('pMedications').value.trim();
  patchProfile({ allergies, chronicConditions, currentMedications }, 'Medical info saved');
}

async function changePassword() {
  const session = getCurrentUser();
  const currentPassword = document.getElementById('pCurrPwd').value;
  const newPassword = document.getElementById('pNewPwd').value;
  const confirmPassword = document.getElementById('pConfirmPwd').value;

  if (!currentPassword || !newPassword || !confirmPassword) { showToast('Required', 'Fill all password fields', 'warning'); return; }
  if (newPassword.length < 6) { showToast('Weak', 'New password must be at least 6 characters', 'warning'); return; }
  if (newPassword !== confirmPassword) { showToast('Mismatch', 'Passwords do not match', 'error'); return; }

  try {
    const res = await fetch(API_BASE + '/api/patients/change-password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session.token },
      body: JSON.stringify({ token: session.token, currentPassword, newPassword })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Done', 'Password changed successfully', 'success');
      document.getElementById('pCurrPwd').value = '';
      document.getElementById('pNewPwd').value = '';
      document.getElementById('pConfirmPwd').value = '';
    } else {
      showToast('Failed', data.message || 'Could not change password', 'error');
    }
  } catch (e) {
    showToast('Error', 'Could not change password', 'error');
  }
}
