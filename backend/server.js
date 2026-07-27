const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { initSocket } = require('./services/socket');
const { ensureSeedData } = require('./scripts/seed');

// Load environment variables
dotenv.config();

const startServer = async () => {
  const dbStatus = await connectDB();

  const app = express();
  app.locals.demoMode = !dbStatus.connected;

  if (!app.locals.demoMode) {
    await ensureSeedData();
    
    // Auto-migrate any existing teams that were seeded with 125Cr
    const Team = require('./models/Team');
    try {
      await Team.updateMany(
        { initialPurse: 1250000000 }, 
        { $set: { initialPurse: 2100000000 }, $inc: { remainingPurse: 850000000 } }
      );
    } catch (e) {
      console.log('Migration failed', e);
    }
  }

  // Middlewares
  app.use(cors());
  app.use(express.json());
  app.use('/content', express.static(path.join(__dirname, 'content')));

  // Mount API routes
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/players', require('./routes/players'));
  app.use('/api/teams', require('./routes/teams'));

  // Basic health check route
  app.get('/', (req, res) => {
    res.json({ message: 'SPEC IPL AUCTION 2026 API is running...' });
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: err.message || 'Internal Server Error' });
  });

  // Create Server
  const server = http.createServer(app);

  // Initialize Socket.IO (always, even in demo mode)
  initSocket(server, app.locals.demoMode);

  if (app.locals.demoMode) {
    console.log('MongoDB unavailable. Starting in demo mode with in-memory auction data.');
  }

  const PORT = process.env.PORT || 5000;

  server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
