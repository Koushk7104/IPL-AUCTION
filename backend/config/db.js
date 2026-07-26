const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ipl_auction_2026', {
      serverSelectionTimeoutMS: 1500,
      connectTimeoutMS: 1500
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return { connected: true, demoMode: false };
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    return { connected: false, demoMode: true };
  }
};

module.exports = connectDB;
