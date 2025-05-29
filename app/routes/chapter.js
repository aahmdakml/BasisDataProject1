// app/routes/chapter.js
const express = require('express');
const router = express.Router();
const chapterController = require('../controllers/chapterController');

// Dummy endpoint sementara
router.get('/', chapterController.getAllChapters);

router.post('/', chapterController.createChapter);

module.exports = router;
