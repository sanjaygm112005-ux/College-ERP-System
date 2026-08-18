const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const { protect, requireRole } = require('../middleware/authMiddleware');

// @route   GET /api/fees
// @desc    Get fee records with optional filters
// @access  Private (Admin only)
router.get('/', protect, requireRole(['ADMIN']), async (req, res) => {
  const { status, student_id } = req.query;

  try {
    let query = supabase
      .from('fees')
      .select(`
        *,
        students (
          student_id_code,
          profiles:profiles!students_id_fkey (
            full_name
          )
        )
      `)
      .order('due_date', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }
    if (student_id) {
      query = query.eq('student_id', student_id);
    }

    const { data: fees, error } = await query;
    if (error) throw error;

    const formatted = fees.map(f => ({
      id: f.id,
      student_id: f.student_id,
      student_id_code: f.students?.student_id_code,
      student_name: f.students?.profiles?.full_name,
      total_amount: parseFloat(f.total_amount),
      paid_amount: parseFloat(f.paid_amount),
      status: f.status,
      due_date: f.due_date,
      description: f.description,
      semester: f.semester,
      created_at: f.created_at
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching fees:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// @route   GET /api/fees/student/:id
// @desc    Get fee records for a specific student
// @access  Private (Admin, Student themselves)
router.get('/student/:id', protect, async (req, res) => {
  const studentId = req.params.id;

  if (req.user.role === 'STUDENT' && req.user.id !== studentId) {
    return res.status(403).json({ message: 'Forbidden: Access restricted to own fee records.' });
  }

  try {
    const { data: fees, error } = await supabase
      .from('fees')
      .select('*')
      .eq('student_id', studentId)
      .order('due_date', { ascending: true });

    if (error) throw error;
    res.json(fees);
  } catch (err) {
    console.error('Error fetching student fees:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// @route   POST /api/fees
// @desc    Add a fee record
// @access  Private (Admin only)
router.post('/', protect, requireRole(['ADMIN']), async (req, res) => {
  const { student_id, total_amount, paid_amount, status, due_date, description, semester } = req.body;

  if (!student_id || !total_amount || !due_date || !description || !semester) {
    return res.status(400).json({ message: 'Student ID, Total Amount, Due Date, Semester, and Description are required.' });
  }

  try {
    const total = parseFloat(total_amount);
    const paid = parseFloat(paid_amount) || 0;
    
    // Automatically set status based on paid amount if not provided
    let computedStatus = status;
    if (!computedStatus) {
      if (paid >= total) computedStatus = 'PAID';
      else if (paid > 0) computedStatus = 'PARTIAL';
      else computedStatus = 'PENDING';
    }

    const { data: fee, error } = await supabase
      .from('fees')
      .insert([
        {
          student_id,
          total_amount: total,
          paid_amount: paid,
          status: computedStatus,
          due_date,
          description,
          semester: parseInt(semester)
        }
      ])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(fee);
  } catch (err) {
    console.error('Error creating fee record:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// @route   PUT /api/fees/:id
// @desc    Update a fee record
// @access  Private (Admin only)
router.put('/:id', protect, requireRole(['ADMIN']), async (req, res) => {
  const { total_amount, paid_amount, status, due_date, description, semester } = req.body;

  try {
    const updates = {};
    if (total_amount !== undefined) updates.total_amount = parseFloat(total_amount);
    if (paid_amount !== undefined) updates.paid_amount = parseFloat(paid_amount);
    if (due_date) updates.due_date = due_date;
    if (description) updates.description = description;
    if (semester) updates.semester = parseInt(semester);
    
    // Compute status automatically if amounts are specified
    if (updates.total_amount !== undefined || updates.paid_amount !== undefined) {
      const { data: currentFee } = await supabase.from('fees').select('total_amount, paid_amount').eq('id', req.params.id).single();
      const finalTotal = updates.total_amount !== undefined ? updates.total_amount : parseFloat(currentFee.total_amount);
      const finalPaid = updates.paid_amount !== undefined ? updates.paid_amount : parseFloat(currentFee.paid_amount);

      if (finalPaid >= finalTotal) updates.status = 'PAID';
      else if (finalPaid > 0) updates.status = 'PARTIAL';
      else updates.status = 'PENDING';
    } else if (status) {
      updates.status = status;
    }

    updates.updated_at = new Date();

    const { data: fee, error } = await supabase
      .from('fees')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(fee);
  } catch (err) {
    console.error('Error updating fee record:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// @route   DELETE /api/fees/:id
// @desc    Delete a fee record
// @access  Private (Admin only)
router.delete('/:id', protect, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { error } = await supabase
      .from('fees')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Fee record deleted successfully' });
  } catch (err) {
    console.error('Error deleting fee record:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

module.exports = router;
