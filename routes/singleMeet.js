const express = require('express');
const router = express.Router();
const SingleMeet = require('../models/SingleMeet');
const User = require('../models/User');
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

    if (String(meet.creator) === String(telegramId)) {
      return res.json({ error: '⛔ Нельзя откликнуться на свою встречу' });
    }

    const alreadyCandidate = meet.candidates.some(
      (c) => String(c.telegramId) === String(telegramId)
    );

    if (alreadyCandidate) {
      return res.json({ error: '⛔ Вы уже откликнулись на эту встречу' });
    }

    // Добавляем в кандидаты
    meet.candidates.push({
      telegramId: String(telegramId),
      status: 'pending',
    });

    await meet.save();

    const user = await User.findOne({ telegramId });
    const name = user?.name || 'Без имени';

    await bot.telegram.sendMessage(
      meet.creator,
      `👤 ${name} (${telegramId}) хочет участвовать во встрече\n📍 ${meet.location}\n📅 ${new Date(meet.time).toLocaleString()}`
    );

    res.json({ status: '✅ Заявка отправлена' });
  } catch (err) {
    console.error('❌ Ошибка отправки сообщения:', err);
    res.json({ error: '❌ Не удалось отправить сообщение' });
  }
});

// router.get('/single/all', async (req, res) => {
//   try {
//     const meets = await SingleMeet.find({ status: 'open' }).sort({ time: 1 });

//     // соберём все creatorId
//     const creatorIds = meets.map(m => m.creator);
//     const uniqueCreatorIds = [...new Set(creatorIds)];

//     // получаем профили создателей
//     const creators = await User.find({ telegramId: { $in: uniqueCreatorIds } });
//     const creatorMap = Object.fromEntries(creators.map(u => [u.telegramId, u.toObject()]));

//     // добавляем creatorProfile в каждый объект встречи
//     const result = meets.map(m => {
//       const meetObj = m.toObject();
//       return {
//         ...meetObj,
//         creatorProfile: creatorMap[meetObj.creator] || null,
//       };
//     });

//     res.json(result);
//   } catch (err) {
//     console.error('❌ Ошибка получения встреч:', err);
//     res.status(500).json({ error: '❌ Ошибка сервера' });
//   }
// });

router.get('/single/all', async (req, res) => {
  try {
    const { gender, minAge, maxAge } = req.query;

    // Базовый фильтр
    let query = { status: 'open' };

    // Фильтр по полу
    if (gender && gender !== 'any') {
      query.gender = gender;
    }

    // Фильтры по возрасту через $and
    const andConditions = [];

    if (minAge) {
      andConditions.push({
        $or: [
          { minAge: null },
          { minAge: { $gte: Number(minAge) } }
        ]
      });
    }

    if (maxAge) {
      andConditions.push({
        $or: [
          { maxAge: null },
          { maxAge: { $lte: Number(maxAge) } }
        ]
      });
    }

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    console.log('📥 Фильтры для поиска встреч:', JSON.stringify(query, null, 2));

    // Ищем встречи
    const meets = await SingleMeet.find(query).sort({ time: 1 });

    // Собираем всех создателей
    const creatorIds = meets.map(m => m.creator);
    const creators = await User.find({ telegramId: { $in: creatorIds } });
    const creatorMap = Object.fromEntries(creators.map(u => [u.telegramId, u.toObject()]));

    // Добавляем creatorProfile
    const result = meets.map(m => ({
      ...m.toObject(),
      creatorProfile: creatorMap[m.creator] || null,
    }));

    res.json(result);
  } catch (err) {
    console.error('❌ Ошибка поиска встреч:', err);
    res.status(500).json({ error: '❌ Ошибка сервера' });
  }
});


module.exports = router;
