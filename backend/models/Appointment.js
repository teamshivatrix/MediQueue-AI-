const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  appointmentId: { type: String, unique: true },
  tokenNumber: { type: Number },
  patientName: { type: String, required: true },
  age: { type: Number, required: true },
  phone: { type: String, required: true },
  symptoms: { type: String, required: true },
  department: { type: String, required: true },
  doctorId: { type: String, required: true },
  doctorName: { type: String },
  date: { type: String, required: true },
  timeSlot: { type: String, required: true },
  status: {
    type: String,
    enum: ['waiting', 'in-progress', 'completed', 'cancelled'],
    default: 'waiting'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'emergency'],
    default: 'medium'
  },
  estimatedWaitTime: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Appointment', appointmentSchema);
