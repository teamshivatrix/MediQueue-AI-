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

// ── My Appointment Card ──
async function loadMyAppointment() {
  const session = getCurrentUser();
  const card = document.getElementById('myAppointmentCard');
  if (!card) return;

  if (!session || !session.user || !session.user.phone) {
    card.style.display = 'none';
    return;
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const res = await fetch(API_BASE + '/api/appointments?phone=' + encodeURIComponent(session.user.phone) + '&date=' + today);
    const list = await res.json();
    if (!Array.isArray(list) || !list.length) { card.style.display = 'none'; return; }

    // Only latest active appointment
    const active = list
      .filter(a => a.status === 'waiting' || a.status === 'in-progress')
      .sort((a, b) => b.tokenNumber - a.tokenNumber);
    if (!active.length) { card.style.display = 'none'; return; }

    const apt = active[0];

    // Queue position
    let aheadCount = '--';
    if (allQueueData && allQueueData.waitingQueue) {
      const idx = allQueueData.waitingQueue.findIndex(q =>
        q._id === apt._id || q.appointmentId === apt.appointmentId || q.tokenNumber === apt.tokenNumber
      );
      if (idx >= 0) aheadCount = idx;
    }

    const isServing = apt.status === 'in-progress';
    const waitMin = apt.estimatedWaitTime || 0;
    const statusColor = isServing ? '#34d399' : '#f59e0b';
    const statusText = isServing ? '🟢 Being Served Now!' : '⏳ Waiting';

    card.style.display = 'block';
    card.innerHTML = `
      <div style="background:linear-gradient(135deg,rgba(8,145,178,0.15),rgba(5,150,105,0.1));border:1px solid rgba(8,145,178,0.3);border-radius:20px;padding:1rem 1.5rem;display:flex;align-items:center;gap:1.5rem;flex-wrap:wrap;backdrop-filter:blur(12px);">
        <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#0891b2,#059669);display:flex;align-items:center;justify-content:center;color:white;font-size:1.2rem;font-weight:900;flex-shrink:0;">
          ${(session.user.name || 'P').charAt(0).toUpperCase()}
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:0.65rem;font-weight:700;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1px;margin-bottom:1px;">Your Appointment Today</div>
          <div style="font-size:0.95rem;font-weight:800;color:white;">${session.user.name || apt.patientName}</div>
          <div style="font-size:0.78rem;color:rgba(255,255,255,0.55);margin-top:1px;">
            <i class="fas fa-hospital" style="color:#22d3ee;"></i> ${apt.department} &nbsp;·&nbsp;
            <i class="fas fa-user-md" style="color:#34d399;"></i> ${apt.doctorName}
          </div>
        </div>
        <div style="text-align:center;flex-shrink:0;">
          <div style="font-size:0.6rem;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;">Token</div>
          <div style="font-size:1.8rem;font-weight:900;color:#22d3ee;line-height:1.1;">#${apt.tokenNumber}</div>
        </div>
        <div style="text-align:center;flex-shrink:0;background:rgba(255,255,255,0.06);border-radius:10px;padding:0.5rem 0.9rem;min-width:75px;">
          <div style="font-size:0.6rem;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;margin-bottom:1px;">Est. Wait</div>
          <div style="font-size:1.3rem;font-weight:800;color:${statusColor};">${isServing ? '0' : waitMin}<span style="font-size:0.7rem;"> min</span></div>
          ${aheadCount !== '--' ? `<div style="font-size:0.65rem;color:rgba(255,255,255,0.4);">${aheadCount} ahead</div>` : ''}
        </div>
        <div style="font-size:0.8rem;font-weight:700;color:${statusColor};flex-shrink:0;">${statusText}</div>
      </div>`;
  } catch (_) {
    card.style.display = 'none';
  }
}

async function initQueueBoardMode() {
  const token = sessionStorage.getItem('adminToken');
  if (!token) return;
  try {
    const verify = await fetch(`${API_BASE}/api/admin/verify`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
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
  } catch (_) {}
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
    loadMyAppointment();
  } catch (err) {
    console.error('Failed to load queue data:', err);
  }
}

function renderQueueData(data) {
  const dept = (document.getElementById('deptFilter') || {}).value || '';

  const waitingQueue = dept
    ? (data.waitingQueue || []).filter(a => a.department === dept)
    : (data.waitingQueue || []);

  const currentServing = dept
    ? (data.currentServing && data.currentServing.department === dept ? data.currentServing : null)
    : data.currentServing;

  const nextInQueue = dept ? waitingQueue[0] || null : data.nextInQueue;

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
      <div class="queue-list-item" style="animation-delay:${i * 0.05}s;">
        <div class="queue-list-token">#${apt.tokenNumber}</div>
        <div class="queue-list-name">${apt.patientName}</div>
        <div class="queue-list-dept">${apt.department}</div>
        <div class="queue-list-wait"><i class="fas fa-clock"></i> ${apt.estimatedWaitTime || 0}m</div>
        ${isAdminQueueMode ? `<button onclick="takeFirstFromQueue('${apt._id || apt.appointmentId}')" style="border:none;border-radius:10px;padding:0.4rem 0.65rem;font-size:0.75rem;font-weight:700;color:white;background:linear-gradient(135deg,#dc2626,#b91c1c);cursor:pointer;"><i class="fas fa-bolt"></i> Critical First</button>` : ''}
      </div>`).join('');
  } else {
    listEl.innerHTML = '<p style="text-align:center;color:rgba(255,255,255,0.3);padding:2rem;">Queue is empty</p>';
  }
}

async function takeFirstFromQueue(id) {
  if (!id) return;
  try {
    await apiCall(`/api/appointments/${id}/take-first`, { method: 'PATCH', body: JSON.stringify({}) });
    showToast('Critical Priority', 'Patient moved to front of queue', 'warning');
    loadQueueData();
  } catch (err) {
    showToast('Error', err.message || 'Could not prioritize this patient', 'error');
  }
}
