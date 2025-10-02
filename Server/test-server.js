require('dotenv').config({ path: '.env.production' });

const express = require('express');
const cors = require('cors');
const { connectDatabases } = require('./config/database');
const { initializeModels } = require('./models');

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Simple health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Initialize database and models, then start server
const startServer = async () => {
  try {
    console.log('🔌 Connecting to databases...');
    await connectDatabases();

    console.log('🗂️ Initializing models...');
    initializeModels();

    console.log('🔗 Setting up routes...');
    app.use('/api/v1/admin', require('./routes/admin'));

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`🚀 Test server running on port ${PORT}`);
      console.log(`📱 Admin API available at: http://localhost:${PORT}/api/v1/admin`);
      console.log(`🔐 Admin login at: http://localhost:8081/admin/login`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;