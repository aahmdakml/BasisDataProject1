// app/routes/assessment.js
const express = require('express');
const router = express.Router();
const assessmentController = require('../controllers/assessmentController');

// GET semua assessment
router.get('/', assessmentController.getAllAssessments);

// POST assessment baru
router.post('/', assessmentController.createAssessment);

// PUT hitung skor & update status
router.put('/:id/calculate', assessmentController.calculateAssessmentScore);

// GET hasil satu assessment (final view)
router.get('/:id', assessmentController.getAssessmentById);

module.exports = router;
