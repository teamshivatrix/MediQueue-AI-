// MediQueue AI - Queue Display JavaScript

let isAdminQueueMode = false;

document.addEventListener('DOMContentLoaded', () => {
  initQueueBoardMode();
  updateDateTime();
  loadQueueData();
  // Refresh every 10 seconds for live feel
  setInterval(loadQueueData, 10000);
  setInterval(updateDateTime, 1000);
});

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

    // Current serving
    if (data.currentServing) {
      document.getElementById('servingToken').textContent = data.currentServing.tokenNumber;
      document.getElementById('servingName').textContent = data.currentServing.patientName;
      document.getElementById('servingDept').textContent = data.currentServing.department;
      document.getElementById('servingDoctor').innerHTML = `<i class="fas fa-user-md"></i> <span>${data.currentServing.doctorName}</span>`;
    } else {
      document.getElementById('servingToken').textContent = '--';
      document.getElementById('servingName').textContent = 'No patient currently being served';
      document.getElementById('servingDept').textContent = '';
      document.getElementById('servingDoctor').innerHTML = '<i class="fas fa-user-md"></i> <span>--</span>';
    }

    // Next in queue
    if (data.nextInQueue) {
      document.getElementById('nextToken').textContent = data.nextInQueue.tokenNumber;
      document.getElementById('nextName').textContent = data.nextInQueue.patientName + ' • ' + data.nextInQueue.department;
    } else {
      document.getElementById('nextToken').textContent = '--';
      document.getElementById('nextName').textContent = 'No patients waiting';
    }

    // Stats
    document.getElementById('qStatWaiting').textContent = data.totalWaiting || 0;
    document.getElementById('qStatCompleted').textContent = data.totalCompleted || 0;
    document.getElementById('qStatTotal').textContent = data.totalToday || 0;

    // Waiting list
    const listEl = document.getElementById('waitingList');
    if (data.waitingQueue && data.waitingQueue.length > 0) {
      listEl.innerHTML = data.waitingQueue.map((apt, i) => `
        <div class="queue-list-item" style="animation-delay: ${i * 0.05}s;">
          <div class="queue-list-token">#${apt.tokenNumber}</div>
          <div class="queue-list-name">${apt.patientName}</div>
          <div class="queue-list-dept">${apt.department}</div>
          <div class="queue-list-wait"><i class="fas fa-clock"></i> ${apt.estimatedWaitTime || 0}m</div>
          ${isAdminQueueMode ? `<button onclick="takeFirstFromQueue('${apt._id || apt.appointmentId}')" style="border:none; border-radius:10px; padding:0.4rem 0.65rem; font-size:0.75rem; font-weight:700; color:white; background:linear-gradient(135deg,#dc2626,#b91c1c); cursor:pointer;"><i class=\"fas fa-bolt\"></i> Critical First</button>` : ''}
        </div>
      `).join('');
    } else {
      listEl.innerHTML = '<p style="text-align:center; color:rgba(255,255,255,0.3); padding:2rem;">Queue is empty</p>';
    }
  } catch (err) {
    console.error('Failed to load queue data:', err);
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
