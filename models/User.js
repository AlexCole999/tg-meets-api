const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  telegramId: { type: String, unique: true },
  name: String,
  gender: String,
  age: Number,
  height: Number,
  weight: Number,
  city: String,
  photos: [String],
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);