const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const { protect, requireRole } = require('../middleware/authMiddleware');

// Calculate grade and result based on score and max marks
const calculateGrade = (total, max) => {
  if (max <= 0) return { grade: 'F', result: 'FAIL' };
  const percentage = (total / max) * 100;
  let grade = 'F';
  let result = 'FAIL';

  if (percentage >= 90) grade = 'O';
  else if (percentage >= 80) grade = 'A+';
  else if (percentage >= 70) grade = 'A';
  else if (percentage >= 60) grade = 'B';
  else if (percentage >= 50) grade = 'C';
  else if (percentage >= 40) grade = 'P';

  if (grade !== 'F') result = 'PASS';

  return { grade, result };
};

// @route   GET /api/marks/exam/:examination_id
// @desc    Get marks of all eligible students for an exam
// @access  Private (Admin & Faculty)
router.get('/exam/:examination_id', protect, requireRole(['ADMIN', 'FACULTY']), async (req, res) => {
  const examId = req.params.examination_id;

  try {
    // 1. Get Exam Details to know department and semester
    const { data: exam, error: examError } = await supabase
      .from('examinations')
      .select('*, subjects(department_id, semester, subject_name)')
      .eq('id', examId)
      .single();

    if (examError || !exam) {
      return res.status(404).json({ message: 'Examination not found' });
    }

    const { department_id, semester } = exam.subjects;

    // 2. Fetch all students in the corresponding department & semester
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
      .eq('semester', semester);

    if (studentError) throw studentError;

    // 3. Fetch current marks entered for this exam
    const { data: marks, error: marksError } = await supabase
      .from('marks')
      .select('*')
      .eq('examination_id', examId);

    if (marksError) throw marksError;

    // Map marks by student ID
    const marksMap = {};
    marks.forEach(m => {
      marksMap[m.student_id] = m;
    });

    const resultList = students.map(st => {
      const studentMarks = marksMap[st.id];
      return {
        student_id: st.id,
        student_id_code: st.student_id_code,
        name: st.profiles?.full_name,
        email: st.profiles?.email,
        internal_marks: studentMarks ? parseFloat(studentMarks.internal_marks) : 0,
        external_marks: studentMarks ? parseFloat(studentMarks.external_marks) : 0,
        total_marks: studentMarks ? parseFloat(studentMarks.total_marks) : 0,
        grade: studentMarks ? studentMarks.grade : 'N/A',
        result: studentMarks ? studentMarks.result : 'N/A'
      };
    });

    res.json({
      examination: exam,
      records: resultList
    });
  } catch (err) {
    console.error('Error fetching exam marks list:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// @route   POST /api/marks
// @desc    Bulk upsert marks (calculates total, grade & result automatically)
// @access  Private (Admin & Faculty)
router.post('/', protect, requireRole(['ADMIN', 'FACULTY']), async (req, res) => {
  const { examination_id, records } = req.body;

  if (!examination_id || !records || !Array.isArray(records)) {
    return res.status(400).json({ message: 'Missing examination_id or records array.' });
  }

  try {
    // 1. Fetch examination max marks
    const { data: exam, error: examError } = await supabase
      .from('examinations')
      .select('max_marks')
      .eq('id', examination_id)
      .single();

    if (examError || !exam) {
      return res.status(404).json({ message: 'Examination not found' });
    }

    const maxMarks = exam.max_marks;

    // 2. Format and compute marks details
    const upsertData = records.map(rec => {
      const internals = parseFloat(rec.internal_marks) || 0;
      const externals = parseFloat(rec.external_marks) || 0;
      const total = internals + externals;
      const { grade, result } = calculateGrade(total, maxMarks);

      return {
        examination_id: parseInt(examination_id),
        student_id: rec.student_id,
        internal_marks: internals,
        external_marks: externals,
        total_marks: total,
        grade,
        result
      };
    });

    const { data, error } = await supabase
      .from('marks')
      .upsert(upsertData, { onConflict: 'examination_id,student_id' })
      .select();

    if (error) throw error;

    res.json({ message: 'Marks updated successfully', count: data.length });
  } catch (err) {
    console.error('Error recording marks:', err);
    res.status(500).json({ message: err.message || 'Server error recording marks' });
  }
});

// @route   GET /api/marks/student/:id
// @desc    Get marks sheet for a student
// @access  Private (Admin, Faculty, and the Student themselves)
router.get('/student/:id', protect, async (req, res) => {
  const studentId = req.params.id;

  if (req.user.role === 'STUDENT' && req.user.id !== studentId) {
    return res.status(403).json({ message: 'Forbidden: Access restricted to own mark sheet.' });
  }

  try {
    const { data: studentMarks, error } = await supabase
      .from('marks')
      .select(`
        id,
        internal_marks,
        external_marks,
        total_marks,
        grade,
        result,
        examinations (
          exam_name,
          max_marks,
          exam_type,
          subjects (
            subject_name,
            subject_code,
            semester,
            credits
          )
        )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = studentMarks.map(m => ({
      id: m.id,
      exam_name: m.examinations?.exam_name,
      exam_type: m.examinations?.exam_type,
      max_marks: m.examinations?.max_marks,
      subject_name: m.examinations?.subjects?.subject_name,
      subject_code: m.examinations?.subjects?.subject_code,
      semester: m.examinations?.subjects?.semester,
      credits: m.examinations?.subjects?.credits,
      internal_marks: parseFloat(m.internal_marks),
      external_marks: parseFloat(m.external_marks),
      total_marks: parseFloat(m.total_marks),
      grade: m.grade,
      result: m.result
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching student marks:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

module.exports = router;
