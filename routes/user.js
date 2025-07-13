const express = require('express');
const router = express.Router();
const User = require('../models/User');
const SingleMeet = require('../models/SingleMeet');

// 🔐 /auth — регистрация или получение пользователя
router.post('/auth', async (req, res) => {
  const { telegramId, gender, age, height, weight, city, photos } = req.body;

  if (!telegramId) return res.status(400).send('⛔ Не передан telegramId');

  try {
    let user = await User.findOne({ telegramId });
    let status;

    if (!user) {
      user = await User.create({
        telegramId,
        gender: gender || '',
        age: age || 0,
        height: height || 0,
        weight: weight || 0,
        city: city || '',
        photos: Array.isArray(photos) ? photos.slice(0, 3) : [null, null, null],
      });
      status = 'добавлен';
    } else {
      status = 'загружен';
    }

    res.json({ user, status });
  } catch (err) {
    console.error('❌ /auth ошибка:', err);
    res.status(500).send('❌ Сервер сломался');
  }
});

// ✏️ /profileEdit — редактирование профиля
router.post('/profileEdit', async (req, res) => {
  const { telegramId, ...updateFields } = req.body;

  if (!telegramId) return res.status(400).send('⛔ Не передан telegramId');

  try {
    const updatedUser = await User.findOneAndUpdate(
      { telegramId },
      { $set: updateFields },
      { new: true }
    );

    if (!updatedUser) return res.status(404).send('❌ Пользователь не найден');

    res.json({ status: 'обновлён', user: updatedUser });
  } catch (err) {
    console.error('❌ /profileEdit ошибка:', err);
    res.status(500).send('❌ Ошибка сервера');
  }
});

// router.post('/single/mine', async (req, res) => {
//   const { telegramId } = req.body;

//   if (!telegramId) {
//     return res.json({ error: '⛔ Нужен telegramId' });
//   }

//   try {
//     const meetings = await SingleMeet.find({ creator: telegramId }).sort({ time: 1 });
//     console.log(meetings)
//     res.json({ meetings });
//   } catch (err) {
//     console.error('❌ Ошибка получения встреч:', err);
//     res.json({ error: '❌ Не удалось получить встречи' });
//   }
// });

router.post('/single/mine', async (req, res) => {
  const { telegramId } = req.body;

  try {
    const meets = await SingleMeet.find({ creator: telegramId });

    // Сбор всех telegramId (кроме отклонённых)
    const allCandidateIds = meets.flatMap(m =>
      m.candidates
        .filter(c => c.status !== 'rejected') // ❗️ вот фильтрация
        .map(c => c.telegramId)
    );

    const uniqueIds = [...new Set(allCandidateIds)];
    const users = await User.find({ telegramId: { $in: uniqueIds } });

    const userMap = Object.fromEntries(users.map(u => [u.telegramId, u.toObject()]));

    const result = meets.map(m => {
      const visibleCandidates = m.candidates
        .filter(c => c.status !== 'rejected') // 🔁 фильтруем тут тоже
        .map(c => ({
          ...c.toObject(),
          ...userMap[c.telegramId], // может быть undefined — это ок
        }));

      return {
        ...m.toObject(),
        candidateProfiles: visibleCandidates,
      };
    });

    res.json({ meetings: result });
  } catch (err) {
    console.error('❌ Ошибка получения встреч:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post('/single/delete', async (req, res) => {
  const { meetingId } = req.body;

  if (!meetingId) return res.json({ error: '⛔ Не указан meetingId' });

  try {
    await SingleMeet.findByIdAndDelete(meetingId);
    res.json({ status: '✅ Удалено' });
  } catch (err) {
    console.error('Ошибка удаления встречи:', err);
    res.json({ error: '❌ Ошибка при удалении' });
  }
});


module.exports = router;