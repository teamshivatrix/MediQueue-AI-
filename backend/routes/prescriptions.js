const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { upload } = require('../config/cloudinary');

function getPrescriptionModel() {
  // Always get fresh model, never use cache
  const medicineSchema = new mongoose.Schema({ name: String, dosage: String, duration: String, instructions: String }, { _id: false });
  const attachmentSchema = new mongoose.Schema({ url: String, publicId: String, name: String, type: String }, { _id: false });
  const schema = new mongoose.Schema({
    appointmentId: String,
    patientName: { type: String, required: true },
    patientPhone: { type: String, required: true },
    patientId: String,
    doctorName: { type: String, required: true },
    department: String,
    visitDate: { type: String, required: true },
    diagnosis: { type: String, required: true },
    medicines: [medicineSchema],
    instructions: { type: String, default: '' },
    nextVisitDate: { type: String, default: '' },
    attachments: { type: [attachmentSchema], default: [] },
    createdAt: { type: Date, default: Date.now }
  });

  try {
    mongoose.deleteModel('Prescription');
  } catch (_) {}

  return mongoose.model('Prescription', schema);
}

// POST /api/prescriptions — create prescription (with optional file)
router.post('/', upload.array('attachments', 5), async (req, res) => {
  try {
    const { appointmentId, patientName, patientPhone, patientId, doctorName, department, visitDate, diagnosis, medicines, instructions, nextVisitDate } = req.body;

    if (!patientName || !patientPhone || !doctorName || !visitDate || !diagnosis) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const attachments = (req.files || []).map(f => ({
      url: String(f.path || f.secure_url || ''),
      publicId: String(f.filename || f.public_id || ''),
      name: String(f.originalname || ''),
      type: String(f.mimetype || '')
    }));

    let parsedMedicines = [];
    try { parsedMedicines = JSON.parse(medicines || '[]'); } catch (_) {}

    // Use MongoDB native driver to avoid any Mongoose schema cache issues
    const db = mongoose.connection.db;
    const doc = {
      appointmentId: appointmentId || '',
      patientName,
      patientPhone: String(patientPhone).replace(/\D/g, ''),
      patientId: patientId || '',
      doctorName,
      department: department || '',
      visitDate,
      diagnosis,
      medicines: parsedMedicines,
      instructions: instructions || '',
      nextVisitDate: nextVisitDate || '',
      attachments,
      createdAt: new Date()
    };

    const result = await db.collection('prescriptions').insertOne(doc);
    res.json({ success: true, prescription: { ...doc, _id: result.insertedId } });
  } catch (err) {
    console.error('Prescription create error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/prescriptions?phone=XXXX — get patient prescriptions
router.get('/', async (req, res) => {
  try {
    const { phone, patientId } = req.query;
    const query = {};
    if (phone) query.patientPhone = String(phone).replace(/\D/g, '');
    if (patientId) query.patientId = patientId;
    if (!phone && !patientId) return res.status(400).json({ error: 'phone or patientId required' });

    const db = mongoose.connection.db;
    const prescriptions = await db.collection('prescriptions').find(query).sort({ createdAt: -1 }).toArray();
    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/prescriptions/:id — single prescription
router.get('/:id', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { ObjectId } = mongoose.Types;
    const p = await db.collection('prescriptions').findOne({ _id: new ObjectId(req.params.id) });
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json(p);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/prescriptions/:id
router.delete('/:id', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { ObjectId } = mongoose.Types;
    await db.collection('prescriptions').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
