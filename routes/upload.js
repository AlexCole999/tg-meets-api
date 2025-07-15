require('dotenv').config(); // 👈 вот это в самом верху
const express = require('express');
const multer = require('multer');
const router = express.Router();
const bot = require('../bot');

const { ListObjectsV2Command } = require('@aws-sdk/client-s3');
const s3 = require('../utils/s3'); // твой файл с конфигом

const upload = multer({ storage: multer.memoryStorage() });

router.post('/uploadPhoto', upload.single('photo'), async (req, res) => {
  try {
    console.log('📝 Поля формы:', req.body);
    console.log('📦 Файл:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });
    // если нужно посмотреть весь буфер
    // console.log('Буфер файла:', req.file.buffer);

    res.json({ status: '✅ Файл получен', info: req.file });
  } catch (err) {
    console.error('❌ Ошибка при получении файла:', err);
    res.status(500).send('❌ Не удалось получить файл');
  }
});

module.exports = router;