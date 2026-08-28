const mongoose = require('mongoose');

const generateUniqueCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
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
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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

module.exports = mongoose.model('Team', teamSchema);
