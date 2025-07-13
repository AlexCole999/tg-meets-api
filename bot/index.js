const { Telegraf } = require('telegraf');

const BOT_TOKEN = '7702489050:AAFDRtksr4mjA0C6_GQVM2qP0NtcuS57qAw';
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

module.exports = bot;
