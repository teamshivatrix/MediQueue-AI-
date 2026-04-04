function getRedirectTarget() {
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get('redirect') || 'patient-home.html';
  // Avoid open redirect patterns for this static app.
  if (redirect.includes('://') || redirect.startsWith('//')) return 'patient-home.html';
  return redirect;
}

let forgotResetToken = null;
let forgotVerifiedPhone = null;

function switchAuthMode(mode) {
  const loginTab = document.getElementById('loginTab');
  const signupTab = document.getElementById('signupTab');
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');

  const isLogin = mode === 'login';
  loginTab.classList.toggle('active', isLogin);
  signupTab.classList.toggle('active', !isLogin);
  loginForm.classList.toggle('active', isLogin);
  signupForm.classList.toggle('active', !isLogin);
}

function setFormLoading(formId, isLoading, loadingText) {
  const form = document.getElementById(formId);
  if (!form) return;
  const btn = form.querySelector('button[type="submit"]');
  if (!btn) return;

  if (isLoading) {
    btn.disabled = true;
    btn.dataset.prevHtml = btn.innerHTML;
    btn.innerHTML = `<div class="spinner"></div> ${loadingText}`;
  } else {
    btn.disabled = false;
    if (btn.dataset.prevHtml) {
      btn.innerHTML = btn.dataset.prevHtml;
      delete btn.dataset.prevHtml;
    }
  }
}

function continueAsCurrentUser() {
  window.location.href = getRedirectTarget();
}

function useAnotherAccount() {
  clearCurrentUser();
  const notice = document.getElementById('alreadyLoggedIn');
  if (notice) notice.style.display = 'none';

  const mode = new URLSearchParams(window.location.search).get('mode') === 'signup' ? 'signup' : 'login';
  switchAuthMode(mode);
}

function renderAlreadyLoggedInState() {
  const user = getCurrentUser();
  const notice = document.getElementById('alreadyLoggedIn');
  const nameEl = document.getElementById('loggedInUserName');
  if (!notice || !user) return;

  nameEl.textContent = user.name || user.email || 'User';
  notice.style.display = 'block';
}

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

function toggleForgotPasswordPanel() {
  const panel = document.getElementById('forgotPasswordPanel');
  if (!panel) return;
  panel.style.display = panel.style.display === 'none' || !panel.style.display ? 'block' : 'none';

  if (panel.style.display === 'none') {
    forgotResetToken = null;
    forgotVerifiedPhone = null;
  }
}

function getForgotPhone() {
  return normalizePhone(document.getElementById('forgotPhone').value);
}

function sendForgotOtp() {
  const phone = getForgotPhone();
  if (!phone || phone.length !== 10) {
    showToast('Invalid Phone', 'Please enter a valid 10-digit phone number', 'warning');
    return;
  }

  forgotResetToken = null;
  forgotVerifiedPhone = null;

  apiCall('/api/patients/forgot-password/send-otp', {
    method: 'POST',
    body: JSON.stringify({ phone })
  })
    .then((data) => {
      if (!data.success) {
        throw new Error(data.message || 'Could not send OTP');
      }

      if (data.delivery === 'dev-fallback' && data.debugOtp) {
        showToast('OTP Sent (Fallback)', `Your OTP is ${data.debugOtp}`, 'info');
      } else {
        showToast('OTP Sent', 'Please check your registered phone', 'success');
      }
    })
    .catch((err) => {
      showToast('OTP Failed', err.message || 'Could not send OTP', 'error');
    });
}

function verifyForgotOtp() {
  const phone = getForgotPhone();
  const otp = String(document.getElementById('forgotOtp').value || '').trim();

  if (!phone || phone.length !== 10) {
    showToast('Invalid Phone', 'Please enter a valid 10-digit phone number', 'warning');
    return;
  }

  if (!/^\d{4}$/.test(otp)) {
    showToast('Invalid OTP', 'Please enter a valid 4-digit OTP', 'warning');
    return;
  }

  apiCall('/api/patients/forgot-password/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phone, otp })
  })
    .then((data) => {
      if (!data.success || !data.resetToken) {
        throw new Error(data.message || 'OTP verification failed');
      }

      forgotResetToken = data.resetToken;
      forgotVerifiedPhone = phone;
      showToast('OTP Verified', 'Now set your new password', 'success');
    })
    .catch((err) => {
      forgotResetToken = null;
      forgotVerifiedPhone = null;
      showToast('Verification Failed', err.message || 'Invalid OTP', 'error');
    });
}

function handleForgotPassword() {
  const phone = getForgotPhone();
  const otp = String(document.getElementById('forgotOtp').value || '').trim();
  const newPassword = document.getElementById('forgotNewPassword').value;
  const confirmPassword = document.getElementById('forgotConfirmPassword').value;

  if (!phone || !otp || !newPassword || !confirmPassword) {
    showToast('Missing Fields', 'Please fill all reset fields', 'warning');
    return;
  }

  if (phone.length !== 10) {
    showToast('Invalid Phone', 'Please enter a valid 10-digit phone number', 'warning');
    return;
  }

  if (newPassword.length < 6) {
    showToast('Weak Password', 'Password must be at least 6 characters', 'warning');
    return;
  }

  if (newPassword !== confirmPassword) {
    showToast('Password Mismatch', 'New password and confirm password must match', 'error');
    return;
  }

  if (!forgotResetToken || forgotVerifiedPhone !== phone) {
    showToast('OTP Required', 'Please verify 4-digit OTP first', 'warning');
    return;
  }

  apiCall('/api/patients/forgot-password/reset', {
    method: 'POST',
    body: JSON.stringify({ phone, resetToken: forgotResetToken, newPassword })
  })
    .then((data) => {
      if (!data.success) {
        throw new Error(data.message || 'Could not reset password');
      }

      const panel = document.getElementById('forgotPasswordPanel');
      if (panel) panel.style.display = 'none';
      document.getElementById('forgotPhone').value = '';
      document.getElementById('forgotOtp').value = '';
      document.getElementById('forgotNewPassword').value = '';
      document.getElementById('forgotConfirmPassword').value = '';
      forgotResetToken = null;
      forgotVerifiedPhone = null;

      showToast('Password Reset', 'Password updated. Please login with new password.', 'success');
    })
    .catch((err) => {
      showToast('Reset Failed', err.message || 'Could not reset password', 'error');
    });
}

function handleSignup(event) {
  event.preventDefault();
  setFormLoading('signupForm', true, 'Creating...');

  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim().toLowerCase();
  const phone = normalizePhone(document.getElementById('signupPhone').value);
  const password = document.getElementById('signupPassword').value;
  const confirmPassword = document.getElementById('signupConfirmPassword').value;

  if (!name || !email || !phone || !password || !confirmPassword) {
    showToast('Missing Fields', 'Please fill all required fields', 'warning');
    setFormLoading('signupForm', false);
    return;
  }

  if (phone.length !== 10) {
    showToast('Invalid Phone', 'Please enter a valid 10-digit phone number', 'warning');
    setFormLoading('signupForm', false);
    return;
  }

  if (password.length < 6) {
    showToast('Weak Password', 'Password must be at least 6 characters', 'warning');
    setFormLoading('signupForm', false);
    return;
  }

  if (password !== confirmPassword) {
    showToast('Password Mismatch', 'Confirm password does not match', 'error');
    setFormLoading('signupForm', false);
    return;
  }

  const preferredLanguage = localStorage.getItem('mq_lang') || (typeof detectBrowserLanguage === 'function' ? detectBrowserLanguage() : 'en');
  const easyMode = localStorage.getItem('mq_easy_mode') === '1';

  apiCall('/api/patients/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, phone, password, preferredLanguage, easyMode })
  })
    .then((data) => {
      if (!data.success || !data.token || !data.user) {
        throw new Error(data.message || 'Could not create account');
      }

      setCurrentUser({ token: data.token, user: data.user });
      if (data.user.preferredLanguage) {
        localStorage.setItem('mq_lang', data.user.preferredLanguage);
      }
      if (typeof data.user.easyMode === 'boolean') {
        localStorage.setItem('mq_easy_mode', data.user.easyMode ? '1' : '0');
      }
      showToast('Account Created', 'Welcome to MediQueue AI!', 'success');
      setTimeout(() => {
        window.location.href = getRedirectTarget();
      }, 500);
    })
    .catch((err) => {
      showToast('Signup Failed', err.message || 'Could not create account', 'error');
      setFormLoading('signupForm', false);
    });
}

function handleLogin(event) {
  event.preventDefault();
  setFormLoading('loginForm', true, 'Verifying...');

  const identifier = document.getElementById('loginIdentifier').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;

  if (!identifier || !password) {
    showToast('Missing Fields', 'Please enter login details', 'warning');
    setFormLoading('loginForm', false);
    return;
  }

  apiCall('/api/patients/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password })
  })
    .then((data) => {
      if (!data.success || !data.token || !data.user) {
        throw new Error(data.message || 'Login failed');
      }

      setCurrentUser({ token: data.token, user: data.user });
      if (data.user.preferredLanguage) {
        localStorage.setItem('mq_lang', data.user.preferredLanguage);
      }
      if (typeof data.user.easyMode === 'boolean') {
        localStorage.setItem('mq_easy_mode', data.user.easyMode ? '1' : '0');
      }
      showToast('Login Successful', `Welcome back, ${data.user.name}`, 'success');
      setTimeout(() => {
        window.location.href = getRedirectTarget();
      }, 300);
    })
    .catch((err) => {
      showToast('Login Failed', err.message || 'Invalid credentials', 'error');
      setFormLoading('loginForm', false);
    });
}

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');
  if (mode === 'signup') {
    switchAuthMode('signup');
  }

  if (isUserLoggedIn()) {
    renderAlreadyLoggedInState();
  }
});
