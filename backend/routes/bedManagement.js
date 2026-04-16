const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// GET /api/bed-management — get all bed info
router.get('/', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const beds = await db.collection('bedmanagements').find({}).toArray();
    res.json(beds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bed-management — create/update bed info
router.post('/', async (req, res) => {
  try {
    const { department, wardType, totalBeds, occupiedBeds, pricePerDay } = req.body;
    if (!department || !wardType || totalBeds === undefined) {
      return res.status(400).json({ error: 'department, wardType and totalBeds required' });
    }

    const total = parseInt(totalBeds) || 0;
    const occupied = parseInt(occupiedBeds) || 0;
    const available = Math.max(0, total - occupied);

    const doc = {
      department,
      wardType,
      totalBeds: total,
      occupiedBeds: occupied,
      availableBeds: available,
      pricePerDay: parseFloat(pricePerDay) || 0,
      updatedAt: new Date()
    };

    const db = mongoose.connection.db;
    await db.collection('bedmanagements').replaceOne(
      { department },
      doc,
      { upsert: true }
    );

    res.json({ success: true, bed: doc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/bed-management/:department — update occupied beds
router.patch('/:department', async (req, res) => {
  try {
    const { occupiedBeds } = req.body;
    if (occupiedBeds === undefined) {
      return res.status(400).json({ error: 'occupiedBeds required' });
    }

    const db = mongoose.connection.db;
    const bed = await db.collection('bedmanagements').findOne({ department: req.params.department });
    if (!bed) return res.status(404).json({ error: 'Department not found' });

    const occupied = Math.max(0, Math.min(parseInt(occupiedBeds), bed.totalBeds));
    const available = bed.totalBeds - occupied;

    await db.collection('bedmanagements').updateOne(
      { department: req.params.department },
      { $set: { occupiedBeds: occupied, availableBeds: available, updatedAt: new Date() } }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/bed-management/:department
router.delete('/:department', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    await db.collection('bedmanagements').deleteOne({ department: req.params.department });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
