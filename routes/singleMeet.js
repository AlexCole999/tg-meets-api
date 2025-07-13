const express = require('express');
const router = express.Router();
const SingleMeet = require('../models/SingleMeet');

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
    return res.status(400).send('⛔ Требуются telegramId, time и location');
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
