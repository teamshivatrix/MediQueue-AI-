const express = require('express');
const router = express.Router();
const LabReport = require('../models/LabReport');
const { upload } = require('../config/cloudinary');

// POST /api/lab-reports — upload lab report
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { patientName, patientPhone, patientId, reportType, uploadedBy, notes, date } = req.body;

    if (!patientName || !patientPhone || !reportType || !req.file) {
      return res.status(400).json({ error: 'patientName, patientPhone, reportType and file are required' });
    }

    const report = await LabReport.create({
      patientName,
      patientPhone: String(patientPhone).replace(/\D/g, ''),
      patientId,
      reportType,
      uploadedBy: uploadedBy || 'Admin',
      notes: notes || '',
      fileUrl: req.file.path,
      filePublicId: req.file.filename,
      fileName: req.file.originalname,
      date: date || new Date().toISOString().split('T')[0]
    });

    res.json({ success: true, report });
  } catch (err) {
    console.error('Lab report upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/lab-reports?phone=XXXX
router.get('/', async (req, res) => {
  try {
    const { phone, patientId } = req.query;
    const query = {};
    if (phone) query.patientPhone = String(phone).replace(/\D/g, '');
    if (patientId) query.patientId = patientId;
    if (!phone && !patientId) return res.status(400).json({ error: 'phone or patientId required' });

    const reports = await LabReport.find(query).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/lab-reports/:id
router.delete('/:id', async (req, res) => {
  try {
    await LabReport.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
