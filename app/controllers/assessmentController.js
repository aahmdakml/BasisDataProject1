// app/controllers/assessmentController.js
const db = require('../config/db');

const assessmentController = {
  getAllAssessments: async (req, res) => {
    try {
      // console.log('a')
      const result = await db.query('SELECT * FROM assessment');
      // console.log('b')
      res.status(200).json({ success: true, data: result.rows });
    } catch (err) {

      res.status(500).json({ success: false, message: 'Error fetching assessments', error: err.message });
    }
  },

  createAssessment: async (req, res) => {
    const { chapter_id, assessment_date, assessor_name, status, notes } = req.body;
    try {
      const insertQuery = `
        INSERT INTO assessment (chapter_id, assessment_date, assessor_name, status, notes)
        VALUES ($1, $2, $3, $4, $5) RETURNING *
      `;
      const values = [chapter_id, assessment_date, assessor_name, status || 'PENDING', notes || null];
      const result = await db.query(insertQuery, values);

      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error creating assessment', error: err.message });
    }
  },

  calculateAssessmentScore: async (req, res) => {
    const assessmentId = req.params.id;
    try {
      // Run the same query as in "update_assessment" prepared statement
      await db.query(`
        UPDATE assessment
        SET 
          total_score = (
            SELECT 90 - SUM(error_count)
            FROM assessment_detail
            WHERE assessment_id = $1
          ),
          predicate = (
            SELECT category_name 
            FROM score_category sc
            WHERE (90 - (SELECT SUM(error_count) FROM assessment_detail WHERE assessment_id = $1))
              BETWEEN sc.min_score AND sc.max_score
            LIMIT 1
          ),
          status = (
            CASE 
              WHEN (90 - (SELECT SUM(error_count) FROM assessment_detail WHERE assessment_id = $1)) >= 65
              THEN 'LANJUT'
              ELSE 'ULANG'
            END
          )
        WHERE assessment_id = $1
      `, [assessmentId]);

      res.status(200).json({ success: true, message: 'Assessment score calculated' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error calculating score', error: err.message });
    }
  },

  getAssessmentById: async (req, res) => {
    const assessmentId = req.params.id;
    try {
      const result = await db.query('SELECT * FROM assessment WHERE assessment_id = $1', [assessmentId]);
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Assessment not found' });
      }
      res.status(200).json({ success: true, data: result.rows[0] });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error retrieving assessment', error: err.message });
    }
  }
};

module.exports = assessmentController;
