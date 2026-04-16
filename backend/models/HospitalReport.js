const mongoose = require('mongoose');

const hospitalReportSchema = new mongoose.Schema({
  patientName:  { type: String, required: true },
  patientPhone: { type: String, required: true },
  patientId:    { type: String, default: '' },
  serviceType:  { type: String, required: true, enum: ['Diagnostic', 'Laboratory', 'Ward'] },
  reportType:   { type: String, required: true },
  status:       { type: String, enum: ['pending', 'sample_collected', 'processing', 'ready'], default: 'pending' },
  fileUrl:      { type: String, default: '' },
  filePublicId: { type: String, default: '' },
  fileName:     { type: String, default: '' },
  notes:        { type: String, default: '' },
  price:        { type: Number, default: 0 },
  uploadedBy:   { type: String, default: 'Admin' },
  date:         { type: String, required: true },
  createdAt:    { type: Date, default: Date.now }
});

module.exports = mongoose.model('HospitalReport', hospitalReportSchema);
