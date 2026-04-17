const express = require('express');
const router = express.Router();

let memoryFeedback = [];
let useMemory = false;

const setMemoryMode = (val) => { useMemory = val; };

// POST /api/feedback — Submit rating after appointment
router.post('/', async (req, res) => {
  try {
    const { appointmentId, patientName, phone, doctorId, doctorName, department, rating, comment } = req.body;
    if (!appointmentId || !rating) return res.status(400).json({ error: 'appointmentId and rating required' });
    if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1-5' });

    const feedbackData = {
      _id: 'fb_' + Date.now(),
      appointmentId, patientName, phone,
      doctorId, doctorName, department,
      rating: parseInt(rating),
      comment: comment || '',
      createdAt: new Date()
    };

    if (useMemory) {
      memoryFeedback.push(feedbackData);
    } else {
      try {
        const Feedback = require('../models/Feedback');
        const fb = new Feedback(feedbackData);
        await fb.save();
        feedbackData._id = fb._id;
      } catch (dbErr) {
        // Fallback to memory if DB fails
        memoryFeedback.push(feedbackData);
      }
    }

    res.status(201).json({ success: true, feedback: feedbackData });
  } catch (err) {
    console.error('Feedback error:', err);
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

// GET /api/feedback — Get all feedback (admin)
router.get('/', async (req, res) => {
  try {
    const { doctorId, department } = req.query;
    let list;

    if (useMemory) {
      list = [...memoryFeedback];
      if (doctorId) list = list.filter(f => f.doctorId === doctorId);
      if (department) list = list.filter(f => f.department === department);
    } else {
      try {
        const Feedback = require('../models/Feedback');
        const filter = {};
        if (doctorId) filter.doctorId = doctorId;
        if (department) filter.department = department;
        list = await Feedback.find(filter).sort({ createdAt: -1 });
      } catch (_) {
        list = [...memoryFeedback];
      }
    }

    // Calculate averages per doctor
    const doctorStats = {};
    list.forEach(f => {
      const key = f.doctorName || f.doctorId;
      if (!doctorStats[key]) doctorStats[key] = { total: 0, count: 0, doctorName: f.doctorName, department: f.department };
      doctorStats[key].total += f.rating;
      doctorStats[key].count++;
    });
    Object.values(doctorStats).forEach(s => { s.avg = (s.total / s.count).toFixed(1); });

    res.json({ feedback: list, doctorStats });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

// GET /api/feedback/check/:appointmentId — Check if feedback already submitted
router.get('/check/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    let exists;
    if (useMemory) {
      exists = memoryFeedback.some(f => f.appointmentId === appointmentId);
    } else {
      try {
        const Feedback = require('../models/Feedback');
        exists = !!(await Feedback.findOne({ appointmentId }));
      } catch (_) {
        exists = memoryFeedback.some(f => f.appointmentId === appointmentId);
      }
    }
    res.json({ submitted: exists });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check feedback' });
  }
});

module.exports = router;
module.exports.setMemoryMode = setMemoryMode;
