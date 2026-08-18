const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const { protect, requireRole } = require('../middleware/authMiddleware');

// @route   GET /api/examinations
// @desc    Get all examinations (optionally filtered by subject_id)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { subject_id } = req.query;

    let query = supabase
      .from('examinations')
      .select(`
        *,
        subjects (subject_name, subject_code, semester)
      `)
      .order('exam_date', { ascending: false });

    if (subject_id) {
      query = query.eq('subject_id', subject_id);
    }

    const { data: exams, error } = await query;
    if (error) throw error;

    res.json(exams);
  } catch (err) {
    console.error('Error fetching examinations:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// @route   POST /api/examinations
// @desc    Create an examination
// @access  Private (Admin & Faculty)
router.post('/', protect, requireRole(['ADMIN', 'FACULTY']), async (req, res) => {
  const { subject_id, exam_name, max_marks, exam_date, exam_type } = req.body;

  if (!subject_id || !exam_name || !max_marks || !exam_type) {
    return res.status(400).json({ message: 'Subject, exam name, max marks, and exam type are required.' });
  }

  try {
    const { data: exam, error } = await supabase
      .from('examinations')
      .insert([
        {
          subject_id: parseInt(subject_id),
          exam_name,
          max_marks: parseInt(max_marks),
          exam_date: exam_date || null,
          exam_type
        }
      ])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(exam);
  } catch (err) {
    console.error('Error creating examination:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// @route   PUT /api/examinations/:id
// @desc    Update an examination
// @access  Private (Admin & Faculty)
router.put('/:id', protect, requireRole(['ADMIN', 'FACULTY']), async (req, res) => {
  const { exam_name, max_marks, exam_date, exam_type } = req.body;

  try {
    const { data: exam, error } = await supabase
      .from('examinations')
      .update({
        exam_name,
        max_marks: max_marks ? parseInt(max_marks) : undefined,
        exam_date: exam_date || null,
        exam_type,
        updated_at: new Date()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(exam);
  } catch (err) {
    console.error('Error updating examination:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// @route   DELETE /api/examinations/:id
// @desc    Delete an examination
// @access  Private (Admin & Faculty)
router.delete('/:id', protect, requireRole(['ADMIN', 'FACULTY']), async (req, res) => {
  try {
    const { error } = await supabase
      .from('examinations')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Examination deleted successfully' });
  } catch (err) {
    console.error('Error deleting examination:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

module.exports = router;
