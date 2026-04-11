const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: String,
  dosage: String,
  duration: String,
  instructions: String
}, { _id: false });

const attachmentSchema = new mongoose.Schema({
  url: { type: String, default: '' },
  publicId: { type: String, default: '' },
  name: { type: String, default: '' },
  type: { type: String, default: '' }
}, { _id: false });

const prescriptionSchema = new mongoose.Schema({
  appointmentId: { type: String },
  patientName: { type: String, required: true },
  patientPhone: { type: String, required: true },
  patientId: { type: String },
  doctorName: { type: String, required: true },
  department: { type: String },
  visitDate: { type: String, required: true },
  diagnosis: { type: String, required: true },
  medicines: [medicineSchema],
  instructions: { type: String, default: '' },
  nextVisitDate: { type: String, default: '' },
  attachments: { type: [attachmentSchema], default: [] },
  createdAt: { type: Date, default: Date.now }
});

// Clear cached model to avoid OverwriteModelError on hot reload
if (mongoose.models.Prescription) delete mongoose.models.Prescription;

module.exports = mongoose.model('Prescription', prescriptionSchema);
