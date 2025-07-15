require('dotenv').config(); // 👈 вот это в самом верху
const express = require('express');
const multer = require('multer');
const router = express.Router();
const bot = require('../bot');

const path = require('path');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const s3 = require('../utils/s3'); // твой файл с конфигом

// Загружаем в память
const upload = multer({ storage: multer.memoryStorage() });

router.post('/uploadPhoto', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '⛔ Файл не передан' });
    }

    // генерируем уникальное имя
    const ext = req.file.originalname.split('.').pop();
    const filename = `photos/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    // отправляем в S3
    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: filename,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
        ACL: 'public-read',
      })
    );

    // формируем публичный URL
    const url = `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${filename}`;

    console.log('✅ Загружено в S3:', url);
    res.json({ status: '✅ Загружено', url });
  } catch (err) {
    console.error('❌ Ошибка при загрузке в S3:', err);
    res.status(500).json({ error: '❌ Ошибка при загрузке файла' });
  }
});

module.exports = router;