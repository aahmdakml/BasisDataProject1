// app/controllers/parameterController.js
const db = require('../config/db');

const parameterController = {
  getAllParameters: async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM assessment_parameter ORDER BY parameter_id');
      res.status(200).json({ success: true, data: result.rows });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error fetching parameters', error: err.message });
    }
  },

  createParameter: async (req, res) => {
    const { parameter_name } = req.body;
    try {
      const result = await db.query(
        'INSERT INTO assessment_parameter (parameter_name) VALUES ($1) RETURNING *',
        [parameter_name]
      );
      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error creating parameter', error: err.message });
    }
  }
};

module.exports = parameterController;
