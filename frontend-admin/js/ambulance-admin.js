// MediQueue AI - Admin Ambulance Panel

let requests = [];
let alertTimer = null;
let alertSound = null;

document.addEventListener('DOMContentLoaded', () => {
  connectSSE();
});

// ---- SSE Real-time Connection ----
function connectSSE() {
  const es = new EventSource(API_BASE + '/api/ambulance/events');

  es.addEventListener('init', (e) => {
    requests = JSON.parse(e.data);
    renderAll();
  });

  es.addEventListener('new_request', (e) => {
    const req = JSON.parse(e.data);
    requests.unshift(req);
    renderAll();
    triggerAlert(req);
  });

  es.addEventListener('status_update', (e) => {
    const { _id, status } = JSON.parse(e.data);
    const item = requests.find(r => r._id === _id);
    if (item) { item.status = status; renderAll(); }
  });

  es.onerror = () => {
    setTimeout(connectSSE, 3000); // reconnect on drop
  };
}

// ---- Alert: red flash + sound for 5 sec ----
function triggerAlert(req) {
  // Banner
  const banner = document.getElementById('ambAlertBanner');
  const text = document.getElementById('ambAlertText');
  text.textContent = `🚨 NEW REQUEST — ${req.patientName} | ${req.phone} | ${req.location}`;
  banner.style.display = 'flex';

  // Red overlay flash
  const overlay = document.getElementById('ambAlertOverlay');
  overlay.style.display = 'block';

  // Sound — use Web Audio API beep
  playAlertSound(5000);

  // Auto dismiss after 5s
  if (alertTimer) clearTimeout(alertTimer);
  alertTimer = setTimeout(dismissAlert, 5000);

  // Toast
  if (typeof showToast === 'function') {
    showToast('🚑 Ambulance Request', `${req.patientName} — ${req.location}`, 'error');
  }
}

function dismissAlert() {
  document.getElementById('ambAlertBanner').style.display = 'none';
  document.getElementById('ambAlertOverlay').style.display = 'none';
  if (alertSound) { try { alertSound.stop(); } catch {} alertSound = null; }
  if (alertTimer) { clearTimeout(alertTimer); alertTimer = null; }
}

function playAlertSound(durationMs) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const endTime = ctx.currentTime + durationMs / 1000;

    function beep(start, freq, dur) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.35, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.start(start); osc.stop(start + dur);
    }

    // Repeating siren pattern for 5 seconds
    for (let t = ctx.currentTime; t < endTime; t += 0.6) {
      beep(t, 880, 0.25);
      beep(t + 0.3, 660, 0.25);
    }

    // Store ctx so we can stop it
    alertSound = { stop: () => ctx.close() };
  } catch (e) {
    console.warn('Audio not available:', e);
  }
}

// ---- Render ----
function renderAll() {
  updateStats();
  const container = document.getElementById('ambRequestsList');
  if (!requests.length) {
    container.innerHTML = '<p style="text-align:center;color:#64748b;padding:3rem;"><i class="fas fa-truck-medical" style="font-size:2rem;opacity:0.3;display:block;margin-bottom:0.5rem;"></i>No ambulance requests yet.</p>';
    return;
  }
  container.innerHTML = requests.map(r => renderCard(r)).join('');
}

function updateStats() {
  document.getElementById('statTotal').textContent = requests.length;
  document.getElementById('statPending').textContent = requests.filter(r => r.status === 'pending').length;
  document.getElementById('statDispatched').textContent = requests.filter(r => r.status === 'dispatched').length;
  document.getElementById('statCompleted').textContent = requests.filter(r => r.status === 'completed').length;
}

function renderCard(r) {
  const time = new Date(r.requestedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const date = new Date(r.requestedAt).toLocaleDateString('en-IN');
  const isNew = r.status === 'pending';

  const statusMap = {
    pending:    { label: 'Pending',    cls: 'status-pending',    icon: 'fa-clock' },
    dispatched: { label: 'Dispatched', cls: 'status-dispatched', icon: 'fa-truck-medical' },
    arrived:    { label: 'Arrived',    cls: 'status-arrived',    icon: 'fa-check' },
    completed:  { label: 'Completed',  cls: 'status-completed',  icon: 'fa-check-double' },
  };
  const s = statusMap[r.status] || statusMap.pending;

  const hasCoords = r.lat && r.lon;

  return `
    <div class="amb-card ${isNew ? 'new-alert' : ''}" id="card_${r._id}">
      <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; flex-wrap:wrap;">
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="width:48px;height:48px;background:linear-gradient(135deg,#dc2626,#b91c1c);border-radius:12px;display:flex;align-items:center;justify-content:center;color:white;font-size:1.3rem;flex-shrink:0;">
            <i class="fas fa-truck-medical"></i>
          </div>
          <div>
            <div style="font-weight:800;font-size:1rem;color:#0f172a;">${r.patientName}
              ${isNew ? '<span style="background:#dc2626;color:white;font-size:0.68rem;font-weight:800;padding:2px 8px;border-radius:999px;margin-left:6px;">NEW</span>' : ''}
            </div>
            <div style="font-size:0.82rem;color:#64748b;margin-top:2px;">
              <i class="fas fa-phone" style="color:#0891b2;"></i> ${r.phone}
              &nbsp;•&nbsp; ${date} ${time}
            </div>
          </div>
        </div>
        <span class="amb-status-badge ${s.cls}"><i class="fas ${s.icon}"></i> ${s.label}</span>
      </div>

      <div style="margin-top:0.9rem; display:grid; grid-template-columns:1fr 1fr; gap:0.6rem;">
        <div style="background:#fef2f2;border-radius:10px;padding:0.6rem 0.9rem;">
          <div style="font-size:0.72rem;font-weight:700;color:#dc2626;margin-bottom:2px;"><i class="fas fa-notes-medical"></i> CONDITION</div>
          <div style="font-size:0.88rem;color:#1e293b;">${r.condition}</div>
        </div>
        <div style="background:#f0f9ff;border-radius:10px;padding:0.6rem 0.9rem;">
          <div style="font-size:0.72rem;font-weight:700;color:#0891b2;margin-bottom:2px;"><i class="fas fa-map-marker-alt"></i> LOCATION</div>
          <div style="font-size:0.85rem;color:#1e293b;word-break:break-word;">${r.location}</div>
        </div>
      </div>

      <div style="margin-top:0.9rem;display:flex;gap:0.6rem;flex-wrap:wrap;align-items:center;">
        ${hasCoords ? `
          <button class="btn-primary btn-sm" onclick="openMap('${r._id}')">
            <i class="fas fa-map-marked-alt"></i> Live Track
          </button>` : `
          <button class="btn-outline btn-sm" onclick="searchLocation('${encodeURIComponent(r.location)}')">
            <i class="fas fa-search-location"></i> Search Location
          </button>`
        }
        ${r.status === 'pending' ? `
          <button class="btn-secondary btn-sm" onclick="updateStatus('${r._id}','dispatched')">
            <i class="fas fa-truck-medical"></i> Mark Dispatched
          </button>` : ''}
        ${r.status === 'dispatched' ? `
          <button class="btn-secondary btn-sm" onclick="updateStatus('${r._id}','arrived')">
            <i class="fas fa-check"></i> Mark Arrived
          </button>` : ''}
        ${r.status === 'arrived' ? `
          <button class="btn-outline btn-sm" onclick="updateStatus('${r._id}','completed')">
            <i class="fas fa-check-double"></i> Complete
          </button>` : ''}
      </div>
    </div>
  `;
}

// ---- Map Modal ----
function openMap(id) {
  const r = requests.find(x => x._id === id);
  if (!r) return;

  document.getElementById('mapModalName').textContent = r.patientName;
  document.getElementById('mapModalAddr').textContent = r.location;

  const lat = r.lat, lon = r.lon;
  const frame = document.getElementById('mapFrame');

  // OpenStreetMap embed with marker
  frame.src = `https://www.openstreetmap.org/export/embed.html?bbox=${lon-0.015},${lat-0.015},${lon+0.015},${lat+0.015}&layer=mapnik&marker=${lat},${lon}`;

  // External links
  document.getElementById('googleMapsLink').href = `https://www.google.com/maps?q=${lat},${lon}`;
  document.getElementById('wazeLink').href = `https://waze.com/ul?ll=${lat},${lon}&navigate=yes`;

  document.getElementById('mapModal').classList.add('open');
}

function searchLocation(encodedAddr) {
  window.open(`https://www.google.com/maps/search/${encodedAddr}`, '_blank');
}

function closeMapModal() {
  document.getElementById('mapModal').classList.remove('open');
  document.getElementById('mapFrame').src = '';
}

// Close map on backdrop click
document.getElementById('mapModal').addEventListener('click', function(e) {
  if (e.target === this) closeMapModal();
});

// ---- Status Update ----
async function updateStatus(id, status) {
  try {
    await fetch(API_BASE + `/api/ambulance/requests/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    // SSE will update UI automatically
  } catch (err) {
    if (typeof showToast === 'function') showToast('Error', 'Failed to update status', 'error');
  }
}
