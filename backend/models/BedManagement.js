const mongoose = require('mongoose');

const bedManagementSchema = new mongoose.Schema({
  department: { type: String, required: true, unique: true },
  wardType: { type: String, required: true }, // General Ward, ICU, NICU, etc.
  totalBeds: { type: Number, required: true, default: 0 },
  occupiedBeds: { type: Number, default: 0 },
  availableBeds: { type: Number, default: 0 },
  pricePerDay: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BedManagement', bedManagementSchema);
