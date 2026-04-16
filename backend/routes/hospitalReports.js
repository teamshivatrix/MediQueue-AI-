const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { upload } = require('../config/cloudinary');

// POST /api/hospital-reports — create/upload report
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { patientName, patientPhone, patientId, serviceType, reportType, status, notes, price, uploadedBy, date } = req.body;

    if (!patientName || !patientPhone || !serviceType || !reportType) {
      return res.status(400).json({ error: 'patientName, patientPhone, serviceType and reportType are required' });
    }

    const doc = {
      patientName,
      patientPhone: String(patientPhone).replace(/\D/g, ''),
      patientId: patientId || '',
      serviceType,
      reportType,
      status: status || 'pending',
      fileUrl: req.file ? (req.file.path || req.file.secure_url || '') : '',
      filePublicId: req.file ? (req.file.filename || req.file.public_id || '') : '',
      fileName: req.file ? req.file.originalname : '',
      notes: notes || '',
      price: parseFloat(price) || 0,
      uploadedBy: uploadedBy || 'Admin',
      date: date || new Date().toISOString().split('T')[0],
      createdAt: new Date()
    };

    const db = mongoose.connection.db;
    const result = await db.collection('hospitalreports').insertOne(doc);
    res.json({ success: true, report: { ...doc, _id: result.insertedId } });
  } catch (err) {
    console.error('Hospital report upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/hospital-reports?phone=XXXX&serviceType=Diagnostic
router.get('/', async (req, res) => {
  try {
    const { phone, patientId, serviceType, status } = req.query;
    const query = {};
    if (phone) query.patientPhone = String(phone).replace(/\D/g, '');
    if (patientId) query.patientId = patientId;
    if (serviceType) query.serviceType = serviceType;
    if (status) query.status = status;
    if (!phone && !patientId) return res.status(400).json({ error: 'phone or patientId required' });

    const db = mongoose.connection.db;
    const reports = await db.collection('hospitalreports').find(query).sort({ createdAt: -1 }).toArray();
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/hospital-reports/:id — update full report
router.patch('/:id', upload.single('file'), async (req, res) => {
  try {
    const { reportType, status, notes, price, date } = req.body;
    const db = mongoose.connection.db;
    const { ObjectId } = mongoose.Types;
    const updates = {};
    if (reportType) updates.reportType = reportType;
    if (status) updates.status = status;
    if (notes !== undefined) updates.notes = notes;
    if (price !== undefined) updates.price = parseFloat(price) || 0;
    if (date) updates.date = date;
    if (req.file) {
      updates.fileUrl = req.file.path || req.file.secure_url || '';
      updates.filePublicId = req.file.filename || req.file.public_id || '';
      updates.fileName = req.file.originalname || '';
    }
    await db.collection('hospitalreports').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updates }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/hospital-reports/:id/status — update status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'sample_collected', 'processing', 'ready'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const db = mongoose.connection.db;
    const { ObjectId } = mongoose.Types;
    await db.collection('hospitalreports').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/hospital-reports/:id
router.delete('/:id', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { ObjectId } = mongoose.Types;
    await db.collection('hospitalreports').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
