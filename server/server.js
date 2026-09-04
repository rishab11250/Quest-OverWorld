require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
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

// Security Headers
app.use(helmet());

// CORS — restrict origins in production via CORS_ORIGIN env var
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(
  cors({
    origin: corsOrigin === '*' ? true : corsOrigin.split(',').map((o) => o.trim()),
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads folder
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting — auth endpoints (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again after 15 minutes.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Rate limiting — upload endpoint (DoS & storage abuse protection)
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 uploads per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Upload rate limit exceeded. Please wait 15 minutes.' },
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/quests', questRoutes);
app.use('/api/checkpoints', checkpointRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);

// Image Upload Endpoint (Protected with auth, rate-limit, and payload format validation)
const { protect } = require('./middleware/auth');
const { uploadImage, detectImageFormat } = require('./utils/cloudinary');
app.post('/api/upload', uploadLimiter, protect, async (req, res) => {
  try {
    const { image, folder } = req.body;
    if (!image) return res.status(400).json({ message: 'Image data is required' });

    const detected = detectImageFormat(image);
    if (!detected) {
      return res.status(400).json({
        message: 'Invalid or unsupported image format. Please upload JPEG, PNG, GIF, or WebP.',
      });
    }

    const url = await uploadImage(image, folder || 'quest_overworld_proofs');
    return res.status(200).json({ url });
  } catch (err) {
    console.error('[Upload Error]', err.message);
    const msg =
      process.env.NODE_ENV === 'production' ? 'Upload failed' : err.message || 'Upload failed';
    return res.status(500).json({ message: msg });
  }
});

// Base Route / Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Quest Overworld API is running' });
});

// Global error handler — sanitize 500 errors in production
app.use((err, req, res, _next) => {
  console.error('[Unhandled Error]', err.stack || err.message);
  const status = err.statusCode || 500;
  const message =
    status === 500 && process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error';
  res.status(status).json({ message });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} (0.0.0.0)`);
  });
}

module.exports = app;
