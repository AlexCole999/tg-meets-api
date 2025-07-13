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

const userRoutes = require('./routes/user');

app.use(userRoutes);

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
