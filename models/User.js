const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  telegramId: { type: String, unique: true },
  name: String,
  gender: {
    type: String,
    enum: ['male', 'female', null, undefined], // 👈 только эти два значения допустимы
    default: undefined, // 👈 по умолчанию не задано
  },
  age: Number,
  height: Number,
  weight: Number,
  city: String,
  photos: [String],
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);