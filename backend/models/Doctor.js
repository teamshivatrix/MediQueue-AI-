const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  department: { type: String, required: true },
  specialization: { type: String },
  phone: { type: String },
  email: { type: String },
  availableSlots: [{ type: String }],
  schedule: {
    monday: { type: Boolean, default: true },
    tuesday: { type: Boolean, default: true },
    wednesday: { type: Boolean, default: true },
    thursday: { type: Boolean, default: true },
    friday: { type: Boolean, default: true },
    saturday: { type: Boolean, default: false },
    sunday: { type: Boolean, default: false }
  },
  averageConsultationTime: { type: Number, default: 10 },
  isAvailable: { type: Boolean, default: true },
  maxPatientsPerDay: { type: Number, default: 30 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Doctor', doctorSchema);
