const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hotelpro', {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB] Connection Error: ${error.message}`);
    console.warn(`[MongoDB] Running without MongoDB connection. Please verify your MONGO_URI in backend/.env`);
  }
};

module.exports = connectDB;
