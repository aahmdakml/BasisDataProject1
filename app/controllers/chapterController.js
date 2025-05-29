// app/controllers/chapterController.js
const db = require('../config/db');

const chapterController = {
  createChapter: async (req, res) => {
    const { chapter_name, weight } = req.body;

    if (!chapter_name || !weight) {
      return res.status(400).json({ success: false, message: 'chapter_name dan weight wajib diisi' });
    }

    try {
      const result = await db.query(
        'INSERT INTO chapter (chapter_name, weight) VALUES ($1, $2) RETURNING *',
        [chapter_name, weight]
      );
      res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Gagal menambahkan chapter', error: err.message });
    }
  },

  getAllChapters: async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM chapter ORDER BY chapter_id');
      res.status(200).json({
        success: true,
        data: result.rows
      });
    } catch (err) {
      console.error('Error getting chapters:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to get chapters',
        error: err.message
      });
    }
  }
};

module.exports = chapterController;