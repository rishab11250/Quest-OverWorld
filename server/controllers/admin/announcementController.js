const Announcement = require('../../models/Announcement');

// @desc    Create a new announcement broadcast
// @route   POST /api/admin/announcements
// @access  Private (Admin only)
const createAnnouncement = async (req, res) => {
  try {
    const { message, questId, expiresAt } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'Announcement message is required.' });
    }

    const trimmed = message.trim();
    if (trimmed.length > 500) {
      return res.status(400).json({
        message: 'Announcement message cannot exceed 500 characters.',
      });
    }

    let parsedExpires = null;
    if (expiresAt) {
      parsedExpires = new Date(expiresAt);
      if (isNaN(parsedExpires.getTime())) {
        return res.status(400).json({ message: 'Invalid expiration date provided.' });
      }
    }

    const announcement = await Announcement.create({
      message: trimmed,
      questId: questId || null,
      createdBy: req.user._id,
      expiresAt: parsedExpires,
    });

    const populated = await Announcement.findById(announcement._id)
      .populate('createdBy', 'name email')
      .populate('questId', 'name');

    return res.status(201).json({
      success: true,
      message: 'Announcement broadcast created successfully.',
      announcement: populated,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error creating announcement' });
  }
};

// @desc    List all announcements for admin management
// @route   GET /api/admin/announcements
// @access  Private (Admin only)
const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate('createdBy', 'name email')
      .populate('questId', 'name')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      announcements,
      count: announcements.length,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message || 'Server error fetching announcements' });
  }
};

// @desc    Delete an announcement
// @route   DELETE /api/admin/announcements/:id
// @access  Private (Admin only)
const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Announcement removed successfully.',
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error deleting announcement' });
  }
};

module.exports = {
  createAnnouncement,
  getAnnouncements,
  deleteAnnouncement,
};
