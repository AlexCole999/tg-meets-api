const express = require('express');
const router = express.Router();
const SingleMeet = require('../models/SingleMeet');
const bot = require('../bot'); // 👈 твой telegraf-бот, импортируй как надо

router.post('/single/create', async (req, res) => {
  const {
    telegramId,
    gender,
    time,
    location,
    minAge,
    maxAge,
    minWeight,
    maxWeight,
  } = req.body;

  if (!telegramId || !time || !location) {
    return res.json({ error: '⛔ Требуются telegramId, time и location' });
  }

  const existingMeet = await SingleMeet.findOne({
    creator: telegramId,
    status: 'open',
  });

  if (existingMeet) {
    return res.json({ error: '⛔ У вас уже есть активная встреча' });
  }

  try {
    const meet = await SingleMeet.create({
      creator: telegramId,
      gender,
      time,
      location,
      minAge,
      maxAge,
      minWeight,
      maxWeight,
    });

    res.json({ status: '✅ Встреча создана', meet });
  } catch (err) {
    console.error('❌ Ошибка при создании встречи:', err);
    res.status(500).send('❌ Ошибка сервера');
  }
});

router.post('/single/apply', async (req, res) => {
  const { meetingId, telegramId } = req.body;

  if (!meetingId || !telegramId) {
    return res.json({ error: '⛔ Нужны meetingId и telegramId' });
  }

  try {
    const meet = await SingleMeet.findById(meetingId);
    if (!meet) {
      return res.json({ error: '⛔ Встреча не найдена' });
    }

    if (meet.creator === telegramId) {
      return res.json({ error: '⛔ Нельзя откликнуться на свою встречу' });
    }

    const user = await User.findOne({ telegramId });
    const name = user?.name || 'Неизвестный пользователь';

    await bot.telegram.sendMessage(
      meet.creator,
      `👤 ${name} (${telegramId}) хочет участвовать во встрече\n📍 ${meet.location}\n📅 ${new Date(meet.time).toLocaleString()}`
    );

    res.json({ status: '✅ Сообщение отправлено' });
  } catch (err) {
    console.error('❌ Ошибка отправки сообщения:', err);
    res.json({ error: '❌ Не удалось отправить сообщение' });
  }
});

router.get('/single/all', async (req, res) => {
  try {
    const meets = await SingleMeet.find({ status: 'open' }).sort({ time: 1 });
    res.json(meets);
  } catch (err) {
    console.error('❌ Ошибка получения встреч:', err);
    res.status(500).send('❌ Ошибка сервера');
  }
});

module.exports = router;
