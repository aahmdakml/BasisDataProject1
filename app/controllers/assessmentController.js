const db = require('../config/db');

/**
 * Get all assessments with filtering options
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllAssessments = async (req, res) => {
  try {
    const { chapter_id, status, start_date, end_date } = req.query;
    let query = `
      SELECT a.id, a.assessment_date, ch.name as chapter_name, 
             u.username as assessor_name, a.status, a.total_score, 
             a.predicate, a.notes
      FROM assessments a
      JOIN chapters ch ON a.chapter_id = ch.id
      JOIN users u ON a.assessor_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCounter = 1;
    
    // Apply filters if provided
    if (chapter_id) {
      query += ` AND a.chapter_id = $${paramCounter++}`;
      params.push(chapter_id);
    }
    
    if (status) {
      query += ` AND a.status = $${paramCounter++}`;
      params.push(status);
    }
    
    if (start_date && end_date) {
      query += ` AND a.assessment_date BETWEEN $${paramCounter++} AND $${paramCounter++}`;
      params.push(start_date, end_date);
    } else if (start_date) {
      query += ` AND a.assessment_date >= $${paramCounter++}`;
      params.push(start_date);
    } else if (end_date) {
      query += ` AND a.assessment_date <= $${paramCounter++}`;
      params.push(end_date);
    }
    
    // Only show assessments created by the current user if not admin
    if (req.user.role !== 'admin') {
      query += ` AND a.assessor_id = $${paramCounter++}`;
      params.push(req.user.id);
    }
    
    query += ` ORDER BY a.assessment_date DESC, ch.name`;
    
    const result = await db.query(query, params);
    
    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving assessments'
    });
  }
};

/**
 * Get assessment by ID with detailed breakdown
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAssessmentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get assessment header
    const headerQuery = `
      SELECT a.id, a.assessment_date, ch.id as chapter_id, ch.name as chapter_name, 
             u.username as assessor_name, a.status, a.total_score, a.predicate, a.notes
      FROM assessments a
      JOIN chapters ch ON a.chapter_id = ch.id
      JOIN users u ON a.assessor_id = u.id
      WHERE a.id = $1
    `;
    
    const headerResult = await db.query(headerQuery, [id]);
    
    if (headerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }
    
    // Check permission: only admin or the assessor who created it can access
    if (req.user.role !== 'admin' && headerResult.rows[0].assessor_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own assessments'
      });
    }
    
    // Get assessment details
    const detailsQuery = `
      SELECT 
        p.name as parameter_name,
        asp.name as aspect_name,
        sa.name as sub_aspect_name,
        ad.error_count,
        ad.id as detail_id
      FROM assessment_details ad
      JOIN sub_aspects sa ON ad.sub_aspect_id = sa.id
      JOIN aspects asp ON sa.aspect_id = asp.id
      JOIN parameters p ON asp.parameter_id = p.id
      WHERE ad.assessment_id = $1
      ORDER BY p.id, asp.id, sa.id
    `;
    
    const detailsResult = await db.query(detailsQuery, [id]);
    
    // Group details by parameter
    const detailsByParameter = {};
    detailsResult.rows.forEach(row => {
      if (!detailsByParameter[row.parameter_name]) {
        detailsByParameter[row.parameter_name] = {
          parameter_name: row.parameter_name,
          total_errors: 0,
          aspects: {}
        };
      }
      
      if (!detailsByParameter[row.parameter_name].aspects[row.aspect_name]) {
        detailsByParameter[row.parameter_name].aspects[row.aspect_name] = {
          aspect_name: row.aspect_name,
          sub_aspects: []
        };
      }
      
      detailsByParameter[row.parameter_name].aspects[row.aspect_name].sub_aspects.push({
        sub_aspect_name: row.sub_aspect_name,
        error_count: row.error_count,
        detail_id: row.detail_id
      });
      
      detailsByParameter[row.parameter_name].total_errors += row.error_count;
    });
    
    // Convert to array format for easier frontend processing
    const parameters = Object.values(detailsByParameter).map(parameter => {
      return {
        parameter_name: parameter.parameter_name,
        total_errors: parameter.total_errors,
        aspects: Object.values(parameter.aspects).map(aspect => {
          return {
            aspect_name: aspect.aspect_name,
            sub_aspects: aspect.sub_aspects
          };
        })
      };
    });
    
    res.status(200).json({
      success: true,
      data: {
        header: headerResult.rows[0],
        parameters
      }
    });
  } catch (error) {
    console.error('Error fetching assessment details:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving assessment details'
    });
  }
};

/**
 * Create a new assessment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createAssessment = async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { chapter_id, notes, details } = req.body;
    
    // Validate required fields
    if (!chapter_id || !details || !Array.isArray(details)) {
      return res.status(400).json({
        success: false,
        message: 'Chapter ID and assessment details are required'
      });
    }
    
    // Insert assessment header
    const assessmentQuery = `
      INSERT INTO assessments (
        chapter_id, assessor_id, assessment_date, status, notes
      ) VALUES ($1, $2, CURRENT_DATE, 'PENDING', $3)
      RETURNING id
    `;
    
    const assessmentResult = await client.query(assessmentQuery, [
      chapter_id, req.user.id, notes || ''
    ]);
    
    const assessmentId = assessmentResult.rows[0].id;
    
    // Insert assessment details
    for (const detail of details) {
      if (!detail.sub_aspect_id || detail.error_count === undefined) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Each assessment detail must contain sub_aspect_id and error_count'
        });
      }
      
      await client.query(
        'INSERT INTO assessment_details (assessment_id, sub_aspect_id, error_count) VALUES ($1, $2, $3)',
        [assessmentId, detail.sub_aspect_id, detail.error_count]
      );
    }
    
    // Calculate total errors and update assessment
    const totalErrorsQuery = `
      SELECT COALESCE(SUM(error_count), 0) as total_errors 
      FROM assessment_details 
      WHERE assessment_id = $1
    `;
    
    const totalErrorsResult = await client.query(totalErrorsQuery, [assessmentId]);
    const totalErrors = totalErrorsResult.rows[0].total_errors;
    const totalScore = 90 - totalErrors;
    
    // Get predicate based on score
    const predicateQuery = `
      SELECT category_name 
      FROM score_categories 
      WHERE $1 BETWEEN min_score AND max_score
    `;
    
    const predicateResult = await client.query(predicateQuery, [totalScore]);
    const predicate = predicateResult.rows.length > 0 ? predicateResult.rows[0].category_name : 'Tidak Dinilai';
    
    // Update status based on score
    const status = totalScore >= 65 ? 'LANJUT' : 'ULANG';
    
    // Update assessment with calculated values
    const updateQuery = `
      UPDATE assessments 
      SET total_score = $1, predicate = $2, status = $3 
      WHERE id = $4
      RETURNING id, assessment_date, total_score, predicate, status
    `;
    
    const updateResult = await client.query(updateQuery, [
      totalScore, predicate, status, assessmentId
    ]);
    
    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      message: 'Assessment created successfully',
      data: updateResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating assessment'
    });
  } finally {
    client.release();
  }
};

/**
 * Update an existing assessment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateAssessment = async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { chapter_id, notes, details } = req.body;
    
    // Check if assessment exists and get current assessor
    const checkQuery = `
      SELECT assessor_id, status 
      FROM assessments 
      WHERE id = $1
    `;
    
    const checkResult = await client.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }
    
    // Check permission: only admin or the assessor who created it can update
    if (req.user.role !== 'admin' && checkResult.rows[0].assessor_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own assessments'
      });
    }
    
    // Update assessment header if provided
    if (chapter_id || notes !== undefined) {
      const updateFields = [];
      const updateValues = [];
      let paramCounter = 1;
      
      if (chapter_id) {
        updateFields.push(`chapter_id = $${paramCounter++}`);
        updateValues.push(chapter_id);
      }
      
      if (notes !== undefined) {
        updateFields.push(`notes = $${paramCounter++}`);
        updateValues.push(notes);
      }
      
      // Add updated_at timestamp
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      
      if (updateFields.length > 0) {
        const updateHeaderQuery = `
          UPDATE assessments 
          SET ${updateFields.join(', ')} 
          WHERE id = $${paramCounter++}
        `;
        
        updateValues.push(id);
        await client.query(updateHeaderQuery, updateValues);
      }
    }
    
    // Update assessment details if provided
    if (details && Array.isArray(details)) {
      for (const detail of details) {
        if (!detail.detail_id || detail.error_count === undefined) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            success: false,
            message: 'Each assessment detail must contain detail_id and error_count'
          });
        }
        
        // Check if detail belongs to the assessment
        const checkDetailQuery = `
          SELECT ad.id 
          FROM assessment_details ad
          WHERE ad.id = $1 AND ad.assessment_id = $2
        `;
        
        const checkDetailResult = await client.query(checkDetailQuery, [detail.detail_id, id]);
        
        if (checkDetailResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            success: false,
            message: `Detail ID ${detail.detail_id} does not belong to assessment ${id}`
          });
        }
        
        // Update detail
        await client.query(
          'UPDATE assessment_details SET error_count = $1 WHERE id = $2',
          [detail.error_count, detail.detail_id]
        );
      }
      
      // Recalculate total errors and update assessment
      const totalErrorsQuery = `
        SELECT COALESCE(SUM(error_count), 0) as total_errors 
        FROM assessment_details 
        WHERE assessment_id = $1
      `;
      
      const totalErrorsResult = await client.query(totalErrorsQuery, [id]);
      const totalErrors = totalErrorsResult.rows[0].total_errors;
      const totalScore = 90 - totalErrors;
      
      // Get predicate based on score
      const predicateQuery = `
        SELECT category_name 
        FROM score_categories 
        WHERE $1 BETWEEN min_score AND max_score
      `;
      
      const predicateResult = await client.query(predicateQuery, [totalScore]);
      const predicate = predicateResult.rows.length > 0 ? predicateResult.rows[0].category_name : 'Tidak Dinilai';
      
      // Update status based on score
      const status = totalScore >= 65 ? 'LANJUT' : 'ULANG';
      
      // Update assessment with calculated values
      const updateQuery = `
        UPDATE assessments 
        SET total_score = $1, predicate = $2, status = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING id, assessment_date, total_score, predicate, status
      `;
      
      const updateResult = await client.query(updateQuery, [
        totalScore, predicate, status, id
      ]);
    }
    
    await client.query('COMMIT');
    
    res.status(200).json({
      success: true,
      message: 'Assessment updated successfully',
      data: { id: parseInt(id) }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating assessment'
    });
  } finally {
    client.release();
  }
};

/**
 * Delete an assessment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if assessment exists and get current assessor
    const checkQuery = `
      SELECT assessor_id 
      FROM assessments 
      WHERE id = $1
    `;
    
    const checkResult = await db.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }
    
    // Check permission: only admin or the assessor who created it can delete
    if (req.user.role !== 'admin' && checkResult.rows[0].assessor_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own assessments'
      });
    }
    
    // Delete assessment (will cascade delete details as per the schema)
    await db.query('DELETE FROM assessments WHERE id = $1', [id]);
    
    res.status(200).json({
      success: true,
      message: 'Assessment deleted successfully',
      data: { id: parseInt(id) }
    });
  } catch (error) {
    console.error('Error deleting assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting assessment'
    });
  }
};

/**
 * Get all chapters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllChapters = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, weight FROM chapters ORDER BY name'
    );
    
    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching chapters:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving chapters'
    });
  }
};

/**
 * Get all parameters with aspects and sub-aspects
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllParameters = async (req, res) => {
  try {
    const query = `
      SELECT 
        p.id as parameter_id, 
        p.name as parameter_name,
        a.id as aspect_id,
        a.name as aspect_name,
        sa.id as sub_aspect_id,
        sa.name as sub_aspect_name
      FROM parameters p
      LEFT JOIN aspects a ON p.id = a.parameter_id
      LEFT JOIN sub_aspects sa ON a.id = sa.aspect_id
      ORDER BY p.id, a.id, sa.id
    `;
    
    const result = await db.query(query);
    
    // Transform into hierarchical structure
    const parameters = [];
    const parameterMap = new Map();
    
    for (const row of result.rows) {
      // If we haven't seen this parameter yet, create it
      if (!parameterMap.has(row.parameter_id)) {
        const parameter = {
          id: row.parameter_id,
          name: row.parameter_name,
          aspects: []
        };
        parameters.push(parameter);
        parameterMap.set(row.parameter_id, parameter);
      }
      
      const parameter = parameterMap.get(row.parameter_id);
      
      // Skip if there's no aspect (empty join result)
      if (!row.aspect_id) continue;
      
      // Check if we've already added this aspect
      let aspect = parameter.aspects.find(a => a.id === row.aspect_id);
      
      if (!aspect) {
        aspect = {
          id: row.aspect_id,
          name: row.aspect_name,
          sub_aspects: []
        };
        parameter.aspects.push(aspect);
      }
      
      // Skip if there's no sub_aspect (empty join result)
      if (!row.sub_aspect_id) continue;
      
      // Add sub_aspect to aspect
      aspect.sub_aspects.push({
        id: row.sub_aspect_id,
        name: row.sub_aspect_name
      });
    }
    
    res.status(200).json({
      success: true,
      data: parameters
    });
  } catch (error) {
    console.error('Error fetching parameters:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving parameters'
    });
  }
};

module.exports = {
  getAllAssessments,
  getAssessmentById,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  getAllChapters,
  getAllParameters
};