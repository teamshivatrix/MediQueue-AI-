const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  passwordHash: { type: String, required: true },
  passwordSalt: { type: String, required: true },

  // Profile fields
  dateOfBirth: { type: String, default: '' },
  gender: { type: String, enum: ['male', 'female', 'other', ''], default: '' },
  bloodGroup: { type: String, default: '' },
  address: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  pincode: { type: String, default: '' },
  emergencyContactName: { type: String, default: '' },
  emergencyContactPhone: { type: String, default: '' },
  emergencyContactRelation: { type: String, default: '' },
  allergies: { type: String, default: '' },
  chronicConditions: { type: String, default: '' },
  currentMedications: { type: String, default: '' },
  profileComplete: { type: Boolean, default: false },

  preferredLanguage: { type: String, default: 'en', trim: true },
  easyMode: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Patient', patientSchema);
