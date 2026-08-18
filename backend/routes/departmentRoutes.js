const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const { protect, requireRole } = require('../middleware/authMiddleware');

// @route   GET /api/departments
// @desc    Get all departments
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { data: departments, error } = await supabase
      .from('departments')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    res.json(departments);
  } catch (err) {
    console.error('Error fetching departments:', err);
    res.status(500).json({ message: err.message || 'Server error fetching departments' });
  }
});

// @route   GET /api/departments/:id
// @desc    Get department by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const { data: department, error } = await supabase
      .from('departments')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!department) return res.status(404).json({ message: 'Department not found' });
    res.json(department);
  } catch (err) {
    console.error('Error fetching department details:', err);
    res.status(500).json({ message: err.message || 'Server error fetching department' });
  }
});

// @route   POST /api/departments
// @desc    Create a new department
// @access  Private (Admin only)
router.post('/', protect, requireRole(['ADMIN']), async (req, res) => {
  const { name, code, description } = req.body;
  if (!name || !code) {
    return res.status(400).json({ message: 'Please provide department name and code' });
  }

  try {
    const { data: department, error } = await supabase
      .from('departments')
      .insert([{ name, code, description }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ message: 'Department name or code already exists' });
      }
      throw error;
    }

    res.status(201).json(department);
  } catch (err) {
    console.error('Error creating department:', err);
    res.status(500).json({ message: err.message || 'Server error creating department' });
  }
});

// @route   PUT /api/departments/:id
// @desc    Update a department
// @access  Private (Admin only)
router.put('/:id', protect, requireRole(['ADMIN']), async (req, res) => {
  const { name, code, description } = req.body;
  if (!name || !code) {
    return res.status(400).json({ message: 'Please provide department name and code' });
  }

  try {
    const { data: department, error } = await supabase
      .from('departments')
      .update({ name, code, description, updated_at: new Date() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ message: 'Department name or code already exists' });
      }
      throw error;
    }

    res.json(department);
  } catch (err) {
    console.error('Error updating department:', err);
    res.status(500).json({ message: err.message || 'Server error updating department' });
  }
});

// @route   DELETE /api/departments/:id
// @desc    Delete a department
// @access  Private (Admin only)
router.delete('/:id', protect, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Department deleted successfully' });
  } catch (err) {
    console.error('Error deleting department:', err);
    res.status(500).json({ message: err.message || 'Server error deleting department' });
  }
});

module.exports = router;
