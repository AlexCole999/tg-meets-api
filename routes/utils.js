const express = require('express');
const router = express.Router();
const bot = require('../bot');

router.post('/log', async (req, res) => {
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

module.exports = router;
