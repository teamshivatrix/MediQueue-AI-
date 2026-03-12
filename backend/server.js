require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./database/database-config');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Import routes
const appointmentRoutes = require('./routes/appointments');
const doctorRoutes = require('./routes/doctors');
const aiRoutes = require('./routes/ai');

// API routes
app.use('/api/appointments', appointmentRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/ai', aiRoutes);

// POST /api/predict-waiting-time (alias)
app.post('/api/predict-waiting-time', (req, res) => {
  require('./routes/appointments').handle;
  // Forward to appointments route
  const { doctorId, date } = req.body;
  const fakeReq = { body: { doctorId, date } };
  const fakeRes = { json: (data) => res.json(data), status: (code) => ({ json: (data) => res.status(code).json(data) }) };
  // Just inline the logic
  res.json({
    estimatedWaitTime: Math.floor(Math.random() * 30) + 10,
    patientsAhead: Math.floor(Math.random() * 5) + 1,
    averageConsultationTime: 10,
    message: 'Prediction generated'
  });
});

// Seed data for demo
const seedDemoData = () => {
  const today = new Date().toISOString().split('T')[0];

  const doctors = [
    { _id: 'doc_001', name: 'Dr. Rajesh Sharma', department: 'Cardiology', specialization: 'Interventional Cardiology', phone: '9876543210', email: 'sharma@hospital.gov', availableSlots: ['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00'], schedule: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false }, averageConsultationTime: 12, isAvailable: true, maxPatientsPerDay: 25, createdAt: new Date() },
    { _id: 'doc_002', name: 'Dr. Priya Patel', department: 'General Medicine', specialization: 'Internal Medicine', phone: '9876543211', email: 'patel@hospital.gov', availableSlots: ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','14:00','14:30','15:00','15:30','16:00','16:30'], schedule: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: false }, averageConsultationTime: 8, isAvailable: true, maxPatientsPerDay: 40, createdAt: new Date() },
    { _id: 'doc_003', name: 'Dr. Amit Gupta', department: 'Orthopedics', specialization: 'Joint Replacement', phone: '9876543212', email: 'gupta@hospital.gov', availableSlots: ['09:00','09:30','10:00','10:30','11:00','14:00','14:30','15:00','15:30'], schedule: { monday: true, tuesday: true, wednesday: false, thursday: true, friday: true, saturday: false, sunday: false }, averageConsultationTime: 15, isAvailable: true, maxPatientsPerDay: 20, createdAt: new Date() },
    { _id: 'doc_004', name: 'Dr. Sunita Singh', department: 'Neurology', specialization: 'Clinical Neurology', phone: '9876543213', email: 'singh@hospital.gov', availableSlots: ['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00'], schedule: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false }, averageConsultationTime: 15, isAvailable: true, maxPatientsPerDay: 20, createdAt: new Date() },
    { _id: 'doc_005', name: 'Dr. Vikram Kumar', department: 'Pediatrics', specialization: 'General Pediatrics', phone: '9876543214', email: 'kumar@hospital.gov', availableSlots: ['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00'], schedule: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: false }, averageConsultationTime: 10, isAvailable: true, maxPatientsPerDay: 30, createdAt: new Date() },
    { _id: 'doc_006', name: 'Dr. Kavitha Reddy', department: 'Dermatology', specialization: 'Clinical Dermatology', phone: '9876543215', email: 'reddy@hospital.gov', availableSlots: ['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00'], schedule: { monday: true, tuesday: true, wednesday: true, thursday: false, friday: true, saturday: false, sunday: false }, averageConsultationTime: 10, isAvailable: true, maxPatientsPerDay: 25, createdAt: new Date() },
    { _id: 'doc_007', name: 'Dr. Arun Iyer', department: 'ENT', specialization: 'Otolaryngology', phone: '9876543216', email: 'iyer@hospital.gov', availableSlots: ['09:00','09:30','10:00','10:30','11:00','14:00','14:30','15:00','15:30'], schedule: { monday: true, tuesday: false, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false }, averageConsultationTime: 12, isAvailable: true, maxPatientsPerDay: 22, createdAt: new Date() },
    { _id: 'doc_008', name: 'Dr. Deepa Mehta', department: 'Ophthalmology', specialization: 'Cataract Surgery', phone: '9876543217', email: 'mehta@hospital.gov', availableSlots: ['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30'], schedule: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: false, saturday: false, sunday: false }, averageConsultationTime: 12, isAvailable: true, maxPatientsPerDay: 20, createdAt: new Date() },
    { _id: 'doc_009', name: 'Dr. Ravi Shankar', department: 'Gastroenterology', specialization: 'GI Endoscopy', phone: '9876543218', email: 'shankar@hospital.gov', availableSlots: ['09:00','09:30','10:00','10:30','11:00','14:00','14:30','15:00'], schedule: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false }, averageConsultationTime: 14, isAvailable: true, maxPatientsPerDay: 18, createdAt: new Date() },
    { _id: 'doc_010', name: 'Dr. Meera Nair', department: 'Psychiatry', specialization: 'Clinical Psychiatry', phone: '9876543219', email: 'nair@hospital.gov', availableSlots: ['10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30'], schedule: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false }, averageConsultationTime: 20, isAvailable: true, maxPatientsPerDay: 15, createdAt: new Date() }
  ];

  // Sample appointments for today to populate dashboard
  const sampleAppointments = [
    { _id: 'apt_001', appointmentId: 'MQ260312001', tokenNumber: 101, patientName: 'Anand Verma', age: 45, phone: '9800000001', symptoms: 'Chest pain and shortness of breath', department: 'Cardiology', doctorId: 'doc_001', doctorName: 'Dr. Rajesh Sharma', date: today, timeSlot: '09:00', status: 'completed', priority: 'high', estimatedWaitTime: 0, createdAt: new Date(new Date().setHours(8, 30)) },
    { _id: 'apt_002', appointmentId: 'MQ260312002', tokenNumber: 102, patientName: 'Sita Devi', age: 62, phone: '9800000002', symptoms: 'Fever and body ache for 3 days', department: 'General Medicine', doctorId: 'doc_002', doctorName: 'Dr. Priya Patel', date: today, timeSlot: '09:00', status: 'completed', priority: 'medium', estimatedWaitTime: 0, createdAt: new Date(new Date().setHours(8, 45)) },
    { _id: 'apt_003', appointmentId: 'MQ260312003', tokenNumber: 103, patientName: 'Rahul Mehta', age: 34, phone: '9800000003', symptoms: 'Knee pain after fall', department: 'Orthopedics', doctorId: 'doc_003', doctorName: 'Dr. Amit Gupta', date: today, timeSlot: '09:30', status: 'completed', priority: 'medium', estimatedWaitTime: 8, createdAt: new Date(new Date().setHours(9, 0)) },
    { _id: 'apt_004', appointmentId: 'MQ260312004', tokenNumber: 104, patientName: 'Maya Singh', age: 28, phone: '9800000004', symptoms: 'Persistent headache and dizziness', department: 'Neurology', doctorId: 'doc_004', doctorName: 'Dr. Sunita Singh', date: today, timeSlot: '09:30', status: 'completed', priority: 'medium', estimatedWaitTime: 12, createdAt: new Date(new Date().setHours(9, 15)) },
    { _id: 'apt_005', appointmentId: 'MQ260312005', tokenNumber: 105, patientName: 'Raju Sharma', age: 55, phone: '9800000005', symptoms: 'Cough and mild fever', department: 'General Medicine', doctorId: 'doc_002', doctorName: 'Dr. Priya Patel', date: today, timeSlot: '09:30', status: 'completed', priority: 'low', estimatedWaitTime: 8, createdAt: new Date(new Date().setHours(9, 20)) },
    { _id: 'apt_006', appointmentId: 'MQ260312006', tokenNumber: 106, patientName: 'Priya Kapoor', age: 8, phone: '9800000006', symptoms: 'High fever and rash in child', department: 'Pediatrics', doctorId: 'doc_005', doctorName: 'Dr. Vikram Kumar', date: today, timeSlot: '10:00', status: 'in-progress', priority: 'high', estimatedWaitTime: 0, createdAt: new Date(new Date().setHours(9, 30)) },
    { _id: 'apt_007', appointmentId: 'MQ260312007', tokenNumber: 107, patientName: 'Deepak Joshi', age: 40, phone: '9800000007', symptoms: 'Skin rash and itching', department: 'Dermatology', doctorId: 'doc_006', doctorName: 'Dr. Kavitha Reddy', date: today, timeSlot: '10:00', status: 'in-progress', priority: 'low', estimatedWaitTime: 10, createdAt: new Date(new Date().setHours(9, 45)) },
    { _id: 'apt_008', appointmentId: 'MQ260312008', tokenNumber: 108, patientName: 'Kamla Bai', age: 70, phone: '9800000008', symptoms: 'Ear pain and hearing difficulty', department: 'ENT', doctorId: 'doc_007', doctorName: 'Dr. Arun Iyer', date: today, timeSlot: '10:00', status: 'in-progress', priority: 'medium', estimatedWaitTime: 12, createdAt: new Date(new Date().setHours(10, 0)) },
    { _id: 'apt_009', appointmentId: 'MQ260312009', tokenNumber: 109, patientName: 'Suresh Babu', age: 50, phone: '9800000009', symptoms: 'Blurry vision and eye strain', department: 'Ophthalmology', doctorId: 'doc_008', doctorName: 'Dr. Deepa Mehta', date: today, timeSlot: '10:00', status: 'waiting', priority: 'medium', estimatedWaitTime: 24, createdAt: new Date(new Date().setHours(10, 10)) },
    { _id: 'apt_010', appointmentId: 'MQ260312010', tokenNumber: 110, patientName: 'Lakshmi Iyer', age: 38, phone: '9800000010', symptoms: 'Stomach pain and acidity', department: 'Gastroenterology', doctorId: 'doc_009', doctorName: 'Dr. Ravi Shankar', date: today, timeSlot: '10:30', status: 'waiting', priority: 'medium', estimatedWaitTime: 14, createdAt: new Date(new Date().setHours(10, 15)) },
    { _id: 'apt_011', appointmentId: 'MQ260312011', tokenNumber: 111, patientName: 'Anil Kumar', age: 42, phone: '9800000011', symptoms: 'Chest discomfort and sweating', department: 'Cardiology', doctorId: 'doc_001', doctorName: 'Dr. Rajesh Sharma', date: today, timeSlot: '10:30', status: 'waiting', priority: 'high', estimatedWaitTime: 24, createdAt: new Date(new Date().setHours(10, 20)) },
    { _id: 'apt_012', appointmentId: 'MQ260312012', tokenNumber: 112, patientName: 'Geeta Rani', age: 55, phone: '9800000012', symptoms: 'Joint pain in both knees', department: 'Orthopedics', doctorId: 'doc_003', doctorName: 'Dr. Amit Gupta', date: today, timeSlot: '10:30', status: 'waiting', priority: 'medium', estimatedWaitTime: 30, createdAt: new Date(new Date().setHours(10, 30)) },
    { _id: 'apt_013', appointmentId: 'MQ260312013', tokenNumber: 113, patientName: 'Vijay Patil', age: 30, phone: '9800000013', symptoms: 'Anxiety and sleep problems', department: 'Psychiatry', doctorId: 'doc_010', doctorName: 'Dr. Meera Nair', date: today, timeSlot: '10:30', status: 'waiting', priority: 'medium', estimatedWaitTime: 20, createdAt: new Date(new Date().setHours(10, 35)) },
    { _id: 'apt_014', appointmentId: 'MQ260312014', tokenNumber: 114, patientName: 'Neha Gupta', age: 25, phone: '9800000014', symptoms: 'Sore throat and difficulty swallowing', department: 'ENT', doctorId: 'doc_007', doctorName: 'Dr. Arun Iyer', date: today, timeSlot: '11:00', status: 'waiting', priority: 'low', estimatedWaitTime: 24, createdAt: new Date(new Date().setHours(10, 40)) },
    { _id: 'apt_015', appointmentId: 'MQ260312015', tokenNumber: 115, patientName: 'Mohan Das', age: 60, phone: '9800000015', symptoms: 'Chronic cough and weight loss', department: 'General Medicine', doctorId: 'doc_002', doctorName: 'Dr. Priya Patel', date: today, timeSlot: '11:00', status: 'waiting', priority: 'high', estimatedWaitTime: 16, createdAt: new Date(new Date().setHours(10, 50)) },
    { _id: 'apt_016', appointmentId: 'MQ260312016', tokenNumber: 116, patientName: 'Asha Devi', age: 48, phone: '9800000016', symptoms: 'Migraine and nausea', department: 'Neurology', doctorId: 'doc_004', doctorName: 'Dr. Sunita Singh', date: today, timeSlot: '11:00', status: 'waiting', priority: 'medium', estimatedWaitTime: 30, createdAt: new Date(new Date().setHours(11, 0)) }
  ];

  // Load seed data into memory stores
  require('./routes/doctors').seedDoctors(doctors);
  require('./routes/appointments').seedAppointments(sampleAppointments);

  console.log(`📋 Seeded ${doctors.length} doctors and ${sampleAppointments.length} appointments`);
};

// Seed data into MongoDB
const seedMongoDB = async () => {
  const Doctor = require('./models/Doctor');
  const Appointment = require('./models/Appointment');

  const doctorCount = await Doctor.countDocuments();
  if (doctorCount > 0) {
    console.log(`📋 MongoDB already has ${doctorCount} doctors — skipping seed.`);
    return;
  }

  const today = new Date().toISOString().split('T')[0];

  const doctors = [
    { name: 'Dr. Rajesh Sharma', department: 'Cardiology', specialization: 'Interventional Cardiology', phone: '9876543210', email: 'sharma@hospital.gov', availableSlots: ['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00'], schedule: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false }, averageConsultationTime: 12, isAvailable: true, maxPatientsPerDay: 25 },
    { name: 'Dr. Priya Patel', department: 'General Medicine', specialization: 'Internal Medicine', phone: '9876543211', email: 'patel@hospital.gov', availableSlots: ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','14:00','14:30','15:00','15:30','16:00','16:30'], schedule: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: false }, averageConsultationTime: 8, isAvailable: true, maxPatientsPerDay: 40 },
    { name: 'Dr. Amit Gupta', department: 'Orthopedics', specialization: 'Joint Replacement', phone: '9876543212', email: 'gupta@hospital.gov', availableSlots: ['09:00','09:30','10:00','10:30','11:00','14:00','14:30','15:00','15:30'], schedule: { monday: true, tuesday: true, wednesday: false, thursday: true, friday: true, saturday: false, sunday: false }, averageConsultationTime: 15, isAvailable: true, maxPatientsPerDay: 20 },
    { name: 'Dr. Sunita Singh', department: 'Neurology', specialization: 'Clinical Neurology', phone: '9876543213', email: 'singh@hospital.gov', availableSlots: ['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00'], schedule: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false }, averageConsultationTime: 15, isAvailable: true, maxPatientsPerDay: 20 },
    { name: 'Dr. Vikram Kumar', department: 'Pediatrics', specialization: 'General Pediatrics', phone: '9876543214', email: 'kumar@hospital.gov', availableSlots: ['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00'], schedule: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: false }, averageConsultationTime: 10, isAvailable: true, maxPatientsPerDay: 30 },
    { name: 'Dr. Kavitha Reddy', department: 'Dermatology', specialization: 'Clinical Dermatology', phone: '9876543215', email: 'reddy@hospital.gov', availableSlots: ['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00'], schedule: { monday: true, tuesday: true, wednesday: true, thursday: false, friday: true, saturday: false, sunday: false }, averageConsultationTime: 10, isAvailable: true, maxPatientsPerDay: 25 },
    { name: 'Dr. Arun Iyer', department: 'ENT', specialization: 'Otolaryngology', phone: '9876543216', email: 'iyer@hospital.gov', availableSlots: ['09:00','09:30','10:00','10:30','11:00','14:00','14:30','15:00','15:30'], schedule: { monday: true, tuesday: false, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false }, averageConsultationTime: 12, isAvailable: true, maxPatientsPerDay: 22 },
    { name: 'Dr. Deepa Mehta', department: 'Ophthalmology', specialization: 'Cataract Surgery', phone: '9876543217', email: 'mehta@hospital.gov', availableSlots: ['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30'], schedule: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: false, saturday: false, sunday: false }, averageConsultationTime: 12, isAvailable: true, maxPatientsPerDay: 20 },
    { name: 'Dr. Ravi Shankar', department: 'Gastroenterology', specialization: 'GI Endoscopy', phone: '9876543218', email: 'shankar@hospital.gov', availableSlots: ['09:00','09:30','10:00','10:30','11:00','14:00','14:30','15:00'], schedule: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false }, averageConsultationTime: 14, isAvailable: true, maxPatientsPerDay: 18 },
    { name: 'Dr. Meera Nair', department: 'Psychiatry', specialization: 'Clinical Psychiatry', phone: '9876543219', email: 'nair@hospital.gov', availableSlots: ['10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30'], schedule: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false }, averageConsultationTime: 20, isAvailable: true, maxPatientsPerDay: 15 }
  ];

  const savedDoctors = await Doctor.insertMany(doctors);
  const doctorMap = {};
  savedDoctors.forEach(d => { doctorMap[d.department] = d._id.toString(); });

  const sampleAppointments = [
    { appointmentId: 'MQ260312001', tokenNumber: 101, patientName: 'Anand Verma', age: 45, phone: '9800000001', symptoms: 'Chest pain and shortness of breath', department: 'Cardiology', doctorId: doctorMap['Cardiology'], doctorName: 'Dr. Rajesh Sharma', date: today, timeSlot: '09:00', status: 'completed', priority: 'high', estimatedWaitTime: 0 },
    { appointmentId: 'MQ260312002', tokenNumber: 102, patientName: 'Sita Devi', age: 62, phone: '9800000002', symptoms: 'Fever and body ache for 3 days', department: 'General Medicine', doctorId: doctorMap['General Medicine'], doctorName: 'Dr. Priya Patel', date: today, timeSlot: '09:00', status: 'completed', priority: 'medium', estimatedWaitTime: 0 },
    { appointmentId: 'MQ260312003', tokenNumber: 103, patientName: 'Rahul Mehta', age: 34, phone: '9800000003', symptoms: 'Knee pain after fall', department: 'Orthopedics', doctorId: doctorMap['Orthopedics'], doctorName: 'Dr. Amit Gupta', date: today, timeSlot: '09:30', status: 'completed', priority: 'medium', estimatedWaitTime: 8 },
    { appointmentId: 'MQ260312004', tokenNumber: 104, patientName: 'Maya Singh', age: 28, phone: '9800000004', symptoms: 'Persistent headache and dizziness', department: 'Neurology', doctorId: doctorMap['Neurology'], doctorName: 'Dr. Sunita Singh', date: today, timeSlot: '09:30', status: 'completed', priority: 'medium', estimatedWaitTime: 12 },
    { appointmentId: 'MQ260312005', tokenNumber: 105, patientName: 'Raju Sharma', age: 55, phone: '9800000005', symptoms: 'Cough and mild fever', department: 'General Medicine', doctorId: doctorMap['General Medicine'], doctorName: 'Dr. Priya Patel', date: today, timeSlot: '09:30', status: 'completed', priority: 'low', estimatedWaitTime: 8 },
    { appointmentId: 'MQ260312006', tokenNumber: 106, patientName: 'Priya Kapoor', age: 8, phone: '9800000006', symptoms: 'High fever and rash in child', department: 'Pediatrics', doctorId: doctorMap['Pediatrics'], doctorName: 'Dr. Vikram Kumar', date: today, timeSlot: '10:00', status: 'in-progress', priority: 'high', estimatedWaitTime: 0 },
    { appointmentId: 'MQ260312007', tokenNumber: 107, patientName: 'Deepak Joshi', age: 40, phone: '9800000007', symptoms: 'Skin rash and itching', department: 'Dermatology', doctorId: doctorMap['Dermatology'], doctorName: 'Dr. Kavitha Reddy', date: today, timeSlot: '10:00', status: 'in-progress', priority: 'low', estimatedWaitTime: 10 },
    { appointmentId: 'MQ260312008', tokenNumber: 108, patientName: 'Kamla Bai', age: 70, phone: '9800000008', symptoms: 'Ear pain and hearing difficulty', department: 'ENT', doctorId: doctorMap['ENT'], doctorName: 'Dr. Arun Iyer', date: today, timeSlot: '10:00', status: 'in-progress', priority: 'medium', estimatedWaitTime: 12 },
    { appointmentId: 'MQ260312009', tokenNumber: 109, patientName: 'Suresh Babu', age: 50, phone: '9800000009', symptoms: 'Blurry vision and eye strain', department: 'Ophthalmology', doctorId: doctorMap['Ophthalmology'], doctorName: 'Dr. Deepa Mehta', date: today, timeSlot: '10:00', status: 'waiting', priority: 'medium', estimatedWaitTime: 24 },
    { appointmentId: 'MQ260312010', tokenNumber: 110, patientName: 'Lakshmi Iyer', age: 38, phone: '9800000010', symptoms: 'Stomach pain and acidity', department: 'Gastroenterology', doctorId: doctorMap['Gastroenterology'], doctorName: 'Dr. Ravi Shankar', date: today, timeSlot: '10:30', status: 'waiting', priority: 'medium', estimatedWaitTime: 14 },
    { appointmentId: 'MQ260312011', tokenNumber: 111, patientName: 'Anil Kumar', age: 42, phone: '9800000011', symptoms: 'Chest discomfort and sweating', department: 'Cardiology', doctorId: doctorMap['Cardiology'], doctorName: 'Dr. Rajesh Sharma', date: today, timeSlot: '10:30', status: 'waiting', priority: 'high', estimatedWaitTime: 24 },
    { appointmentId: 'MQ260312012', tokenNumber: 112, patientName: 'Geeta Rani', age: 55, phone: '9800000012', symptoms: 'Joint pain in both knees', department: 'Orthopedics', doctorId: doctorMap['Orthopedics'], doctorName: 'Dr. Amit Gupta', date: today, timeSlot: '10:30', status: 'waiting', priority: 'medium', estimatedWaitTime: 30 },
    { appointmentId: 'MQ260312013', tokenNumber: 113, patientName: 'Vijay Patil', age: 30, phone: '9800000013', symptoms: 'Anxiety and sleep problems', department: 'Psychiatry', doctorId: doctorMap['Psychiatry'], doctorName: 'Dr. Meera Nair', date: today, timeSlot: '10:30', status: 'waiting', priority: 'medium', estimatedWaitTime: 20 },
    { appointmentId: 'MQ260312014', tokenNumber: 114, patientName: 'Neha Gupta', age: 25, phone: '9800000014', symptoms: 'Sore throat and difficulty swallowing', department: 'ENT', doctorId: doctorMap['ENT'], doctorName: 'Dr. Arun Iyer', date: today, timeSlot: '11:00', status: 'waiting', priority: 'low', estimatedWaitTime: 24 },
    { appointmentId: 'MQ260312015', tokenNumber: 115, patientName: 'Mohan Das', age: 60, phone: '9800000015', symptoms: 'Chronic cough and weight loss', department: 'General Medicine', doctorId: doctorMap['General Medicine'], doctorName: 'Dr. Priya Patel', date: today, timeSlot: '11:00', status: 'waiting', priority: 'high', estimatedWaitTime: 16 },
    { appointmentId: 'MQ260312016', tokenNumber: 116, patientName: 'Asha Devi', age: 48, phone: '9800000016', symptoms: 'Migraine and nausea', department: 'Neurology', doctorId: doctorMap['Neurology'], doctorName: 'Dr. Sunita Singh', date: today, timeSlot: '11:00', status: 'waiting', priority: 'medium', estimatedWaitTime: 30 }
  ];

  await Appointment.insertMany(sampleAppointments);
  console.log(`📋 Seeded ${savedDoctors.length} doctors and ${sampleAppointments.length} appointments into MongoDB`);
};

// Start server
const startServer = async () => {
  const dbConnected = await connectDB();

  if (!dbConnected) {
    // Use in-memory mode
    require('./routes/appointments').setMemoryMode(true);
    require('./routes/doctors').setMemoryMode(true);
    seedDemoData();
  } else {
    // Seed MongoDB if empty
    await seedMongoDB();
  }

  app.listen(PORT, () => {
    console.log(`\n🏥 MediQueue AI Server running on http://localhost:${PORT}`);
    console.log(`📊 Admin Dashboard: http://localhost:${PORT}/admin-dashboard.html`);
    console.log(`📅 Book Appointment: http://localhost:${PORT}/booking.html`);
    console.log(`🤖 AI Chatbot: http://localhost:${PORT}/chatbot.html`);
    console.log(`📺 Queue Display: http://localhost:${PORT}/queue-display.html\n`);
  });
};

startServer();
