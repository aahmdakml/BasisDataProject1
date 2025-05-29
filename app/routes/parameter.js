// app/routes/parameter.js
const express = require('express');
const router = express.Router();
const parameterController = require('../controllers/parameterController');

// GET semua parameter
router.get('/', parameterController.getAllParameters);

// POST tambah parameter baru
router.post('/', parameterController.createParameter);

module.exports = router;
