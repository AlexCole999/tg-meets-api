const fs = require('fs');
const https = require('https');
const express = require('express');
const bodyParser = require('body-parser');
const { Telegraf } = require('telegraf');

const app = express();
app.use(bodyParser.json());

const BOT_TOKEN = '7702489050:AAFDRtksr4mjA0C6_GQVM2qP0NtcuS57qAw';
const PORT = 3050;

let bot;

try {
  // Инициализация бота
  bot = new Telegraf(BOT_TOKEN);

  bot.start((ctx) => {
    const user = ctx.from;

    ctx.reply('Открой мини-приложение:', {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Открыть TG Meets',
              web_app: {
                url: 'https://tg-meets-frontapp.vercel.app/',
              },
            },
          ],
        ],
      },
    });

    ctx.reply(`🧾 Информация о пользователе:
ID: ${user.id}
Username: @${user.username || 'нет'}
Имя: ${user.first_name || 'нет'}
Фамилия: ${user.last_name || 'нет'}
Язык: ${user.language_code || 'не указан'}
`);
    console.log('📲 /start от:', user);
  });

  bot.launch().then(() => {
    console.log('✅ Бот запущен');
  }).catch((err) => {
    console.error('❌ Ошибка запуска бота:', err);
  });

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
} catch (err) {
  console.error('❌ Ошибка инициализации бота:', err);
}

// GET-запрос для логирования и отправки
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

// Настройка HTTPS
const sslOptions = {
  key: fs.readFileSync('./ssl/key.pem'),
  cert: fs.readFileSync('./ssl/cert.pem'),
};

// Запуск HTTPS сервера
https.createServer(sslOptions, app).listen(PORT, () => {
  console.log(`🚀 HTTPS сервер слушает на порту ${PORT}`);
});
