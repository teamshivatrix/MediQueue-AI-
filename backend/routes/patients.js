const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { sendOtpToPhone } = require('../services/sms');

const router = express.Router();

let useMemory = false;
let memoryPatients = [];
const patientSessions = new Map(); // fallback for memory mode
const otpResetStore = new Map();
const resetTokenStore = new Map();

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const OTP_COOLDOWN_MS = 30 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const RESET_TOKEN_EXPIRY_MS = 10 * 60 * 1000;

const setMemoryMode = (val) => { useMemory = val; };

const normalizePhone = (phone) => String(phone || '').replace(/\D/g, '');
const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

function createPasswordRecord(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPassword(password, salt);
  return { salt, hash };
}

// ---- MongoDB-backed sessions ----
async function saveSessionToDB(token, session) {
  try {
    const db = mongoose.connection.db;
    if (!db) return;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.collection('patient_sessions').replaceOne(
      { token },
      { token, ...session, expiresAt },
      { upsert: true }
    );
    // Create TTL index if not exists (runs once, ignored if exists)
    db.collection('patient_sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }).catch(() => {});
  } catch (_) {}
}

async function getSessionFromDB(token) {
  try {
    const db = mongoose.connection.db;
    if (!db) return null;
    const session = await db.collection('patient_sessions').findOne({ token, expiresAt: { $gt: new Date() } });
    return session || null;
  } catch (_) { return null; }
}

async function deleteSessionFromDB(token) {
  try {
    const db = mongoose.connection.db;
    if (!db) return;
    await db.collection('patient_sessions').deleteOne({ token });
  } catch (_) {}
}

function createSession(patient) {
  const token = crypto.randomBytes(32).toString('hex');
  const session = {
    patientId: patient.id || String(patient._id),
    name: patient.name,
    email: patient.email,
    phone: patient.phone,
    preferredLanguage: patient.preferredLanguage || 'en',
    easyMode: !!patient.easyMode,
    createdAt: Date.now()
  };

  if (useMemory) {
    patientSessions.set(token, session);
    setTimeout(() => patientSessions.delete(token), 24 * 60 * 60 * 1000);
  } else {
    saveSessionToDB(token, session);
  }

  return {
    token,
    user: {
      id: session.patientId,
      name: session.name,
      email: session.email,
      phone: session.phone,
      preferredLanguage: session.preferredLanguage,
      easyMode: session.easyMode
    }
  };
}

async function getSessionFromToken(token) {
  if (!token) return null;
  if (useMemory) return patientSessions.get(token) || null;
  return await getSessionFromDB(token);
}

function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

function generateFourDigitOtp() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

router.post('/signup', async (req, res) => {
  try {
    const { name, email, phone, password, preferredLanguage, easyMode } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizePhone(phone);

    if (!name || !normalizedEmail || !normalizedPhone || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    if (normalizedPhone.length !== 10) {
      return res.status(400).json({ success: false, message: 'Phone must be 10 digits' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const { salt, hash } = createPasswordRecord(password);

    if (useMemory) {
      const exists = memoryPatients.find((p) => p.email === normalizedEmail || p.phone === normalizedPhone);
      if (exists) {
        return res.status(409).json({ success: false, message: 'User already exists with this email or phone' });
      }

      const patient = {
        _id: 'pat_' + Date.now() + Math.random().toString(36).slice(2, 6),
        name: String(name).trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        passwordHash: hash,
        passwordSalt: salt,
        preferredLanguage: String(preferredLanguage || 'en').trim().toLowerCase(),
        easyMode: !!easyMode,
        createdAt: new Date()
      };
      memoryPatients.push(patient);

      const sessionData = createSession(patient);
      return res.status(201).json({ success: true, message: 'Account created', ...sessionData });
    }

    const Patient = require('../models/Patient');

    const exists = await Patient.findOne({ $or: [{ email: normalizedEmail }, { phone: normalizedPhone }] });
    if (exists) {
      return res.status(409).json({ success: false, message: 'User already exists with this email or phone' });
    }

    const patient = new Patient({
      name: String(name).trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      passwordHash: hash,
      passwordSalt: salt,
      preferredLanguage: String(preferredLanguage || 'en').trim().toLowerCase(),
      easyMode: !!easyMode
    });

    await patient.save();
    const sessionData = createSession(patient);
    return res.status(201).json({ success: true, message: 'Account created', ...sessionData });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create account' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const normalizedIdentifier = normalizeEmail(identifier);
    const normalizedPhone = normalizePhone(identifier);

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Identifier and password are required' });
    }

    let patient;

    if (useMemory) {
      patient = memoryPatients.find((p) => p.email === normalizedIdentifier || p.phone === normalizedPhone);
    } else {
      const Patient = require('../models/Patient');
      patient = await Patient.findOne({ $or: [{ email: normalizedIdentifier }, { phone: normalizedPhone }] });
    }

    if (!patient) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const expectedHash = hashPassword(password, patient.passwordSalt);
    if (expectedHash !== patient.passwordHash) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const sessionData = createSession(patient);
    return res.json({ success: true, message: 'Login successful', ...sessionData });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Failed to login' });
  }
});

router.post('/forgot-password/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    const normalizedPhone = normalizePhone(phone);
    const now = Date.now();

    if (!normalizedPhone) {
      return res.status(400).json({ success: false, message: 'Phone is required' });
    }

    if (normalizedPhone.length !== 10) {
      return res.status(400).json({ success: false, message: 'Phone must be 10 digits' });
    }

    let patientExists = false;

    if (useMemory) {
      patientExists = !!memoryPatients.find((p) => p.phone === normalizedPhone);
    } else {
      const Patient = require('../models/Patient');
      patientExists = !!(await Patient.findOne({ phone: normalizedPhone }));
    }

    if (!patientExists) {
      return res.status(404).json({ success: false, message: 'No account found with this phone number' });
    }

    const currentOtpState = otpResetStore.get(normalizedPhone);
    if (currentOtpState && now - currentOtpState.lastSentAt < OTP_COOLDOWN_MS) {
      return res.status(429).json({
        success: false,
        message: 'Please wait before requesting OTP again'
      });
    }

    const otp = generateFourDigitOtp();
    otpResetStore.set(normalizedPhone, {
      otpHash: hashOtp(otp),
      expiresAt: now + OTP_EXPIRY_MS,
      attempts: 0,
      lastSentAt: now
    });

    const smsResult = await sendOtpToPhone(normalizedPhone, otp);
    const smsProvider = String(process.env.SMS_PROVIDER || '').trim().toLowerCase();

    if (smsProvider && !smsResult.delivered) {
      otpResetStore.delete(normalizedPhone);
      return res.status(502).json({
        success: false,
        message: 'OTP SMS delivery failed. Please check SMS provider setup.',
        provider: smsResult.provider || smsProvider,
        error: smsResult.error || 'Unknown SMS delivery error'
      });
    }

    const response = {
      success: true,
      message: 'OTP sent to your phone number',
      expiresInSeconds: Math.floor(OTP_EXPIRY_MS / 1000),
      delivery: smsResult.delivered ? 'sms' : 'dev-fallback'
    };

    // Expose OTP only when SMS provider is not configured or delivery failed.
    if (!smsResult.delivered && process.env.NODE_ENV !== 'production') {
      response.debugOtp = otp;
      console.log(`[OTP DEBUG] Phone ${normalizedPhone} OTP: ${otp}`);
    }

    return res.json(response);
  } catch (error) {
    console.error('Send OTP error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});

router.post('/forgot-password/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const normalizedPhone = normalizePhone(phone);
    const otpValue = String(otp || '').trim();
    const now = Date.now();

    if (!normalizedPhone || !otpValue) {
      return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
    }

    if (!/^\d{4}$/.test(otpValue)) {
      return res.status(400).json({ success: false, message: 'OTP must be 4 digits' });
    }

    const otpState = otpResetStore.get(normalizedPhone);
    if (!otpState) {
      return res.status(400).json({ success: false, message: 'Please request OTP first' });
    }

    if (now > otpState.expiresAt) {
      otpResetStore.delete(normalizedPhone);
      return res.status(400).json({ success: false, message: 'OTP expired. Please request a new OTP' });
    }

    if (otpState.attempts >= MAX_OTP_ATTEMPTS) {
      otpResetStore.delete(normalizedPhone);
      return res.status(429).json({ success: false, message: 'Too many wrong attempts. Request OTP again' });
    }

    if (hashOtp(otpValue) !== otpState.otpHash) {
      otpState.attempts += 1;
      otpResetStore.set(normalizedPhone, otpState);
      return res.status(401).json({ success: false, message: 'Invalid OTP' });
    }

    const resetToken = crypto.randomBytes(24).toString('hex');
    resetTokenStore.set(normalizedPhone, {
      tokenHash: hashOtp(resetToken),
      expiresAt: now + RESET_TOKEN_EXPIRY_MS
    });

    otpResetStore.delete(normalizedPhone);

    return res.json({
      success: true,
      message: 'OTP verified',
      resetToken
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
});

router.post('/forgot-password/reset', async (req, res) => {
  try {
    const { phone, resetToken, newPassword } = req.body;
    const normalizedPhone = normalizePhone(phone);
    const now = Date.now();

    if (!normalizedPhone || !resetToken || !newPassword) {
      return res.status(400).json({ success: false, message: 'Phone, reset token and new password are required' });
    }

    if (normalizedPhone.length !== 10) {
      return res.status(400).json({ success: false, message: 'Phone must be 10 digits' });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const tokenState = resetTokenStore.get(normalizedPhone);
    if (!tokenState || now > tokenState.expiresAt) {
      resetTokenStore.delete(normalizedPhone);
      return res.status(401).json({ success: false, message: 'Reset session expired. Verify OTP again' });
    }

    if (hashOtp(String(resetToken)) !== tokenState.tokenHash) {
      return res.status(401).json({ success: false, message: 'Invalid reset token' });
    }

    const { salt, hash } = createPasswordRecord(newPassword);
    let patientId = null;

    if (useMemory) {
      const patient = memoryPatients.find((p) => p.phone === normalizedPhone);
      if (!patient) {
        return res.status(404).json({ success: false, message: 'No account found with this phone number' });
      }

      patient.passwordSalt = salt;
      patient.passwordHash = hash;
      patientId = String(patient._id);
    } else {
      const Patient = require('../models/Patient');
      const patient = await Patient.findOne({ phone: normalizedPhone });
      if (!patient) {
        return res.status(404).json({ success: false, message: 'No account found with this phone number' });
      }

      patient.passwordSalt = salt;
      patient.passwordHash = hash;
      await patient.save();
      patientId = String(patient._id);
    }

    resetTokenStore.delete(normalizedPhone);

    // Revoke existing sessions for this patient after password reset.
    for (const [token, session] of patientSessions.entries()) {
      if (session.patientId === patientId) {
        patientSessions.delete(token);
      }
    }

    return res.json({ success: true, message: 'Password reset successful. Please login again.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
});

router.post('/verify', async (req, res) => {
  const { token } = req.body;
  const session = await getSessionFromToken(token);

  if (!session) {
    return res.status(401).json({ valid: false });
  }

  return res.json({
    valid: true,
    user: {
      id: session.patientId,
      name: session.name,
      email: session.email,
      phone: session.phone,
      preferredLanguage: session.preferredLanguage || 'en',
      easyMode: !!session.easyMode
    }
  });
});

router.patch('/preferences', async (req, res) => {
  try {
    const { token, preferredLanguage, easyMode } = req.body;
    const session = await getSessionFromToken(token);

    if (!session) {
      return res.status(401).json({ success: false, message: 'Invalid session' });
    }

    const updates = {};
    if (typeof preferredLanguage === 'string' && preferredLanguage.trim()) {
      updates.preferredLanguage = preferredLanguage.trim().toLowerCase();
    }
    if (typeof easyMode === 'boolean') {
      updates.easyMode = easyMode;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No preference updates provided' });
    }

    if (useMemory) {
      const patient = memoryPatients.find((p) => String(p._id) === session.patientId);
      if (!patient) {
        return res.status(404).json({ success: false, message: 'Patient not found' });
      }
      Object.assign(patient, updates);
    } else {
      const Patient = require('../models/Patient');
      const patient = await Patient.findByIdAndUpdate(session.patientId, updates, { new: true });
      if (!patient) {
        return res.status(404).json({ success: false, message: 'Patient not found' });
      }
    }

    if (updates.preferredLanguage) session.preferredLanguage = updates.preferredLanguage;
    if (typeof updates.easyMode === 'boolean') session.easyMode = updates.easyMode;

    return res.json({
      success: true,
      message: 'Preferences updated',
      preferences: {
        preferredLanguage: session.preferredLanguage || 'en',
        easyMode: !!session.easyMode
      }
    });
  } catch (error) {
    console.error('Preference update error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update preferences' });
  }
});

router.post('/logout', async (req, res) => {
  const { token } = req.body;
  if (token) {
    patientSessions.delete(token);
    await deleteSessionFromDB(token);
  }
  return res.json({ success: true });
});

// GET /api/patients/profile
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
    const session = await getSessionFromToken(token);
    if (!session) return res.status(401).json({ success: false, message: 'Invalid session' });

    const profileFields = ['name','email','phone','dateOfBirth','gender','bloodGroup',
      'address','city','state','pincode','emergencyContactName','emergencyContactPhone',
      'emergencyContactRelation','allergies','chronicConditions','currentMedications',
      'profileComplete','createdAt'];

    if (useMemory) {
      const p = memoryPatients.find(p => String(p._id) === session.patientId);
      if (!p) return res.status(404).json({ success: false, message: 'Patient not found' });
      const profile = {};
      profileFields.forEach(f => { profile[f] = p[f] ?? ''; });
      return res.json({ success: true, profile });
    }

    const Patient = require('../models/Patient');
    const p = await Patient.findById(session.patientId).select(profileFields.join(' '));
    if (!p) return res.status(404).json({ success: false, message: 'Patient not found' });
    return res.json({ success: true, profile: p });
  } catch (err) {
    console.error('Profile fetch error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
});

// PATCH /api/patients/profile
router.patch('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
    const session = await getSessionFromToken(token);
    if (!session) return res.status(401).json({ success: false, message: 'Invalid session' });

    const allowed = ['name','dateOfBirth','gender','bloodGroup','address','city','state',
      'pincode','emergencyContactName','emergencyContactPhone','emergencyContactRelation',
      'allergies','chronicConditions','currentMedications'];

    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    // Check profile completeness
    const required = ['dateOfBirth','gender','bloodGroup','address','city','emergencyContactName','emergencyContactPhone'];
    const allFilled = required.every(f => updates[f] || req.body[f]);
    updates.profileComplete = allFilled;

    if (useMemory) {
      const p = memoryPatients.find(p => String(p._id) === session.patientId);
      if (!p) return res.status(404).json({ success: false, message: 'Patient not found' });
      Object.assign(p, updates);
      if (updates.name) session.name = updates.name;
      return res.json({ success: true, message: 'Profile updated', profileComplete: updates.profileComplete });
    }

    const Patient = require('../models/Patient');
    const p = await Patient.findByIdAndUpdate(session.patientId, updates, { new: true });
    if (!p) return res.status(404).json({ success: false, message: 'Patient not found' });
    if (updates.name) session.name = updates.name;
    return res.json({ success: true, message: 'Profile updated', profileComplete: p.profileComplete });
  } catch (err) {
    console.error('Profile update error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

// PATCH /api/patients/change-password
router.patch('/change-password', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
    const session = await getSessionFromToken(token);
    if (!session) return res.status(401).json({ success: false, message: 'Invalid session' });

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: 'Both current and new password required' });
    if (newPassword.length < 6)
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });

    if (useMemory) {
      const p = memoryPatients.find(p => String(p._id) === session.patientId);
      if (!p) return res.status(404).json({ success: false, message: 'Patient not found' });
      if (hashPassword(currentPassword, p.passwordSalt) !== p.passwordHash)
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
      const { salt, hash } = createPasswordRecord(newPassword);
      p.passwordSalt = salt; p.passwordHash = hash;
      return res.json({ success: true, message: 'Password changed successfully' });
    }

    const Patient = require('../models/Patient');
    const p = await Patient.findById(session.patientId);
    if (!p) return res.status(404).json({ success: false, message: 'Patient not found' });
    if (hashPassword(currentPassword, p.passwordSalt) !== p.passwordHash)
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    const { salt, hash } = createPasswordRecord(newPassword);
    p.passwordSalt = salt; p.passwordHash = hash;
    await p.save();
    return res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ success: false, message: 'Failed to change password' });
  }
});

// GET /api/patients/search?q=name_or_email  (admin only - no auth check for simplicity)
router.get('/search', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q || q.length < 2) return res.json({ success: true, patients: [] });

    const profileFields = 'name email phone dateOfBirth gender bloodGroup address city state pincode emergencyContactName emergencyContactPhone emergencyContactRelation allergies chronicConditions currentMedications profileComplete createdAt';

    if (useMemory) {
      const lower = q.toLowerCase();
      const results = memoryPatients
        .filter(p => p.name?.toLowerCase().includes(lower) || p.email?.toLowerCase().includes(lower) || p.phone?.includes(q))
        .slice(0, 10)
        .map(p => {
          const obj = {};
          profileFields.split(' ').forEach(f => { obj[f] = p[f] ?? ''; });
          obj._id = p._id;
          return obj;
        });
      return res.json({ success: true, patients: results });
    }

    const Patient = require('../models/Patient');
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const patients = await Patient.find({
      $or: [{ name: regex }, { email: regex }, { phone: { $regex: q } }]
    }).select(profileFields).limit(10);

    return res.json({ success: true, patients });
  } catch (err) {
    console.error('Patient search error:', err);
    return res.status(500).json({ success: false, message: 'Search failed' });
  }
});

// GET /api/patients/:id/profile  (admin view full profile)
router.get('/:id/profile', async (req, res) => {
  try {
    const { id } = req.params;
    const profileFields = 'name email phone dateOfBirth gender bloodGroup address city state pincode emergencyContactName emergencyContactPhone emergencyContactRelation allergies chronicConditions currentMedications profileComplete createdAt';

    if (useMemory) {
      const p = memoryPatients.find(p => String(p._id) === id);
      if (!p) return res.status(404).json({ success: false, message: 'Patient not found' });
      const obj = {}; profileFields.split(' ').forEach(f => { obj[f] = p[f] ?? ''; }); obj._id = p._id;
      return res.json({ success: true, patient: obj });
    }

    const Patient = require('../models/Patient');
    const p = await Patient.findById(id).select(profileFields);
    if (!p) return res.status(404).json({ success: false, message: 'Patient not found' });
    return res.json({ success: true, patient: p });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch patient' });
  }
});

module.exports = router;
module.exports.setMemoryMode = setMemoryMode;

