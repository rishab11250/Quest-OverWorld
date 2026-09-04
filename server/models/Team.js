const mongoose = require('mongoose');

const generateUniqueCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ1234567890';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a team name'],
      trim: true,
      maxlength: [50, 'Team name cannot exceed 50 characters'],
    },
    code: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
    },
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    viceCaptains: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    pendingRequests: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        requestedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    questId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quest',
      default: null,
    },
    score: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'banned', 'disbanded'],
      default: 'active',
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    bannedAt: {
      type: Date,
      default: null,
    },
    banReason: {
      type: String,
      default: '',
      trim: true,
    },
    isDisbanded: {
      type: Boolean,
      default: false,
    },
    disbandedAt: {
      type: Date,
      default: null,
    },
    disbandReason: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to generate unique 6-character code if not provided
teamSchema.pre('validate', async function (next) {
  if (!this.code) {
    let unique = false;
    while (!unique) {
      const generatedCode = generateUniqueCode();
      const existing = await mongoose.models.Team.findOne({ code: generatedCode });
      if (!existing) {
        this.code = generatedCode;
        unique = true;
      }
    }
  }
  next();
});

teamSchema.index({ members: 1 });
teamSchema.index({ score: -1 });

module.exports = mongoose.model('Team', teamSchema);
