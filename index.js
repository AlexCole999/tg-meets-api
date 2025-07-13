const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const bot = require('./bot');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = 3000;

// 📦 Подключение к MongoDB
mongoose.connect('mongodb://localhost:27017/tg_meets')
  .then(() => console.log('📦 MongoDB подключена'))
  .catch(err => console.error('❌ MongoDB ошибка:', err));

const userRoutes = require('./routes/user');

app.use(userRoutes);

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
