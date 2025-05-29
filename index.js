const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

dotenv.config();

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

console.log('1')
// Import routes
const authRoutes = require('./app/routes/auth');
const assessmentRoutes = require('./app/routes/assessment');
const chapterRoutes = require('./app/routes/chapter.js');
const assessmentDetailRoutes = require('./app/routes/assessmentDetail');
const parameterRoutes = require('./app/routes/parameter');
const aspectRoutes = require('./app/routes/aspect');
const subAspectRoutes = require('./app/routes/subAspect');
const resultRoutes = require('./app/routes/result');
const scoreCategoryRoutes = require('./app/routes/scoreCategory');

console.log('2')

// Log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Assessment System API',
    version: '1.0.0'
  });
});

console.log('3')

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/assessmentDetails', assessmentDetailRoutes);
app.use('/api/parameters', parameterRoutes);
app.use('/api/aspects', aspectRoutes);
app.use('/api/subaspects', subAspectRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/score-categories', scoreCategoryRoutes);

console.log('4')

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// console.log('4')

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Resource not found'
  });
});

const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;