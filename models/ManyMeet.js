const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  telegramId: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
}, { _id: false });

const manyMeetSchema = new mongoose.Schema({
  creator: { type: String, required: true }, // Telegram ID создателя
  gender: {
    type: String,
    enum: ['male', 'female', 'any'], // Кого ищет
    required: true,
  },
  time: { type: Date, required: true },
  location: { type: String, required: true },

  minAge: Number,
  maxAge: Number,

  maxParticipants: {
    type: Number,
    required: true,
    min: 2,
  },

  candidates: {
    type: [candidateSchema],
    default: [],
  },

  status: {
    type: String,
    enum: ['open', 'closed', 'cancelled'],
    default: 'open',
  },
}, { timestamps: true });

module.exports = mongoose.model('ManyMeet', manyMeetSchema);
