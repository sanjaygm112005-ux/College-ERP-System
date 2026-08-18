const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const { protect, requireRole } = require('../middleware/authMiddleware');

// @route   GET /api/subjects
// @desc    Get all subjects with filters
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { department_id, semester, faculty_id } = req.query;

    let query = supabase
      .from('subjects')
      .select(`
        *,
        departments (name, code),
        faculty (
          id,
          faculty_id_code,
          designation,
          profiles:profiles!faculty_id_fkey (
            full_name
          )
        )
      `)
      .order('subject_name', { ascending: true });

    if (department_id) {
      query = query.eq('department_id', department_id);
    }
    if (semester) {
      query = query.eq('semester', semester);
    }
    if (faculty_id) {
      query = query.eq('faculty_id', faculty_id);
    }

    const { data: subjects, error } = await query;
    if (error) throw error;

    // Standardize naming
    const formatted = subjects.map(sub => ({
      id: sub.id,
      subject_code: sub.subject_code,
      subject_name: sub.subject_name,
      department_id: sub.department_id,
      department_name: sub.departments?.name,
      department_code: sub.departments?.code,
      semester: sub.semester,
      credits: sub.credits,
      faculty_id: sub.faculty_id,
      faculty_name: sub.faculty?.profiles?.full_name || 'Unassigned',
      faculty_id_code: sub.faculty?.faculty_id_code || ''
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching subjects:', err);
    res.status(500).json({ message: err.message || 'Server error fetching subjects' });
  }
});

// @route   GET /api/subjects/:id
// @desc    Get subject details
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const { data: sub, error } = await supabase
      .from('subjects')
      .select(`
        *,
        departments (name, code),
        faculty (
          id,
          faculty_id_code,
          profiles:profiles!faculty_id_fkey (
            full_name
          )
        )
      `)
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!sub) return res.status(404).json({ message: 'Subject not found' });

    const formatted = {
      id: sub.id,
      subject_code: sub.subject_code,
      subject_name: sub.subject_name,
      department_id: sub.department_id,
      department_name: sub.departments?.name,
      department_code: sub.departments?.code,
      semester: sub.semester,
      credits: sub.credits,
      faculty_id: sub.faculty_id,
      faculty_name: sub.faculty?.profiles?.full_name || 'Unassigned',
      faculty_id_code: sub.faculty?.faculty_id_code || ''
    };

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching subject:', err);
    res.status(500).json({ message: err.message || 'Server error fetching subject' });
  }
});

// @route   POST /api/subjects
// @desc    Create a subject
// @access  Private (Admin only)
router.post('/', protect, requireRole(['ADMIN']), async (req, res) => {
  const { subject_code, subject_name, department_id, semester, credits, faculty_id } = req.body;

  if (!subject_code || !subject_name || !department_id || !semester) {
    return res.status(400).json({ message: 'Subject code, name, department and semester are required.' });
  }

  try {
    const { data: subject, error } = await supabase
      .from('subjects')
      .insert([
        {
          subject_code,
          subject_name,
          department_id: parseInt(department_id),
          semester: parseInt(semester),
          credits: parseInt(credits) || 3,
          faculty_id: faculty_id || null
        }
      ])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ message: 'Subject code already exists.' });
      }
      throw error;
    }

    res.status(201).json(subject);
  } catch (err) {
    console.error('Error creating subject:', err);
    res.status(500).json({ message: err.message || 'Server error creating subject' });
  }
});

// @route   PUT /api/subjects/:id
// @desc    Update a subject
// @access  Private (Admin only)
router.put('/:id', protect, requireRole(['ADMIN']), async (req, res) => {
  const { subject_code, subject_name, department_id, semester, credits, faculty_id } = req.body;

  if (!subject_code || !subject_name || !department_id || !semester) {
    return res.status(400).json({ message: 'Subject code, name, department and semester are required.' });
  }

  try {
    const { data: subject, error } = await supabase
      .from('subjects')
      .update({
        subject_code,
        subject_name,
        department_id: parseInt(department_id),
        semester: parseInt(semester),
        credits: parseInt(credits) || 3,
        faculty_id: faculty_id || null,
        updated_at: new Date()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ message: 'Subject code already exists.' });
      }
      throw error;
    }

    res.json(subject);
  } catch (err) {
    console.error('Error updating subject:', err);
    res.status(500).json({ message: err.message || 'Server error updating subject' });
  }
});

// @route   DELETE /api/subjects/:id
// @desc    Delete a subject
// @access  Private (Admin only)
router.delete('/:id', protect, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Subject deleted successfully' });
  } catch (err) {
    console.error('Error deleting subject:', err);
    res.status(500).json({ message: err.message || 'Server error deleting subject' });
  }
});

module.exports = router;
