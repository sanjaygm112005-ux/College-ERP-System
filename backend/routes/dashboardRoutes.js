const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const { protect, requireRole } = require('../middleware/authMiddleware');

// @route   GET /api/dashboard/admin
// @desc    Get Admin Dashboard Stats
// @access  Private (Admin only)
router.get('/admin', protect, requireRole(['ADMIN']), async (req, res) => {
  try {
    // 1. Fetch counts
    const { count: studentCount, error: stErr } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });

    const { count: facultyCount, error: facErr } = await supabase
      .from('faculty')
      .select('*', { count: 'exact', head: true });

    const { count: departmentCount, error: deptErr } = await supabase
      .from('departments')
      .select('*', { count: 'exact', head: true });

    const { count: subjectCount, error: subErr } = await supabase
      .from('subjects')
      .select('*', { count: 'exact', head: true });

    if (stErr || facErr || deptErr || subErr) {
      throw stErr || facErr || deptErr || subErr;
    }

    // 2. Fetch recent announcements
    const { data: recentAnnouncements } = await supabase
      .from('announcements')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(3);

    // 3. Fetch pending leave requests
    const { data: pendingLeaves } = await supabase
      .from('leave_requests')
      .select(`
        *,
        students(
          student_id_code,
          profiles:profiles!students_id_fkey(full_name)
        )
      `)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false })
      .limit(3);

    // 4. Fetch recent students
    const { data: recentStudents } = await supabase
      .from('students')
      .select(`
        id,
        student_id_code,
        created_at,
        profiles:profiles!students_id_fkey(full_name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    // 5. Fetch overall attendance rates
    const { data: attendance } = await supabase
      .from('attendance')
      .select('status');

    let totalAtt = 0;
    let presentAtt = 0;
    if (attendance) {
      totalAtt = attendance.length;
      presentAtt = attendance.filter(a => a.status === 'PRESENT').length;
    }
    const attendanceRate = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0;

    res.json({
      counts: {
        students: studentCount || 0,
        faculty: facultyCount || 0,
        departments: departmentCount || 0,
        subjects: subjectCount || 0
      },
      attendanceRate,
      recentAnnouncements: (recentAnnouncements || []).map(a => ({
        id: a.id,
        title: a.title,
        created_by: a.profiles?.full_name || 'Admin',
        created_at: a.created_at
      })),
      pendingLeaves: (pendingLeaves || []).map(l => ({
        id: l.id,
        student_name: l.students?.profiles?.full_name,
        student_id_code: l.students?.student_id_code,
        reason: l.reason,
        start_date: l.start_date,
        end_date: l.end_date
      })),
      recentStudents: (recentStudents || []).map(s => ({
        id: s.id,
        student_id_code: s.student_id_code,
        name: s.profiles?.full_name,
        email: s.profiles?.email
      }))
    });
  } catch (err) {
    console.error('Error fetching admin dashboard:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// @route   GET /api/dashboard/faculty
// @desc    Get Faculty Dashboard Stats
// @access  Private (Faculty only)
router.get('/faculty', protect, requireRole(['FACULTY']), async (req, res) => {
  const facultyId = req.user.id;

  try {
    // 1. Fetch assigned subjects
    const { data: subjects, error: subErr } = await supabase
      .from('subjects')
      .select('id, subject_name, subject_code, semester, department_id, departments(name)')
      .eq('faculty_id', facultyId);

    if (subErr) throw subErr;

    const assignedSubjectIds = subjects.map(s => s.id);

    // 2. Fetch total students in department
    // Let's get faculty's department first
    const { data: fac } = await supabase
      .from('faculty')
      .select('department_id')
      .eq('id', facultyId)
      .single();

    let studentCount = 0;
    if (fac && fac.department_id) {
      const { count } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('department_id', fac.department_id);
      studentCount = count || 0;
    }

    // 3. Fetch today's classes from timetable
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = days[new Date().getDay()];

    const { data: todayClasses } = await supabase
      .from('timetable')
      .select('*, subjects(subject_name, subject_code)')
      .eq('faculty_id', facultyId)
      .eq('day_of_week', todayName)
      .order('start_time', { ascending: true });

    // 4. Fetch pending leaves from students in their department
    let pendingLeaves = [];
    if (fac && fac.department_id) {
      const { data: leaves } = await supabase
        .from('leave_requests')
        .select(`
          *,
          students(
            student_id_code,
            department_id,
            profiles:profiles!students_id_fkey(full_name)
          )
        `)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false });

      if (leaves) {
        pendingLeaves = leaves.filter(l => l.students?.department_id === fac.department_id);
      }
    }

    // 5. Attendance Summary for assigned subjects
    let attendanceSummary = { total: 0, present: 0, percentage: 0 };
    if (assignedSubjectIds.length > 0) {
      const { data: att } = await supabase
        .from('attendance')
        .select('status')
        .in('subject_id', assignedSubjectIds);

      if (att && att.length > 0) {
        attendanceSummary.total = att.length;
        attendanceSummary.present = att.filter(a => a.status === 'PRESENT').length;
        attendanceSummary.percentage = Math.round((attendanceSummary.present / attendanceSummary.total) * 100);
      }
    }

    res.json({
      subjects: subjects.map(s => ({
        id: s.id,
        subject_name: s.subject_name,
        subject_code: s.subject_code,
        semester: s.semester,
        department_name: s.departments?.name
      })),
      totalStudents: studentCount,
      todayClasses: (todayClasses || []).map(c => ({
        id: c.id,
        subject_name: c.subjects?.subject_name,
        subject_code: c.subjects?.subject_code,
        start_time: c.start_time,
        end_time: c.end_time,
        classroom: c.classroom,
        section: c.section,
        semester: c.semester
      })),
      pendingLeaves: pendingLeaves.slice(0, 3).map(l => ({
        id: l.id,
        student_name: l.students?.profiles?.full_name,
        student_id_code: l.students?.student_id_code,
        reason: l.reason,
        start_date: l.start_date,
        end_date: l.end_date
      })),
      attendanceSummary
    });
  } catch (err) {
    console.error('Error fetching faculty dashboard:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// @route   GET /api/dashboard/student
// @desc    Get Student Dashboard Stats
// @access  Private (Student only)
router.get('/student', protect, requireRole(['STUDENT']), async (req, res) => {
  const studentId = req.user.id;

  try {
    // 1. Fetch student details to get semester and department
    const { data: student, error: stErr } = await supabase
      .from('students')
      .select('semester, department_id')
      .eq('id', studentId)
      .single();

    if (stErr || !student) throw stErr || new Error('Student not found');

    // 2. Fetch number of subjects in their semester and department
    const { count: subjectCount } = await supabase
      .from('subjects')
      .select('*', { count: 'exact', head: true })
      .eq('department_id', student.department_id)
      .eq('semester', student.semester);

    // 3. Fetch attendance overview
    const { data: attendance } = await supabase
      .from('attendance')
      .select('status')
      .eq('student_id', studentId);

    let totalClasses = 0;
    let presentClasses = 0;
    if (attendance) {
      totalClasses = attendance.length;
      presentClasses = attendance.filter(a => a.status === 'PRESENT').length;
    }
    const attendancePercentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;

    // 4. Fetch pending fees
    const { data: fees } = await supabase
      .from('fees')
      .select('*')
      .eq('student_id', studentId)
      .neq('status', 'PAID');

    const pendingFees = (fees || []).reduce((acc, current) => {
      const remaining = parseFloat(current.total_amount) - parseFloat(current.paid_amount);
      return acc + remaining;
    }, 0);

    // 5. Fetch recent marks
    const { data: marks } = await supabase
      .from('marks')
      .select(`
        total_marks,
        grade,
        result,
        examinations (
          exam_name,
          max_marks,
          subjects (subject_name, subject_code)
        )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(3);

    // 6. Fetch recent announcements
    const { data: recentAnnouncements } = await supabase
      .from('announcements')
      .select('*, profiles(full_name)')
      .in('target_role', ['ALL', 'STUDENT'])
      .order('created_at', { ascending: false })
      .limit(3);

    res.json({
      semester: student.semester,
      subjectCount: subjectCount || 0,
      attendance: {
        total: totalClasses,
        present: presentClasses,
        percentage: attendancePercentage
      },
      pendingFees,
      recentMarks: (marks || []).map(m => ({
        exam_name: m.examinations?.exam_name,
        subject_name: m.examinations?.subjects?.subject_name,
        subject_code: m.examinations?.subjects?.subject_code,
        score: parseFloat(m.total_marks),
        max: m.examinations?.max_marks,
        grade: m.grade,
        result: m.result
      })),
      recentAnnouncements: (recentAnnouncements || []).map(a => ({
        id: a.id,
        title: a.title,
        created_by: a.profiles?.full_name || 'Admin',
        created_at: a.created_at
      }))
    });
  } catch (err) {
    console.error('Error fetching student dashboard:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

module.exports = router;
