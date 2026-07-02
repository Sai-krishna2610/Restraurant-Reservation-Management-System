const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { MongoMemoryServer } = require('mongodb-memory-server');
const seedDatabase = require('./config/db');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tables', require('./routes/tables'));
app.use('/api/reservations', require('./routes/reservations'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.message);
  res.status(500).json({ message: 'Internal server error occurred.', error: err.message });
});

const PORT = process.env.PORT || 5001;
let mongoServer;

const startServer = async () => {
  let mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/restaurant-reservation';

  try {
    // Attempt local database connection first
    console.log('Attempting connection to MongoDB...');
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2500 });
    console.log('Connected to local MongoDB database.');
  } catch (error) {
    console.log('Local MongoDB connection failed. Initializing in-memory database fallback...');
    try {
      mongoServer = await MongoMemoryServer.create();
      mongoUri = mongoServer.getUri();

      // Reset connection
      await mongoose.disconnect();
      await mongoose.connect(mongoUri);
      console.log('Connected to in-memory MongoDB database.');
    } catch (memError) {
      console.error('Failed to initialize in-memory database:', memError.message);
      process.exit(1);
    }
  }

  // Seed default dataset if database is fresh
  await seedDatabase();

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received. Closing server...');
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
  process.exit(0);
});
