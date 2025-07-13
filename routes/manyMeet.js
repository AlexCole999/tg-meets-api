const express = require('express');
const router = express.Router();
const ManyMeet = require('../models/ManyMeet');
const User = require('../models/User');
const bot = require('../bot');

// ✅ /many/create
router.post('/many/create', async (req, res) => {
  const {
    telegramId,
    gender,
    time,
    location,
    minAge,
    maxAge,
    maxParticipants,
  } = req.body;

  if (!telegramId || !time || !location || !maxParticipants || maxParticipants < 2) {
    return res.json({ error: '⛔ Требуются telegramId, time, location и min 2 участника' });
  }

  try {
    const meet = await ManyMeet.create({
      creator: telegramId,
      gender,
      time,
      location,
      minAge,
      maxAge,
      maxParticipants,
    });

    res.json({ status: '✅ Встреча создана', meet });
  } catch (err) {
    console.error('❌ Ошибка при создании встречи:', err);
    res.status(500).send('❌ Ошибка сервера');
  }
});

// ✅ /many/apply
router.post('/many/apply', async (req, res) => {
  const { meetingId, telegramId } = req.body;

  if (!meetingId || !telegramId) {
    return res.json({ error: '⛔ Нужны meetingId и telegramId' });
  }

  try {
    const meet = await ManyMeet.findById(meetingId);
    if (!meet) return res.json({ error: '⛔ Встреча не найдена' });

    if (String(meet.creator) === String(telegramId)) {
      return res.json({ error: '⛔ Нельзя откликнуться на свою встречу' });
    }

    const alreadyCandidate = meet.candidates.some(
      (c) => String(c.telegramId) === String(telegramId)
    );
    if (alreadyCandidate) {
      return res.json({ error: '⛔ Вы уже откликнулись на эту встречу' });
    }

    const acceptedCount = meet.candidates.filter(c => c.status === 'accepted').length;
    if (acceptedCount >= meet.maxParticipants) {
      return res.json({ error: '⛔ Встреча уже заполнена' });
    }

    meet.candidates.push({ telegramId: String(telegramId), status: 'pending' });
    await meet.save();

    const user = await User.findOne({ telegramId });
    const name = user?.name || 'Без имени';

    await bot.telegram.sendMessage(
      meet.creator,
      `👤 ${name} (${telegramId}) хочет участвовать во встрече (много участников)\n📍 ${meet.location}\n📅 ${new Date(meet.time).toLocaleString()}`
    );

    res.json({ status: '✅ Заявка отправлена' });
  } catch (err) {
    console.error('❌ Ошибка отправки заявки:', err);
    res.json({ error: '❌ Не удалось отправить сообщение' });
  }
});

// ✅ /many/accept
router.post('/many/accept', async (req, res) => {
  const { meetId, telegramId } = req.body;

  try {
    const meet = await ManyMeet.findById(meetId);
    if (!meet) return res.json({ error: '⛔ Встреча не найдена' });

    const acceptedCount = meet.candidates.filter(c => c.status === 'accepted').length;
    if (acceptedCount >= meet.maxParticipants) {
      return res.json({ error: '⛔ Мест больше нет' });
    }

    await bot.telegram.sendMessage(
      telegramId,
      `✅ Ваша заявка на групповую встречу\n📍 ${meet.location}\n📅 ${new Date(meet.time).toLocaleString()}\nпринята.`
    );

    res.json({ status: '✅ Принят' });
  } catch (e) {
    console.error('❌ Ошибка при принятии:', e);
    res.json({ error: '❌ Не удалось отправить сообщение' });
  }
});

// ✅ /many/reject
router.post('/many/reject', async (req, res) => {
  const { meetId, telegramId } = req.body;

  try {
    const meet = await ManyMeet.findById(meetId);
    if (!meet) return res.json({ error: '⛔ Встреча не найдена' });

    await bot.telegram.sendMessage(
      telegramId,
      `❌ Ваша заявка на групповую встречу\n📍 ${meet.location}\n📅 ${new Date(meet.time).toLocaleString()}\nбыла отклонена.`
    );

    res.json({ status: '✅ Отклонён' });
  } catch (e) {
    console.error('❌ Ошибка при отклонении:', e);
    res.json({ error: '❌ Не удалось отправить сообщение' });
  }
});

// ✅ /many/delete
router.post('/many/delete', async (req, res) => {
  const { meetingId } = req.body;

  if (!meetingId) return res.json({ error: '⛔ Не указан meetingId' });

  try {
    await ManyMeet.findByIdAndDelete(meetingId);
    res.json({ status: '✅ Удалено' });
  } catch (err) {
    console.error('Ошибка удаления встречи:', err);
    res.json({ error: '❌ Ошибка при удалении' });
  }
});

// ✅ /many/mine
router.post('/many/mine', async (req, res) => {
  const { telegramId } = req.body;

  try {
    const meets = await ManyMeet.find({ creator: telegramId });

    const allCandidateIds = meets.flatMap(m =>
      m.candidates
        .filter(c => c.status !== 'rejected')
        .map(c => c.telegramId)
    );

    const uniqueIds = [...new Set(allCandidateIds)];
    const users = await User.find({ telegramId: { $in: uniqueIds } });
    const userMap = Object.fromEntries(users.map(u => [u.telegramId, u.toObject()]));

    const result = meets.map(m => {
      const visibleCandidates = m.candidates
        .filter(c => c.status !== 'rejected')
        .map(c => ({
          ...c.toObject(),
          ...userMap[c.telegramId],
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

// ✅ /many/all
router.get('/many/all', async (req, res) => {
  try {
    const meets = await ManyMeet.find({ status: 'open' }).sort({ time: 1 });
    res.json(meets);
  } catch (err) {
    console.error('❌ Ошибка получения встреч:', err);
    res.status(500).send('❌ Ошибка сервера');
  }
});

module.exports = router;
