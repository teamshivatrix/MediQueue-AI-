const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  appointmentId: { type: String, required: true },
  patientName:   { type: String },
  phone:         { type: String },
  doctorId:      { type: String },
  doctorName:    { type: String },
  department:    { type: String },
  rating:        { type: Number, required: true, min: 1, max: 5 },
  comment:       { type: String, default: '' },
  createdAt:     { type: Date, default: Date.now }
});

module.exports = mongoose.models.Feedback || mongoose.model('Feedback', feedbackSchema);
