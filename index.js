const fs = require('fs');
const https = require('https');
const express = require('express');
const bodyParser = require('body-parser');
const { Telegraf } = require('telegraf');
const cors = require('cors');

const app = express();              // ⬅️ сначала создаём app
app.use(cors());                   // ⬅️ потом применяем CORS
app.use(bodyParser.json());

const BOT_TOKEN = '7702489050:AAFDRtksr4mjA0C6_GQVM2qP0NtcuS57qAw';
const PORT = 3000;

let bot;

try {
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

  bot.launch()
    .then(() => console.log('✅ Бот запущен'))
    .catch((err) => console.error('❌ Ошибка запуска бота:', err));

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));

} catch (err) {
  console.error('❌ Ошибка инициализации бота:', err);
}

// POST-запрос на /log
app.post('/log', async (req, res) => {
  console.log('📬 POST /log:', req.body);

  const { userId, message } = req.body;
  if (!userId || !message) {
    return res.status(400).send('⛔ Требуются userId и message');
  }

  try {
    await bot.telegram.sendMessage(userId, message);
    res.send('✅ Сообщение отправлено (POST)');
  } catch (err) {
    console.error('❌ Ошибка отправки (POST):', err);
    res.status(500).send('❌ Не удалось отправить сообщение');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 HTTP сервер слушает на порту ${PORT}`);
});
