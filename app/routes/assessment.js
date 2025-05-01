const express = require('express');
const router = express.Router();
const assessmentController = require('../controllers/assessmentController');
const { verifyToken, isAdminOrAssessor } = require('../middlewares/authVerifier');

// All routes require authentication
router.use(verifyToken);
router.use(isAdminOrAssessor);

// Assessment routes
router.get('/', assessmentController.getAllAssessments);
router.get('/:id', assessmentController.getAssessmentById);
router.post('/', assessmentController.createAssessment);
router.put('/:id', assessmentController.updateAssessment);
router.delete('/:id', assessmentController.deleteAssessment);

// Supporting data routes
router.get('/data/chapters', assessmentController.getAllChapters);
router.get('/data/parameters', assessmentController.getAllParameters);

module.exports = router;