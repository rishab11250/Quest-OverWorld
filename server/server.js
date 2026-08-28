require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const teamRoutes = require('./routes/teams');
const questRoutes = require('./routes/quests');
const checkpointRoutes = require('./routes/checkpoints');
const challengeRoutes = require('./routes/challenges');
const leaderboardRoutes = require('./routes/leaderboard');
const adminRoutes = require('./routes/admin');

const app = express();

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads folder
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/quests', questRoutes);
app.use('/api/checkpoints', checkpointRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);

// Image Upload Endpoint
const { uploadImage } = require('./utils/cloudinary');
app.post('/api/upload', async (req, res) => {
  try {
    const { image, folder } = req.body;
    if (!image) return res.status(400).json({ message: 'Image data is required' });
    const url = await uploadImage(image, folder || 'quest_overworld_proofs');
    return res.status(200).json({ url });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Upload failed' });
  }
});

// Base Route / Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Quest Overworld API is running' });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} (0.0.0.0)`);
  });
}

module.exports = app;
