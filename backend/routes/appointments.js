const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// In-memory store fallback
let memoryAppointments = [];
let useMemory = false;

// SSE clients for real-time appointment notifications
const appointmentSSEClients = new Set();

function broadcastNewAppointment(appointment) {
  const data = JSON.stringify(appointment);
  appointmentSSEClients.forEach(client => {
    try { client.write(`event: new_appointment\ndata: ${data}\n\n`); } catch (_) {}
  });
}

// GET /api/appointments/events — SSE stream for admin notifications
router.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  res.write('event: connected\ndata: {}\n\n');
  appointmentSSEClients.add(res);
  req.on('close', () => appointmentSSEClients.delete(res));
});

const setMemoryMode = (val) => { useMemory = val; };

// Generate unique appointment ID
const generateAppointmentId = () => {
  const prefix = 'MQ';
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${date}${rand}`;
};

// POST /api/appointments - Create new appointment
router.post('/', async (req, res) => {
  try {
    const { patientName, age, phone, symptoms, department, doctorId, doctorName, date, timeSlot, priority } = req.body;

    if (!patientName || !age || !phone || !symptoms || !department || !doctorId || !date || !timeSlot) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    let nextTokenNumber = 101;
    if (useMemory) {
      nextTokenNumber = Math.max(100, ...memoryAppointments.map(a => Number(a.tokenNumber) || 0)) + 1;
    } else {
      const Appointment = require('../models/Appointment');
      const last = await Appointment.findOne({}).sort({ tokenNumber: -1 });
      nextTokenNumber = (last?.tokenNumber || 100) + 1;
    }

    const appointmentData = {
      appointmentId: generateAppointmentId(),
      tokenNumber: nextTokenNumber,
      patientName,
      age: parseInt(age),
      phone,
      symptoms,
      department,
      doctorId,
      doctorName: doctorName || 'Doctor',
      date,
      timeSlot,
      status: 'waiting',
      priority: priority || 'medium',
      estimatedWaitTime: 0,
      createdAt: new Date()
    };

    // Calculate estimated waiting time
    let patientsAhead = 0;
    let avgConsultTime = 10;

    if (useMemory) {
      patientsAhead = memoryAppointments.filter(
        a => a.doctorId === doctorId && a.date === date && a.status === 'waiting'
      ).length;

      // Get doctor's avg consultation time from memory doctors
      const doctors = require('./doctors');
      const doc = doctors.getMemoryDoctors().find(d => d._id === doctorId || d.name === doctorName);
      if (doc) avgConsultTime = doc.averageConsultationTime || 10;
    } else {
      const Appointment = require('../models/Appointment');
      const Doctor = require('../models/Doctor');

      const isObjectId = mongoose.Types.ObjectId.isValid(doctorId);
      let doc = null;

      if (isObjectId) {
        doc = await Doctor.findById(doctorId);
      }

      if (!doc && doctorName) {
        doc = await Doctor.findOne({ name: doctorName });
      }

      if (!doc && department) {
        doc = await Doctor.findOne({ department, isAvailable: true }).sort({ name: 1 });
      }

      if (doc) {
        appointmentData.doctorId = doc._id.toString();
        appointmentData.doctorName = doc.name;
        avgConsultTime = doc.averageConsultationTime || 10;
      }

      patientsAhead = await Appointment.countDocuments({
        doctorId: appointmentData.doctorId,
        date,
        status: 'waiting'
      });
    }

    appointmentData.estimatedWaitTime = patientsAhead * avgConsultTime;

    if (useMemory) {
      appointmentData._id = 'apt_' + Date.now() + Math.random().toString(36).substr(2, 5);
      memoryAppointments.push(appointmentData);
    } else {
      const Appointment = require('../models/Appointment');
      const newAppointment = new Appointment(appointmentData);
      await newAppointment.save();
      appointmentData._id = newAppointment._id;
    }

    // Broadcast to all admin SSE clients
    broadcastNewAppointment(appointmentData);

    res.status(201).json({
      message: 'Appointment booked successfully!',
      appointment: appointmentData
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// GET /api/appointments - Get all appointments
router.get('/', async (req, res) => {
  try {
    const { date, department, status, doctorId, priority, phone } = req.query;
    let appointments;

    if (useMemory) {
      appointments = [...memoryAppointments];
      if (date) appointments = appointments.filter(a => a.date === date);
      if (department) appointments = appointments.filter(a => a.department === department);
      if (status) appointments = appointments.filter(a => a.status === status);
      if (doctorId) appointments = appointments.filter(a => a.doctorId === doctorId);
      if (priority) appointments = appointments.filter(a => a.priority === priority);
      if (phone) appointments = appointments.filter(a => String(a.phone||'').replace(/\D/g,'') === String(phone).replace(/\D/g,''));
      appointments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      const Appointment = require('../models/Appointment');
      const filter = {};
      if (date) filter.date = date;
      if (department) filter.department = department;
      if (status) filter.status = status;
      if (doctorId) filter.doctorId = doctorId;
      if (priority) filter.priority = priority;
      if (phone) filter.phone = String(phone).replace(/\D/g,'');
      appointments = await Appointment.find(filter).sort({ createdAt: -1 });
    }

    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// PATCH /api/appointments/:id/status - Update appointment status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (useMemory) {
      const apt = memoryAppointments.find(a => a._id === id || a.appointmentId === id);
      if (!apt) return res.status(404).json({ error: 'Appointment not found' });
      apt.status = status;
      res.json(apt);
    } else {
      const Appointment = require('../models/Appointment');
      const apt = await Appointment.findOneAndUpdate(
        { $or: [{ _id: id }, { appointmentId: id }] },
        { status },
        { new: true }
      );
      if (!apt) return res.status(404).json({ error: 'Appointment not found' });
      res.json(apt);
    }
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// PATCH /api/appointments/:id/take-first - Mark as critical and move to queue front
router.patch('/:id/take-first', async (req, res) => {
  try {
    const { id } = req.params;
    const today = new Date().toISOString().split('T')[0];

    if (useMemory) {
      const apt = memoryAppointments.find(a => a._id === id || a.appointmentId === id);
      if (!apt) return res.status(404).json({ error: 'Appointment not found' });
      if (apt.status === 'completed') return res.status(400).json({ error: 'Completed appointment cannot be prioritized' });

      const sameDayWaiting = memoryAppointments
        .filter(a => a.date === apt.date && a.status === 'waiting' && a._id !== apt._id && a.appointmentId !== apt.appointmentId)
        .sort((a, b) => Number(a.tokenNumber || 0) - Number(b.tokenNumber || 0));

      const minWaitingToken = sameDayWaiting.length > 0 ? Number(sameDayWaiting[0].tokenNumber || 0) : Number(apt.tokenNumber || 101);

      apt.priority = 'emergency';
      apt.estimatedWaitTime = 0;
      if (apt.status === 'waiting') {
        apt.tokenNumber = Math.max(1, minWaitingToken - 1);
      }

      return res.json({
        message: 'Appointment moved to front as critical',
        appointment: apt
      });
    }

    const Appointment = require('../models/Appointment');
    const apt = await Appointment.findOne({ $or: [{ _id: id }, { appointmentId: id }] });
    if (!apt) return res.status(404).json({ error: 'Appointment not found' });
    if (apt.status === 'completed') return res.status(400).json({ error: 'Completed appointment cannot be prioritized' });

    const minWaiting = await Appointment.findOne({
      date: apt.date || today,
      status: 'waiting',
      _id: { $ne: apt._id }
    }).sort({ tokenNumber: 1 });

    const minWaitingToken = minWaiting ? Number(minWaiting.tokenNumber || 0) : Number(apt.tokenNumber || 101);

    apt.priority = 'emergency';
    apt.estimatedWaitTime = 0;
    if (apt.status === 'waiting') {
      apt.tokenNumber = Math.max(1, minWaitingToken - 1);
    }

    await apt.save();
    return res.json({
      message: 'Appointment moved to front as critical',
      appointment: apt
    });
  } catch (error) {
    console.error('Error prioritizing appointment:', error);
    res.status(500).json({ error: 'Failed to prioritize appointment' });
  }
});

// POST /api/appointments/predict-waiting-time
router.post('/predict-waiting-time', async (req, res) => {
  try {
    const { doctorId, date } = req.body;
    let patientsAhead = 0;
    let avgConsultTime = 10;

    if (useMemory) {
      patientsAhead = memoryAppointments.filter(
        a => a.doctorId === doctorId && a.date === date && a.status === 'waiting'
      ).length;
    } else {
      const Appointment = require('../models/Appointment');
      patientsAhead = await Appointment.countDocuments({
        doctorId, date, status: 'waiting'
      });
    }

    const waitingTime = patientsAhead * avgConsultTime;

    res.json({
      patientsAhead,
      averageConsultationTime: avgConsultTime,
      estimatedWaitTime: waitingTime,
      message: `Estimated waiting time: ${waitingTime} minutes (${patientsAhead} patients ahead)`
    });
  } catch (error) {
    console.error('Error predicting wait time:', error);
    res.status(500).json({ error: 'Failed to predict waiting time' });
  }
});

// GET /api/appointments/stats - Dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    let appointments;

    if (useMemory) {
      appointments = memoryAppointments.filter(a => a.date === today);
    } else {
      const Appointment = require('../models/Appointment');
      appointments = await Appointment.find({ date: today });
    }

    const totalToday = appointments.length;
    const waiting = appointments.filter(a => a.status === 'waiting').length;
    const inProgress = appointments.filter(a => a.status === 'in-progress').length;
    const completed = appointments.filter(a => a.status === 'completed').length;

    // Patients per department
    const deptCounts = {};
    appointments.forEach(a => {
      deptCounts[a.department] = (deptCounts[a.department] || 0) + 1;
    });

    // Appointments per hour
    const hourCounts = {};
    appointments.forEach(a => {
      const hour = a.timeSlot ? a.timeSlot.split(':')[0] : '09';
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    // Doctor workload
    const doctorCounts = {};
    appointments.forEach(a => {
      const name = a.doctorName || 'Unknown';
      doctorCounts[name] = (doctorCounts[name] || 0) + 1;
    });

    // Average wait time
    const avgWait = appointments.length > 0
      ? Math.round(appointments.reduce((sum, a) => sum + (a.estimatedWaitTime || 0), 0) / appointments.length)
      : 0;

    res.json({
      totalToday,
      waiting,
      inProgress,
      completed,
      avgWaitTime: avgWait,
      departmentStats: deptCounts,
      hourlyStats: hourCounts,
      doctorWorkload: doctorCounts
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/appointments/queue - Queue display data
router.get('/queue', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    let appointments;

    if (useMemory) {
      appointments = memoryAppointments
        .filter(a => a.date === today)
        .sort((a, b) => a.tokenNumber - b.tokenNumber);
    } else {
      const Appointment = require('../models/Appointment');
      appointments = await Appointment.find({ date: today }).sort({ tokenNumber: 1 });
    }

    const currentServing = appointments.find(a => a.status === 'in-progress');
    const waitingQueue = appointments.filter(a => a.status === 'waiting');
    const completedCount = appointments.filter(a => a.status === 'completed').length;

    res.json({
      currentServing: currentServing || null,
      nextInQueue: waitingQueue[0] || null,
      waitingQueue: waitingQueue.slice(0, 10),
      totalWaiting: waitingQueue.length,
      totalCompleted: completedCount,
      totalToday: appointments.length
    });
  } catch (error) {
    console.error('Error fetching queue:', error);
    res.status(500).json({ error: 'Failed to fetch queue data' });
  }
});

module.exports = router;
module.exports.setMemoryMode = setMemoryMode;
module.exports.getMemoryAppointments = () => memoryAppointments;
module.exports.seedAppointments = (data) => { memoryAppointments = data; };
