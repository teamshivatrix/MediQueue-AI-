const mongoose = require('mongoose');

const labReportSchema = new mongoose.Schema({
  patientName: { type: String, required: true },
  patientPhone: { type: String, required: true },
  patientId: { type: String },
  reportType: { type: String, required: true }, // Blood Test, X-Ray, MRI, etc.
  uploadedBy: { type: String, default: 'Admin' },
  notes: { type: String, default: '' },
  fileUrl: { type: String, required: true },
  filePublicId: { type: String },
  fileName: { type: String },
  date: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LabReport', labReportSchema);
