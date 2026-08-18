const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const { protect, requireRole } = require('../middleware/authMiddleware');

// @route   GET /api/attendance/students
// @desc    Get students with their marked attendance (if any) for a specific class, subject and date
// @access  Private (Admin and Faculty)
router.get('/students', protect, requireRole(['ADMIN', 'FACULTY']), async (req, res) => {
  const { department_id, semester, section, subject_id, date } = req.query;

  if (!department_id || !semester || !section || !subject_id || !date) {
    return res.status(400).json({ message: 'Missing required query parameters: department_id, semester, section, subject_id, date' });
  }

  try {
    // 1. Get all students enrolled/belonging to this class
    const { data: students, error: studentError } = await supabase
      .from('students')
      .select(`
        id,
        student_id_code,
        profiles:profiles!students_id_fkey (
          full_name,
          email
        )
      `)
      .eq('department_id', department_id)
      .eq('semester', semester)
      .eq('section', section);

    if (studentError) throw studentError;

    // 2. Fetch existing attendance for this date and subject
    const { data: attendance, error: attError } = await supabase
      .from('attendance')
      .select('student_id, status, remarks')
      .eq('subject_id', subject_id)
      .eq('date', date);

    if (attError) throw attError;

    // Map attendance status to student list
    const attendanceMap = {};
    attendance.forEach(att => {
      attendanceMap[att.student_id] = { status: att.status, remarks: att.remarks };
    });

    const result = students.map(st => ({
      id: st.id,
      student_id_code: st.student_id_code,
      name: st.profiles?.full_name,
      email: st.profiles?.email,
      status: attendanceMap[st.id]?.status || '',
      remarks: attendanceMap[st.id]?.remarks || ''
    }));

    res.json(result);
  } catch (err) {
    console.error('Error fetching students for attendance:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// @route   POST /api/attendance
// @desc    Mark or update attendance (bulk upsert)
// @access  Private (Admin and Faculty)
router.post('/', protect, requireRole(['ADMIN', 'FACULTY']), async (req, res) => {
  const { subject_id, date, semester, section, records } = req.body;
  const faculty_id = req.user.role === 'FACULTY' ? req.user.id : null;

  if (!subject_id || !date || !semester || !section || !records || !Array.isArray(records)) {
    return res.status(400).json({ message: 'Missing required body fields: subject_id, date, semester, section, records' });
  }

  try {
    // Format upsert payload
    const upsertData = records.map(rec => ({
      student_id: rec.student_id,
      subject_id: parseInt(subject_id),
      date,
      status: rec.status,
      marked_by: faculty_id,
      semester: parseInt(semester),
      section,
      remarks: rec.remarks || ''
    }));

    const { data, error } = await supabase
      .from('attendance')
      .upsert(upsertData, { onConflict: 'student_id,subject_id,date' })
      .select();

    if (error) throw error;

    res.json({ message: 'Attendance recorded successfully', count: data.length });
  } catch (err) {
    console.error('Error saving attendance:', err);
    res.status(500).json({ message: err.message || 'Server error saving attendance' });
  }
});

// @route   GET /api/attendance/student/:id
// @desc    Get attendance metrics and history for a student
// @access  Private (Admin, Faculty, and the Student themselves)
router.get('/student/:id', protect, async (req, res) => {
  const studentId = req.params.id;

  // Enforce security: student can only view their own page unless they are Admin/Faculty
  if (req.user.role === 'STUDENT' && req.user.id !== studentId) {
    return res.status(403).json({ message: 'Forbidden: You can only access your own attendance' });
  }

  try {
    // 1. Fetch detailed history
    const { data: history, error: historyError } = await supabase
      .from('attendance')
      .select(`
        id,
        date,
        status,
        remarks,
        subjects (subject_name, subject_code, credits)
      `)
      .eq('student_id', studentId)
      .order('date', { ascending: false });

    if (historyError) throw historyError;

    // 2. Fetch subject-wise summary
    const summaryMap = {};
    history.forEach(att => {
      const subId = att.subjects?.subject_code || 'Other';
      const subName = att.subjects?.subject_name || 'Other';

      if (!summaryMap[subId]) {
        summaryMap[subId] = {
          subject_code: subId,
          subject_name: subName,
          total: 0,
          present: 0,
          absent: 0
        };
      }

      summaryMap[subId].total += 1;
      if (att.status === 'PRESENT') {
        summaryMap[subId].present += 1;
      } else {
        summaryMap[subId].absent += 1;
      }
    });

    const summaryList = Object.values(summaryMap).map(sub => ({
      ...sub,
      percentage: sub.total > 0 ? parseFloat(((sub.present / sub.total) * 100).toFixed(1)) : 0
    }));

    // Overall Calculation
    const totalClasses = history.length;
    const presentClasses = history.filter(h => h.status === 'PRESENT').length;
    const absentClasses = totalClasses - presentClasses;
    const overallPercentage = totalClasses > 0 ? parseFloat(((presentClasses / totalClasses) * 100).toFixed(1)) : 0;

    res.json({
      overall: {
        totalClasses,
        present: presentClasses,
        absent: absentClasses,
        percentage: overallPercentage
      },
      subjectWise: summaryList,
      history: history.map(h => ({
        id: h.id,
        date: h.date,
        status: h.status,
        remarks: h.remarks,
        subject_name: h.subjects?.subject_name,
        subject_code: h.subjects?.subject_code
      }))
    });
  } catch (err) {
    console.error('Error fetching student attendance summary:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// @route   GET /api/attendance/stats
// @desc    Get overall class attendance stats
// @access  Private (Admin & Faculty)
router.get('/stats', protect, requireRole(['ADMIN', 'FACULTY']), async (req, res) => {
  const { subject_id, department_id, semester, section } = req.query;

  try {
    let query = supabase
      .from('attendance')
      .select(`
        id,
        status,
        student_id,
        students (
          student_id_code,
          profiles:profiles!students_id_fkey (full_name)
        )
      `);

    if (subject_id) query = query.eq('subject_id', subject_id);
    if (semester) query = query.eq('semester', semester);
    if (section) query = query.eq('section', section);

    const { data: attendance, error } = await query;
    if (error) throw error;

    // Process summary stats by student
    const studentStats = {};
    attendance.forEach(att => {
      const stId = att.student_id;
      const stCode = att.students?.student_id_code || 'N/A';
      const stName = att.students?.profiles?.full_name || 'N/A';

      if (!studentStats[stId]) {
        studentStats[stId] = {
          student_id: stId,
          student_id_code: stCode,
          name: stName,
          total: 0,
          present: 0,
          absent: 0
        };
      }

      studentStats[stId].total += 1;
      if (att.status === 'PRESENT') {
        studentStats[stId].present += 1;
      } else {
        studentStats[stId].absent += 1;
      }
    });

    const report = Object.values(studentStats).map(st => ({
      ...st,
      percentage: st.total > 0 ? parseFloat(((st.present / st.total) * 100).toFixed(1)) : 0
    }));

    res.json(report);
  } catch (err) {
    console.error('Error compiling attendance report:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

module.exports = router;
