const express = require('express');
const router = express.Router();
const User = require('../models/User');
const SingleMeet = require('../models/SingleMeet');
const bot = require('../bot'); // 👈 твой telegraf-бот, импортируй как надо

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

router.post('/single/myCreatedMeets', async (req, res) => {
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

router.post('/single/accept', async (req, res) => {
  const { meetId, telegramId } = req.body;

  if (!meetId || !telegramId) {
    return res.status(400).json({ error: '⛔ Нужны meetId и telegramId' });
  }

  try {
    const meet = await SingleMeet.findById(meetId);
    if (!meet) {
      return res.json({ error: '⛔ Встреча не найдена' });
    }

    // если встреча уже закрыта/отменена
    if (meet.status !== 'open') {
      return res.json({ error: '⛔ Встреча уже закрыта или отменена' });
    }

    // обновляем статусы кандидатов
    meet.candidates = meet.candidates.map(c => ({
      ...c.toObject(),
      status: c.telegramId === String(telegramId) ? 'accepted' : 'rejected'
    }));

    // ставим принятого кандидата и закрываем встречу
    meet.acceptedCandidate = telegramId;
    meet.status = 'closed';

    await meet.save();

    // уведомляем принятого
    try {
      await bot.telegram.sendMessage(
        telegramId,
        `✅ Вас приняли на встречу!\n📍 ${meet.location}\n📅 ${new Date(meet.time).toLocaleString()}`
      );
    } catch (err) {
      console.error('⚠️ Ошибка отправки уведомления принятому:', err.message);
      // сообщение не отправилось, но база уже обновлена – это ок
    }

    res.json({ status: '✅ Принят' });
  } catch (err) {
    console.error('❌ Ошибка при принятии кандидата:', err);
    res.status(500).json({ error: '❌ Ошибка сервера' });
  }
});

router.post('/single/reject', async (req, res) => {
  const { meetId, telegramId } = req.body;

  if (!meetId || !telegramId) {
    return res.status(400).json({ error: '⛔ Нужны meetId и telegramId' });
  }

  try {
    const meet = await SingleMeet.findById(meetId);
    if (!meet) {
      return res.json({ error: '⛔ Встреча не найдена' });
    }

    // если встреча уже закрыта/отменена
    if (meet.status !== 'open') {
      return res.json({ error: '⛔ Встреча уже закрыта или отменена' });
    }

    // обновляем статус только для одного кандидата
    meet.candidates = meet.candidates.map(c =>
      c.telegramId === String(telegramId)
        ? { ...c.toObject(), status: 'rejected' }
        : c.toObject()
    );

    await meet.save();

    // уведомляем отклонённого
    try {
      await bot.telegram.sendMessage(
        telegramId,
        `❌ Ваша заявка на встречу\n📍 ${meet.location}\n📅 ${new Date(meet.time).toLocaleString()}\nбыла отклонена.`
      );
    } catch (err) {
      console.error('⚠️ Ошибка отправки уведомления отклонённому:', err.message);
      // даже если сообщение не ушло, данные в базе уже обновлены
    }

    res.json({ status: '✅ Отклонён' });
  } catch (err) {
    console.error('❌ Ошибка при отклонении кандидата:', err);
    res.status(500).json({ error: '❌ Ошибка сервера' });
  }
});

router.post('/single/myAcceptedMeets', async (req, res) => {
  const { telegramId } = req.body;

  if (!telegramId) {
    return res.status(400).json({ error: '⛔ Нужен telegramId' });
  }

  try {
    // Ищем встречи, где этот пользователь принят
    const meets = await SingleMeet.find({
      acceptedCandidate: telegramId
    }).sort({ time: 1 });

    res.json({ meetings: meets });
  } catch (err) {
    console.error('❌ Ошибка получения принятых встреч:', err);
    res.status(500).json({ error: '❌ Ошибка сервера' });
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