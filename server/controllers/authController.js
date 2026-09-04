const jwt = require('jsonwebtoken');
const User = require('../models/User');

if (!process.env.JWT_SECRET) {
  throw new Error(
    'FATAL: JWT_SECRET environment variable is not set. Server cannot start without it.'
  );
}

// Helper to sign JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, isAdmin: user.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, username, email, password, avatar } = req.body;
    const finalName = name || username;

    if (!finalName || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    const emailNormalized = email.toLowerCase().trim();
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_REGEX.test(emailNormalized)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }
    const existingUser = await User.findOne({ email: emailNormalized });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const passwordHash = await User.hashPassword(password);

    const user = await User.create({
      name: finalName.trim(),
      email: emailNormalized,
      passwordHash,
      avatar: avatar || '',
      isAdmin: false,
    });

    const token = generateToken(user);

    return res.status(201).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isAdmin: user.isAdmin,
      },
      token,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error during registration' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const emailNormalized = email.toLowerCase().trim();
    const user = await User.findOne({ email: emailNormalized });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.isBanned || user.status === 'banned') {
      return res.status(403).json({
        message: user.banReason
          ? `Your account has been banned: ${user.banReason}`
          : 'Your account has been banned by the Guild Arch-Master.',
        isBanned: true,
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isAdmin: user.isAdmin,
      },
      token,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error during login' });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    return res.status(200).json({ user: req.user });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Update user profile (name, avatar)
// @route   PUT /api/auth/me
// @access  Private
const updateMe = async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name && name.trim()) {
      user.name = name.trim();
    }
    if (avatar !== undefined) {
      user.avatar = avatar;
    }

    await user.save();

    return res.status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isAdmin: user.isAdmin,
      },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error updating profile' });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateMe,
};
