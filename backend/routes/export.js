const express = require('express');
const router = express.Router();

// GET /api/export/appointments?date=YYYY-MM-DD&format=csv
router.get('/appointments', async (req, res) => {
  try {
    const { date, format } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    let appointments = [];
    const useMemory = require('./appointments').getMemoryAppointments;

    try {
      const Appointment = require('../models/Appointment');
      appointments = await Appointment.find({ date: targetDate }).sort({ tokenNumber: 1 });
    } catch (_) {
      appointments = useMemory().filter(a => a.date === targetDate);
    }

    if (format === 'csv') {
      const headers = ['Token', 'Patient Name', 'Age', 'Phone', 'Department', 'Doctor', 'Time Slot', 'Status', 'Priority', 'Wait Time (min)', 'Symptoms'];
      const rows = appointments.map(a => [
        a.tokenNumber,
        `"${(a.patientName || '').replace(/"/g, '""')}"`,
        a.age || '',
        a.phone || '',
        `"${a.department || ''}"`,
        `"${a.doctorName || ''}"`,
        a.timeSlot || '',
        a.status || '',
        a.priority || '',
        a.estimatedWaitTime || 0,
        `"${(a.symptoms || '').replace(/"/g, '""').substring(0, 100)}"`
      ]);

      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="appointments_${targetDate}.csv"`);
      return res.send(csv);
    }

    // JSON summary
    const total = appointments.length;
    const completed = appointments.filter(a => a.status === 'completed').length;
    const waiting = appointments.filter(a => a.status === 'waiting').length;
    const inProgress = appointments.filter(a => a.status === 'in-progress').length;
    const cancelled = appointments.filter(a => a.status === 'cancelled').length;
    const emergency = appointments.filter(a => a.priority === 'emergency').length;

    const deptBreakdown = {};
    appointments.forEach(a => {
      deptBreakdown[a.department] = (deptBreakdown[a.department] || 0) + 1;
    });

    const doctorBreakdown = {};
    appointments.forEach(a => {
      doctorBreakdown[a.doctorName] = (doctorBreakdown[a.doctorName] || 0) + 1;
    });

    res.json({
      date: targetDate,
      summary: { total, completed, waiting, inProgress, cancelled, emergency },
      deptBreakdown,
      doctorBreakdown,
      appointments
    });
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Export failed' });
  }
});

module.exports = router;
