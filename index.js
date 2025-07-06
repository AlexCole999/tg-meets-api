const { Telegraf } = require('telegraf');
const express = require('express');
const bodyParser = require('body-parser');

// Токен бота
const bot = new Telegraf('7702489050:AAFDRtksr4mjA0C6_GQVM2qP0NtcuS57qAw');

// Express-сервер для приёма внешних событий
const app = express();
app.use(bodyParser.json());

// Команда /start
bot.start((ctx) => {
  const user = ctx.from;

  // Клавиатура с кнопкой открытия мини-приложения
  ctx.reply('Открой мини-приложение:', {
    reply_markup: {
      keyboard: [
        [
          {
            text: 'Открыть TG Meets',
            web_app: {
              url: 'https://tg-meets-frontapp.vercel.app/',
            },
          },
        ],
      ],
      resize_keyboard: true,
    },
  });

  // Информация о пользователе
  ctx.reply(`🧾 Информация о пользователе:
ID: ${user.id}
Username: @${user.username || 'нет'}
Имя: ${user.first_name || 'нет'}
Фамилия: ${user.last_name || 'нет'}
Язык: ${user.language_code || 'не указан'}
`);
});

// Эндпоинт для отправки сообщений пользователю
app.get('/log', async (req, res) => {
  console.log('🌐 GET /log:', req.query);

  const { userId, message } = req.query;
  if (!userId || !message) {
    return res.status(400).send('⛔ Требуются userId и message');
  }

  try {
    await bot.telegram.sendMessage(userId, message);
    res.send('✅ Сообщение отправлено (GET)');
  } catch (err) {
    console.error('❌ Ошибка отправки (GET):', err);
    res.status(500).send('❌ Не удалось отправить сообщение');
  }
});

// Запуск бота
bot.launch();

// Завершение по сигналам
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Запуск сервера
const PORT = 3050;
app.listen(PORT, () => {
  console.log(`🚀 Сервер слушает на порту ${PORT}`);
});
