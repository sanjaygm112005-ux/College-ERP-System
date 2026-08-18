const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/auth/profile
// @desc    Get current user profile (joins student/faculty details based on role)
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const { id, role } = req.user;

    let profileData = { ...req.user };

    if (role === 'STUDENT') {
      const { data: student, error } = await supabase
        .from('students')
        .select('*, departments(name, code)')
        .eq('id', id)
        .single();

      if (!error && student) {
        profileData.studentDetails = student;
      }
    } else if (role === 'FACULTY') {
      const { data: faculty, error } = await supabase
        .from('faculty')
        .select('*, departments(name, code)')
        .eq('id', id)
        .single();

      if (!error && faculty) {
        profileData.facultyDetails = faculty;
      }
    }

    res.json(profileData);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ message: 'Server error fetching user profile' });
  }
});

// @route   POST /api/auth/register
// @desc    Register a new user (Admin, Faculty, or Student)
// @access  Public
router.post('/register', async (req, res) => {
  const { email, password, full_name, role, department_id } = req.body;

  if (!email || !password || !full_name || !role) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  if (!['ADMIN', 'FACULTY', 'STUDENT'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role.' });
  }

  let authUser = null;

  try {
    // 1. Create user in Supabase Auth (confirmed email)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role, full_name }
    });

    if (authError) {
      return res.status(400).json({ message: authError.message });
    }

    authUser = authData.user;
    const userId = authUser.id;

    // 2. Insert into role-specific tables
    if (role === 'STUDENT') {
      const studentIdCode = 'STD' + new Date().getFullYear() + Math.floor(1000 + Math.random() * 9000);
      const { error: studentErr } = await supabase.from('students').insert({
        id: userId,
        student_id_code: studentIdCode,
        department_id: department_id || 1, // Default to CSE (ID 1)
        semester: 1,
        section: 'A'
      });
      if (studentErr) throw studentErr;
    } else if (role === 'FACULTY') {
      const facultyIdCode = 'FAC' + new Date().getFullYear() + Math.floor(1000 + Math.random() * 9000);
      const { error: facultyErr } = await supabase.from('faculty').insert({
        id: userId,
        faculty_id_code: facultyIdCode,
        department_id: department_id || 1, // Default to CSE (ID 1)
        designation: 'Assistant Professor'
      });
      if (facultyErr) throw facultyErr;
    }

    res.status(201).json({
      message: 'Registration successful! You can now log in.',
      user: { id: userId, email, role }
    });

  } catch (err) {
    console.error('Error during registration:', err);
    if (authUser) {
      // Cleanup to prevent orphaned auth users
      await supabase.auth.admin.deleteUser(authUser.id);
    }
    res.status(500).json({ message: err.message || 'Server error during registration.' });
  }
});

module.exports = router;

