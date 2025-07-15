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
const utilsRoutes = require('./routes/utils');
const singleMeetRoutes = require('./routes/singleMeet');
const manyMeetRoutes = require('./routes/manyMeet');
const uploadRoutes = require('./routes/upload');

app.use(manyMeetRoutes);
app.use(userRoutes);
app.use(utilsRoutes);
app.use(singleMeetRoutes);
app.use(uploadRoutes);

// ▶️ Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер слушает порт ${PORT}`);
});
