const express = require('express');
const router = express.Router();

let ambulanceRequests = [];
let sseClients = []; // Admin SSE connections

// SSE helper - push event to all connected admins
function pushToAdmins(eventName, data) {
  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients = sseClients.filter(client => {
    try { client.write(payload); return true; }
    catch { return false; }
  });
}

// GET /api/ambulance/events  — SSE stream for admin
router.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  // Send current requests on connect
  res.write(`event: init\ndata: ${JSON.stringify(ambulanceRequests.slice().reverse())}\n\n`);

  sseClients.push(res);
  req.on('close', () => {
    sseClients = sseClients.filter(c => c !== res);
  });
});

// POST /api/ambulance/request
router.post('/request', (req, res) => {
  const { patientName, phone, condition, location, lat, lon, requestedAt } = req.body;

  if (!patientName || !phone || !condition || !location) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const request = {
    _id: 'amb_' + Date.now(),
    patientName,
    phone,
    condition,
    location,
    lat: lat ? parseFloat(lat) : null,
    lon: lon ? parseFloat(lon) : null,
    status: 'pending',
    requestedAt: requestedAt || new Date().toISOString(),
    createdAt: new Date()
  };

  ambulanceRequests.unshift(request);
  console.log(`🚑 Ambulance request: ${patientName} @ ${location}`);

  // Push real-time to all admin SSE clients
  pushToAdmins('new_request', request);

  res.json({ success: true, message: 'Ambulance dispatched', requestId: request._id });
});

// GET /api/ambulance/requests
router.get('/requests', (req, res) => {
  res.json(ambulanceRequests);
});

// PATCH /api/ambulance/requests/:id/status
router.patch('/requests/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const item = ambulanceRequests.find(r => r._id === id);
  if (!item) return res.status(404).json({ success: false, message: 'Not found' });
  item.status = status;
  pushToAdmins('status_update', { _id: id, status });
  res.json({ success: true });
});

module.exports = router;
