const crypto = require('crypto');
const QRCode = require('qrcode');
const Quest = require('../../models/Quest');
const Checkpoint = require('../../models/Checkpoint');

const getAllAdminCheckpoints = async (req, res) => {
  try {
    const query = {};
    if (req.query.questId) query.questId = req.query.questId;
    const checkpoints = await Checkpoint.find(query).sort({ order: 1 });
    return res.status(200).json({ checkpoints });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error fetching checkpoints' });
  }
};

const createCheckpoint = async (req, res) => {
  try {
    const { questId, title, clue, latitude, longitude, radius, points, order } = req.body;

    if (!questId || !title || !clue || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        message: 'Quest ID, title, clue, latitude, and longitude are required.',
      });
    }

    const quest = await Quest.findById(questId);
    if (!quest) return res.status(404).json({ message: 'Target Quest not found.' });

    let finalOrder = order;
    if (!finalOrder) {
      const count = await Checkpoint.countDocuments({ questId });
      finalOrder = count + 1;
    }

    const qrToken = `QR-CP-${finalOrder}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const checkpoint = await Checkpoint.create({
      questId,
      title,
      clue,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
      radius: radius || 50,
      qrCode: qrToken,
      points: points || 100,
      order: finalOrder,
    });

    await Quest.findByIdAndUpdate(questId, { $push: { checkpoints: checkpoint._id } });

    const qrImage = await QRCode.toDataURL(checkpoint.qrCode, {
      width: 400,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    });

    return res.status(201).json({
      success: true,
      checkpoint,
      qrImage,
      qrToken: checkpoint.qrCode,
      message: 'Checkpoint station beacon created with secure QR code!',
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error creating checkpoint' });
  }
};

const updateCheckpoint = async (req, res) => {
  try {
    const { title, clue, latitude, longitude, radius, points, order, qrCode, regenerateQr } =
      req.body;

    const updateData = {};
    if (title) updateData.title = title;
    if (clue) updateData.clue = clue;
    if (radius !== undefined) updateData.radius = radius;
    if (points !== undefined) updateData.points = points;
    if (order !== undefined) updateData.order = order;
    if (qrCode) updateData.qrCode = qrCode;

    if (latitude !== undefined && longitude !== undefined) {
      updateData.location = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      };
    }

    if (regenerateQr) {
      const current = await Checkpoint.findById(req.params.id);
      const cpOrder = order || current?.order || 1;
      updateData.qrCode = `QR-CP-${cpOrder}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    }

    const checkpoint = await Checkpoint.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });
    if (!checkpoint) return res.status(404).json({ message: 'Checkpoint not found' });

    let qrImage = null;
    if (checkpoint.qrCode) {
      qrImage = await QRCode.toDataURL(checkpoint.qrCode, {
        width: 400,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });
    }

    return res.status(200).json({
      success: true,
      checkpoint,
      qrImage,
      qrToken: checkpoint.qrCode,
      message: req.body.regenerateQr
        ? 'Checkpoint updated and new QR code generated.'
        : 'Checkpoint updated.',
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error updating checkpoint' });
  }
};

const getCheckpointQr = async (req, res) => {
  try {
    const checkpoint = await Checkpoint.findById(req.params.id);
    if (!checkpoint) return res.status(404).json({ message: 'Checkpoint not found' });

    const qrImage = await QRCode.toDataURL(checkpoint.qrCode, {
      width: 400,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    });

    return res.status(200).json({
      success: true,
      checkpoint: {
        _id: checkpoint._id,
        title: checkpoint.title,
        order: checkpoint.order,
        qrCode: checkpoint.qrCode,
      },
      qrImage,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error generating QR code' });
  }
};

const deleteCheckpoint = async (req, res) => {
  try {
    const checkpoint = await Checkpoint.findByIdAndDelete(req.params.id);
    if (!checkpoint) return res.status(404).json({ message: 'Checkpoint not found' });
    await Quest.findByIdAndUpdate(checkpoint.questId, { $pull: { checkpoints: checkpoint._id } });
    return res.status(200).json({ success: true, message: 'Checkpoint deleted.' });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server error deleting checkpoint' });
  }
};

module.exports = {
  getAllAdminCheckpoints,
  createCheckpoint,
  updateCheckpoint,
  getCheckpointQr,
  deleteCheckpoint,
};
