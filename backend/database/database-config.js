const mongoose = require('mongoose');
const dns = require('dns');

// Force Google DNS to fix querySrv ECONNREFUSED issues
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;

    if (!uri || uri.includes('<username>') || uri.includes('username:password')) {
      console.log('⚠️  No valid MongoDB URI found. Running with in-memory fallback.');
      console.log('   Set MONGODB_URI in .env for persistent storage.\n');
      return false;
    }

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    console.log('✅ Connected to MongoDB Atlas');
    return true;
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('   Running with in-memory fallback.\n');
    return false;
  }
};

module.exports = { connectDB };
