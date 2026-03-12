const express = require('express');
const router = express.Router();

// In-memory store fallback
let memoryDoctors = [];
let useMemory = false;

const setMemoryMode = (val) => { useMemory = val; };
const getMemoryDoctors = () => memoryDoctors;

// POST /api/doctors - Add new doctor
router.post('/', async (req, res) => {
  try {
    const { name, department, specialization, phone, email, availableSlots, schedule, averageConsultationTime, maxPatientsPerDay } = req.body;

    if (!name || !department) {
      return res.status(400).json({ error: 'Name and department are required' });
    }

    const doctorData = {
      name,
      department,
      specialization: specialization || department,
      phone: phone || '',
      email: email || '',
      availableSlots: availableSlots || generateDefaultSlots(),
      schedule: schedule || { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false },
      averageConsultationTime: averageConsultationTime || 10,
      isAvailable: true,
      maxPatientsPerDay: maxPatientsPerDay || 30,
      createdAt: new Date()
    };

    if (useMemory) {
      doctorData._id = 'doc_' + Date.now() + Math.random().toString(36).substr(2, 5);
      memoryDoctors.push(doctorData);
      res.status(201).json(doctorData);
    } else {
      const Doctor = require('../models/Doctor');
      const newDoctor = new Doctor(doctorData);
      await newDoctor.save();
      res.status(201).json(newDoctor);
    }
  } catch (error) {
    console.error('Error creating doctor:', error);
    res.status(500).json({ error: 'Failed to create doctor' });
  }
});

// GET /api/doctors - Get all doctors
router.get('/', async (req, res) => {
  try {
    const { department, available } = req.query;
    let doctors;

    if (useMemory) {
      doctors = [...memoryDoctors];
      if (department) doctors = doctors.filter(d => d.department === department);
      if (available === 'true') doctors = doctors.filter(d => d.isAvailable);
    } else {
      const Doctor = require('../models/Doctor');
      const filter = {};
      if (department) filter.department = department;
      if (available === 'true') filter.isAvailable = true;
      doctors = await Doctor.find(filter).sort({ department: 1, name: 1 });
    }

    res.json(doctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});

// GET /api/doctors/:id - Get single doctor
router.get('/:id', async (req, res) => {
  try {
    let doctor;
    if (useMemory) {
      doctor = memoryDoctors.find(d => d._id === req.params.id);
    } else {
      const Doctor = require('../models/Doctor');
      doctor = await Doctor.findById(req.params.id);
    }
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch doctor' });
  }
});

// PUT /api/doctors/:id - Update doctor
router.put('/:id', async (req, res) => {
  try {
    const updates = req.body;

    if (useMemory) {
      const idx = memoryDoctors.findIndex(d => d._id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Doctor not found' });
      memoryDoctors[idx] = { ...memoryDoctors[idx], ...updates };
      res.json(memoryDoctors[idx]);
    } else {
      const Doctor = require('../models/Doctor');
      const doctor = await Doctor.findByIdAndUpdate(req.params.id, updates, { new: true });
      if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
      res.json(doctor);
    }
  } catch (error) {
    console.error('Error updating doctor:', error);
    res.status(500).json({ error: 'Failed to update doctor' });
  }
});

// DELETE /api/doctors/:id - Delete doctor
router.delete('/:id', async (req, res) => {
  try {
    if (useMemory) {
      const idx = memoryDoctors.findIndex(d => d._id === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Doctor not found' });
      memoryDoctors.splice(idx, 1);
      res.json({ message: 'Doctor deleted' });
    } else {
      const Doctor = require('../models/Doctor');
      const doctor = await Doctor.findByIdAndDelete(req.params.id);
      if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
      res.json({ message: 'Doctor deleted' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete doctor' });
  }
});

function generateDefaultSlots() {
  const slots = [];
  for (let h = 9; h <= 16; h++) {
    slots.push(`${h.toString().padStart(2, '0')}:00`);
    slots.push(`${h.toString().padStart(2, '0')}:30`);
  }
  return slots;
}

module.exports = router;
module.exports.setMemoryMode = setMemoryMode;
module.exports.getMemoryDoctors = getMemoryDoctors;
module.exports.seedDoctors = (data) => { memoryDoctors = data; };
