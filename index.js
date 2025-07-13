const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const { Telegraf } = require('telegraf');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const BOT_TOKEN = '7702489050:AAFDRtksr4mjA0C6_GQVM2qP0NtcuS57qAw';
const PORT = 3000;

// 📦 Подключение к MongoDB
mongoose.connect('mongodb://localhost:27017/tg_meets')
  .then(() => console.log('📦 MongoDB подключена'))
  .catch(err => console.error('❌ MongoDB ошибка:', err));

// 🧬 Схема пользователя
const userSchema = new mongoose.Schema({
  telegramId: { type: String, unique: true },
  gender: String,
  age: Number,
  height: Number,
  weight: Number,
  city: String,
  photos: [String],
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// 🤖 Telegraf
const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => {
  ctx.reply('Открой мини-приложение:', {
    reply_markup: {
      inline_keyboard: [[
        {
          text: 'Открыть TG Meets',
          web_app: { url: 'https://tg-meets-frontapp.vercel.app/' }
        }
      ]]
    }
  });
});

bot.launch()
  .then(() => console.log('✅ Бот запущен'))
  .catch(err => console.error('❌ Бот не запустился:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// 🔐 /auth — регистрация или получение пользователя
app.post('/auth', async (req, res) => {
  const { telegramId, gender, age, height, weight, city, photos } = req.body;

  if (!telegramId) {
    return res.status(400).send('⛔ Не передан telegramId');
  }

  try {
    let user = await User.findOne({ telegramId });

    let status;

    if (!user) {
      user = await User.create({
        telegramId,
        gender: gender || null,
        age: age || null,
        height: height || null,
        weight: weight || null,
        city: city || null,
        photos: Array.isArray(photos) ? photos.slice(0, 3) : [],
      });
      status = 'добавлен';
      console.log('🆕 Новый пользователь:', telegramId);
    } else {
      status = 'загружен';
      console.log('🔄 Уже есть пользователь:', telegramId);
    }

    res.json({ user, status });
  } catch (err) {
    console.error('❌ /auth ошибка:', err);
    res.status(500).send('❌ Сервер сломался');
  }
});

app.post('/profileEdit', async (req, res) => {

  console.log('🔄 Обновление профиля:', req.body);
  // if (!telegramId) {
  //   return res.status(400).send('⛔ Не передан telegramId');
  // }

  try {
    res.status(200).send('✅ Профиль обновляен');
    // let user = await User.findOne({ telegramId });

    // let status;

    // if (!user) {
    //   user = await User.create({
    //     telegramId,
    //     gender: gender || null,
    //     age: age || null,
    //     height: height || null,
    //     weight: weight || null,
    //     city: city || null,
    //     photos: Array.isArray(photos) ? photos.slice(0, 3) : [],
    //   });
    //   status = 'добавлен';
    //   console.log('🆕 Новый пользователь:', telegramId);
    // } else {
    //   status = 'загружен';
    //   console.log('🔄 Уже есть пользователь:', telegramId);
    // }

    // res.json({ user, status });
  } catch (err) {
    console.error('❌ /auth ошибка:', err);
    res.status(500).send('❌ Сервер сломался');
  }
});

// 📬 /log — отправка сообщения пользователю
app.post('/log', async (req, res) => {
  const { userId, message } = req.body;
  if (!userId || !message) {
    return res.status(400).send('⛔ userId и message обязательны');
  }

  try {
    await bot.telegram.sendMessage(userId, message);
    res.send('✅ Сообщение отправлено');
  } catch (err) {
    console.error('❌ Ошибка при отправке:', err);
    res.status(500).send('❌ Не удалось отправить');
  }
});

// ▶️ Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер слушает порт ${PORT}`);
});
