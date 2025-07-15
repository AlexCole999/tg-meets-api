require('dotenv').config(); // 👈 вот это в самом верху
const express = require('express');
const router = express.Router();
const bot = require('../bot');

const { ListObjectsV2Command } = require('@aws-sdk/client-s3');
const s3 = require('../utils/s3'); // твой файл с конфигом

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

router.get('/test-s3', async (req, res) => {
  try {
    const data = await s3.send(new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET
    }));
    res.json({ status: 'ok', objects: data.Contents });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка доступа к S3', details: err.message });
  }
});

module.exports = router;
