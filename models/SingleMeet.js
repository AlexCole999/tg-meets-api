const mongoose = require('mongoose');

const singleMeetSchema = new mongoose.Schema({
  creator: {
    type: String, // Telegram ID создателя
    required: true,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'any'],
    required: true, // кого ищут
  },
  candidates: [
    {
      telegramId: String,
      status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending',
      },
    }
  ],
  acceptedCandidate: {
    type: String, // Telegram ID кого приняли
    default: null,
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'cancelled'],
    default: 'open',
  },
  time: {
    type: Date,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  minAge: {
    type: Number,
    default: null,
  },
  maxAge: {
    type: Number,
    default: null,
  },
  minWeight: {
    type: Number,
    default: null,
  },
  maxWeight: {
    type: Number,
    default: null,
  },
}, { timestamps: true });

module.exports = mongoose.model('SingleMeet', singleMeetSchema);
