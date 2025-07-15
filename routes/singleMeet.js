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
//     const { gender, minAge, maxAge } = req.query;

//     const query = { status: 'open' };

//     // фильтр по полу
//     if (gender && gender !== 'any') {
//       query.gender = { $in: [gender, 'any'] };
//     }

//     // фильтр по возрасту: пересечение диапазонов
//     if (minAge) {
//       query.maxAge = { $gte: Number(minAge) };
//     }
//     if (maxAge) {
//       query.minAge = { $lte: Number(maxAge) };
//     }

//     console.log('📥 Фильтр:', query);

//     const meets = await SingleMeet.find(query).sort({ time: 1 });

//     const creatorIds = meets.map(m => m.creator);
//     const creators = await User.find({ telegramId: { $in: creatorIds } });
//     const creatorMap = Object.fromEntries(creators.map(u => [u.telegramId, u.toObject()]));

//     const result = meets.map(m => ({
//       ...m.toObject(),
//       creatorProfile: creatorMap[m.creator] || null,
//     }));

//     res.json(result);
//   } catch (err) {
//     console.error('❌ Ошибка поиска встреч:', err);
//     res.status(500).json({ error: '❌ Ошибка сервера' });
//   }
// });

router.get('/single/all', async (req, res) => {
  try {
    const { gender, minAge, maxAge } = req.query;

    const query = { status: 'open' };

    // ✅ фильтр по полу
    if (gender && gender !== 'any') {
      query.gender = { $in: [gender, 'any'] };
    }

    // ✅ фильтр по возрасту
    // если передан только minAge – ищем встречи, где верхняя граница >= minAge или границы нет
    if (minAge) {
      query.$or = [
        { maxAge: null },
        { maxAge: { $gte: Number(minAge) } }
      ];
    }

    // если передан только maxAge – ищем встречи, где нижняя граница <= maxAge или границы нет
    if (maxAge) {
      // если уже есть $or от minAge – надо совместить через $and
      if (query.$or) {
        query.$and = [
          { $or: query.$or },
          {
            $or: [
              { minAge: null },
              { minAge: { $lte: Number(maxAge) } }
            ]
          }
        ];
        delete query.$or; // убираем $or на верхнем уровне
      } else {
        query.$or = [
          { minAge: null },
          { minAge: { $lte: Number(maxAge) } }
        ];
      }
    }

    console.log('📥 Итоговый фильтр:', JSON.stringify(query, null, 2));

    const meets = await SingleMeet.find(query).sort({ time: 1 });

    // 👤 подгружаем профили создателей
    const creatorIds = meets.map(m => m.creator);
    const creators = await User.find({ telegramId: { $in: creatorIds } });
    const creatorMap = Object.fromEntries(creators.map(u => [u.telegramId, u.toObject()]));

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
