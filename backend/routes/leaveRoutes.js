const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const { protect, requireRole } = require('../middleware/authMiddleware');

// @route   GET /api/leave
// @desc    Get leave requests (Faculty can see their department, Admin sees all)
// @access  Private (Admin & Faculty)
router.get('/', protect, requireRole(['ADMIN', 'FACULTY']), async (req, res) => {
  try {
    let query = supabase
      .from('leave_requests')
      .select(`
        *,
        students (
          student_id_code,
          department_id,
          departments (name, code),
          profiles:profiles!students_id_fkey (
            full_name,
            email
          )
        )
      `)
      .order('created_at', { ascending: false });

    const { data: requests, error } = await query;
    if (error) throw error;

    let filtered = requests || [];

    // If role is faculty, only show requests from students in the faculty's department
    if (req.user.role === 'FACULTY') {
      // Find faculty's department
      const { data: fac } = await supabase
        .from('faculty')
        .select('department_id')
        .eq('id', req.user.id)
        .single();

      if (fac && fac.department_id) {
        filtered = filtered.filter(req => req.students?.department_id === fac.department_id);
      }
    }

    const formatted = filtered.map(r => ({
      id: r.id,
      student_id: r.student_id,
      student_name: r.students?.profiles?.full_name,
      student_id_code: r.students?.student_id_code,
      department_name: r.students?.departments?.name,
      start_date: r.start_date,
      end_date: r.end_date,
      reason: r.reason,
      status: r.status,
      approved_by: r.approved_by,
      remarks: r.remarks,
      created_at: r.created_at
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching leave requests:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// @route   GET /api/leave/student/:id
// @desc    Get leave requests for a student
// @access  Private (Admin, Faculty, Student themselves)
router.get('/student/:id', protect, async (req, res) => {
  const studentId = req.params.id;

  if (req.user.role === 'STUDENT' && req.user.id !== studentId) {
    return res.status(403).json({ message: 'Forbidden: Access restricted to own leave requests.' });
  }

  try {
    const { data: requests, error } = await supabase
      .from('leave_requests')
      .select(`
        *,
        faculty:approved_by (
          profiles:profiles!faculty_id_fkey (
            full_name
          )
        )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = requests.map(r => ({
      id: r.id,
      start_date: r.start_date,
      end_date: r.end_date,
      reason: r.reason,
      status: r.status,
      remarks: r.remarks,
      approved_by_name: r.faculty?.profiles?.full_name || '',
      created_at: r.created_at
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching student leave requests:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// @route   POST /api/leave
// @desc    Apply for leave
// @access  Private (Student only)
router.post('/', protect, requireRole(['STUDENT']), async (req, res) => {
  const { start_date, end_date, reason } = req.body;

  if (!start_date || !end_date || !reason) {
    return res.status(400).json({ message: 'Start date, end date, and reason are required.' });
  }

  try {
    const { data: request, error } = await supabase
      .from('leave_requests')
      .insert([
        {
          student_id: req.user.id,
          start_date,
          end_date,
          reason,
          status: 'PENDING'
        }
      ])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(request);
  } catch (err) {
    console.error('Error applying for leave:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// @route   PUT /api/leave/:id
// @desc    Approve or Reject leave request
// @access  Private (Admin & Faculty)
router.put('/:id', protect, requireRole(['ADMIN', 'FACULTY']), async (req, res) => {
  const { status, remarks } = req.body;

  if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ message: 'Status must be APPROVED or REJECTED.' });
  }

  try {
    const facultyId = req.user.role === 'FACULTY' ? req.user.id : null;

    const { data: request, error } = await supabase
      .from('leave_requests')
      .update({
        status,
        remarks: remarks || '',
        approved_by: facultyId,
        updated_at: new Date()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(request);
  } catch (err) {
    console.error('Error updating leave request:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// @route   DELETE /api/leave/:id
// @desc    Delete leave request
// @access  Private (Admin & Student themselves if pending)
router.delete('/:id', protect, async (req, res) => {
  try {
    // If student, verify ownership and pending status
    if (req.user.role === 'STUDENT') {
      const { data: reqData } = await supabase.from('leave_requests').select('student_id, status').eq('id', req.params.id).single();
      if (!reqData || reqData.student_id !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden: Access restricted.' });
      }
      if (reqData.status !== 'PENDING') {
        return res.status(400).json({ message: 'Cannot delete leave requests that are already approved or rejected.' });
      }
    }

    const { error } = await supabase
      .from('leave_requests')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Leave request deleted successfully' });
  } catch (err) {
    console.error('Error deleting leave request:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

module.exports = router;
