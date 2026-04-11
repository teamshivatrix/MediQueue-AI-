// MediQueue AI - Queue Display JavaScript

let isAdminQueueMode = false;
let allQueueData = null;

document.addEventListener('DOMContentLoaded', () => {
  initQueueBoardMode();
  updateDateTime();
  loadQueueData();
  setInterval(loadQueueData, 10000);
  setInterval(updateDateTime, 1000);
});

function applyDeptFilter() {
  if (allQueueData) renderQueueData(allQueueData);
}

async function initQueueBoardMode() {
  const token = sessionStorage.getItem('adminToken');
  if (!token) return;

  try {
    const verify = await fetch(`${API_BASE}/api/admin/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    const data = await verify.json();
    if (!data.valid) return;

    isAdminQueueMode = true;
    const backLink = document.querySelector('.back-link');
    if (backLink) {
      backLink.href = '/admin/admin-dashboard.html';
      backLink.innerHTML = '<i class="fas fa-arrow-left"></i> Back to Admin';
    }
  } catch (_err) {
    // Queue board remains read-only if admin verification fails.
  }
}

function updateDateTime() {
  const el = document.getElementById('currentDateTime');
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }) + '  •  ' + now.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}

async function loadQueueData() {
  try {
    const data = await apiCall('/api/appointments/queue');
    allQueueData = data;
    renderQueueData(data);
  } catch (err) {
    console.error('Failed to load queue data:', err);
  }
}

function renderQueueData(data) {
  const dept = (document.getElementById('deptFilter') || {}).value || '';

  // Filter waiting queue by department
  const waitingQueue = dept
    ? (data.waitingQueue || []).filter(a => a.department === dept)
    : (data.waitingQueue || []);

  // Current serving — filter if dept selected
  const currentServing = dept
    ? (data.currentServing && data.currentServing.department === dept ? data.currentServing : null)
    : data.currentServing;

  const nextInQueue = dept
    ? waitingQueue[0] || null
    : data.nextInQueue;

  if (currentServing) {
    document.getElementById('servingToken').textContent = currentServing.tokenNumber;
    document.getElementById('servingName').textContent = currentServing.patientName;
    document.getElementById('servingDept').textContent = currentServing.department;
    document.getElementById('servingDoctor').innerHTML = `<i class="fas fa-user-md"></i> <span>${currentServing.doctorName}</span>`;
  } else {
    document.getElementById('servingToken').textContent = '--';
    document.getElementById('servingName').textContent = dept ? 'No patient in ' + dept : 'No patient currently being served';
    document.getElementById('servingDept').textContent = '';
    document.getElementById('servingDoctor').innerHTML = '<i class="fas fa-user-md"></i> <span>--</span>';
  }

  if (nextInQueue) {
    document.getElementById('nextToken').textContent = nextInQueue.tokenNumber;
    document.getElementById('nextName').textContent = nextInQueue.patientName + ' • ' + nextInQueue.department;
  } else {
    document.getElementById('nextToken').textContent = '--';
    document.getElementById('nextName').textContent = 'No patients waiting';
  }

  document.getElementById('qStatWaiting').textContent = dept ? waitingQueue.length : (data.totalWaiting || 0);
  document.getElementById('qStatCompleted').textContent = data.totalCompleted || 0;
  document.getElementById('qStatTotal').textContent = data.totalToday || 0;

  const listEl = document.getElementById('waitingList');
  if (waitingQueue.length > 0) {
    listEl.innerHTML = waitingQueue.map((apt, i) => `
      <div class="queue-list-item" style="animation-delay: ${i * 0.05}s;">
        <div class="queue-list-token">#${apt.tokenNumber}</div>
        <div class="queue-list-name">${apt.patientName}</div>
        <div class="queue-list-dept">${apt.department}</div>
        <div class="queue-list-wait"><i class="fas fa-clock"></i> ${apt.estimatedWaitTime || 0}m</div>
        ${isAdminQueueMode ? `<button onclick="takeFirstFromQueue('${apt._id || apt.appointmentId}')" style="border:none; border-radius:10px; padding:0.4rem 0.65rem; font-size:0.75rem; font-weight:700; color:white; background:linear-gradient(135deg,#dc2626,#b91c1c); cursor:pointer;"><i class="fas fa-bolt"></i> Critical First</button>` : ''}
      </div>
    `).join('');
  } else {
    listEl.innerHTML = '<p style="text-align:center; color:rgba(255,255,255,0.3); padding:2rem;">Queue is empty</p>';
  }
}

async function takeFirstFromQueue(id) {
  if (!id) return;

  try {
    await apiCall(`/api/appointments/${id}/take-first`, {
      method: 'PATCH',
      body: JSON.stringify({})
    });
    showToast('Critical Priority', 'Patient moved to front of queue', 'warning');
    loadQueueData();
  } catch (err) {
    showToast('Error', err.message || 'Could not prioritize this patient', 'error');
  }
}
