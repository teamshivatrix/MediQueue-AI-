const express = require('express');

const router = express.Router();

let useMemory = false;
let alertCounter = 0;
const emergencyAlerts = [];
const EMERGENCY_DOCTOR_NAMES = [
  'Dr. Priya Patel',
  'Dr. Rajesh Sharma',
  'Dr. Amit Gupta',
  'Dr. Sunita Singh'
];

const setMemoryMode = (val) => { useMemory = val; };

const normalizePhone = (phone) => String(phone || '').replace(/\D/g, '');

function generateAppointmentId() {
  const prefix = 'EM';
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${date}${rand}`;
}

function generateNextSlot() {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();

  let slotHour = Math.max(9, Math.min(18, hour));
  let slotMinute = minute <= 30 ? 30 : 0;

  if (slotMinute === 0) slotHour += 1;
  if (slotHour > 18) slotHour = 18;

  return `${String(slotHour).padStart(2, '0')}:${String(slotMinute).padStart(2, '0')}`;
}

function pushEmergencyAlert(payload) {
  alertCounter += 1;
  const alert = {
    id: `e_alert_${alertCounter}`,
    createdAtMs: Date.now(),
    ...payload
  };

  emergencyAlerts.push(alert);
  while (emergencyAlerts.length > 100) emergencyAlerts.shift();
  return alert;
}

router.post('/book', async (req, res) => {
  try {
    const { patientName, age, phone, symptoms } = req.body;
    const cleanPhone = normalizePhone(phone);

    if (!patientName || !age || !cleanPhone || !symptoms) {
      return res.status(400).json({ success: false, message: 'Patient name, age, phone, and symptoms are required' });
    }

    if (cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, message: 'Phone must be 10 digits' });
    }

    const today = new Date().toISOString().split('T')[0];

    let selectedDoctor = null;
    let tokenNumber = 101;
    let patientsAhead = 0;

    if (useMemory) {
      const doctorRoutes = require('./doctors');
      const appointmentsRoutes = require('./appointments');

      const doctors = doctorRoutes.getMemoryDoctors();
      let emergencyDoctors = doctors.filter((d) => EMERGENCY_DOCTOR_NAMES.includes(d.name));
      if (emergencyDoctors.length < 4) {
        const fallbacks = doctors.filter((d) => !emergencyDoctors.some((e) => e._id === d._id)).slice(0, 4 - emergencyDoctors.length);
        emergencyDoctors = emergencyDoctors.concat(fallbacks);
      }
      selectedDoctor = emergencyDoctors[Math.floor(Math.random() * emergencyDoctors.length)] || null;
      if (!selectedDoctor) {
        return res.status(400).json({ success: false, message: 'No doctors available for emergency booking' });
      }

      const allAppointments = appointmentsRoutes.getMemoryAppointments();
      tokenNumber = Math.max(100, ...allAppointments.map((a) => Number(a.tokenNumber) || 0)) + 1;
      patientsAhead = allAppointments.filter((a) => a.date === today && a.doctorId === selectedDoctor._id && a.status === 'waiting').length;

      const emergencyAppointment = {
        _id: 'apt_' + Date.now() + Math.random().toString(36).slice(2, 7),
        appointmentId: generateAppointmentId(),
        tokenNumber,
        patientName: String(patientName).trim(),
        age: parseInt(age, 10),
        phone: cleanPhone,
        symptoms: String(symptoms).trim(),
        department: selectedDoctor.department,
        doctorId: selectedDoctor._id,
        doctorName: selectedDoctor.name,
        date: today,
        timeSlot: generateNextSlot(),
        status: 'waiting',
        priority: 'emergency',
        estimatedWaitTime: Math.max(0, patientsAhead * (selectedDoctor.averageConsultationTime || 10)),
        createdAt: new Date()
      };

      allAppointments.push(emergencyAppointment);

      const alert = pushEmergencyAlert({
        message: 'Emergency appointment alert',
        patientName: emergencyAppointment.patientName,
        department: emergencyAppointment.department,
        appointmentId: emergencyAppointment.appointmentId,
        tokenNumber: emergencyAppointment.tokenNumber
      });

      return res.status(201).json({ success: true, appointment: emergencyAppointment, alert });
    }

    const Doctor = require('../models/Doctor');
    const Appointment = require('../models/Appointment');

    let emergencyDoctors = await Doctor.find({ name: { $in: EMERGENCY_DOCTOR_NAMES } }).sort({ createdAt: 1 }).limit(4);
    if (emergencyDoctors.length < 4) {
      const fallbackDoctors = await Doctor.find({ _id: { $nin: emergencyDoctors.map((d) => d._id) } }).sort({ createdAt: 1 }).limit(4 - emergencyDoctors.length);
      emergencyDoctors = emergencyDoctors.concat(fallbackDoctors);
    }
    selectedDoctor = emergencyDoctors[Math.floor(Math.random() * emergencyDoctors.length)] || null;

    if (!selectedDoctor) {
      return res.status(400).json({ success: false, message: 'No doctors available for emergency booking' });
    }

    const lastAppointment = await Appointment.findOne({}).sort({ tokenNumber: -1 });
    tokenNumber = (lastAppointment?.tokenNumber || 100) + 1;

    patientsAhead = await Appointment.countDocuments({
      doctorId: String(selectedDoctor._id),
      date: today,
      status: 'waiting'
    });

    const emergencyAppointment = new Appointment({
      appointmentId: generateAppointmentId(),
      tokenNumber,
      patientName: String(patientName).trim(),
      age: parseInt(age, 10),
      phone: cleanPhone,
      symptoms: String(symptoms).trim(),
      department: selectedDoctor.department,
      doctorId: String(selectedDoctor._id),
      doctorName: selectedDoctor.name,
      date: today,
      timeSlot: generateNextSlot(),
      status: 'waiting',
      priority: 'emergency',
      estimatedWaitTime: Math.max(0, patientsAhead * (selectedDoctor.averageConsultationTime || 10))
    });

    await emergencyAppointment.save();

    const alert = pushEmergencyAlert({
      message: 'Emergency appointment alert',
      patientName: emergencyAppointment.patientName,
      department: emergencyAppointment.department,
      appointmentId: emergencyAppointment.appointmentId,
      tokenNumber: emergencyAppointment.tokenNumber
    });

    return res.status(201).json({ success: true, appointment: emergencyAppointment, alert });
  } catch (error) {
    console.error('Emergency booking error:', error);
    return res.status(500).json({ success: false, message: 'Failed to book emergency appointment' });
  }
});

router.get('/alerts', (req, res) => {
  const since = Number(req.query.since || 0);
  const newAlerts = emergencyAlerts.filter((a) => a.createdAtMs > since);
  const latestTimestamp = newAlerts.length > 0
    ? Math.max(...newAlerts.map((a) => a.createdAtMs))
    : since;

  return res.json({
    alerts: newAlerts,
    latestTimestamp
  });
});

module.exports = router;
module.exports.setMemoryMode = setMemoryMode;
