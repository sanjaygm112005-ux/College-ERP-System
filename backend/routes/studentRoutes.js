const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const { protect, requireRole } = require('../middleware/authMiddleware');

// @route   GET /api/students
// @desc    Get all students with filters and search
// @access  Private (Admin and Faculty)
router.get('/', protect, requireRole(['ADMIN', 'FACULTY']), async (req, res) => {
  try {
    const { department_id, semester, section, search } = req.query;

    // We select profiles along with student details
    let query = supabase
      .from('students')
      .select(`
        id,
        student_id_code,
        semester,
        section,
        date_of_birth,
        address,
        profile_photo,
        department_id,
        departments (name, code),
        profiles:profiles!students_id_fkey (
          full_name,
          email,
          phone
        )
      `);

    if (department_id) {
      query = query.eq('department_id', department_id);
    }
    if (semester) {
      query = query.eq('semester', semester);
    }
    if (section) {
      query = query.eq('section', section);
    }

    const { data: students, error } = await query;
    if (error) throw error;

    // Filter results programmatically if search query is provided
    let filteredStudents = students || [];
    if (search) {
      const searchLower = search.toLowerCase();
      filteredStudents = filteredStudents.filter(student => {
        const name = student.profiles?.full_name?.toLowerCase() || '';
        const email = student.profiles?.email?.toLowerCase() || '';
        const code = student.student_id_code?.toLowerCase() || '';
        return name.includes(searchLower) || email.includes(searchLower) || code.includes(searchLower);
      });
    }

    // Standardize structure for frontend Consumption
    const formatted = filteredStudents.map(student => ({
      id: student.id,
      student_id_code: student.student_id_code,
      name: student.profiles?.full_name,
      email: student.profiles?.email,
      phone: student.profiles?.phone,
      department_id: student.department_id,
      department_name: student.departments?.name,
      department_code: student.departments?.code,
      semester: student.semester,
      section: student.section,
      date_of_birth: student.date_of_birth,
      address: student.address,
      profile_photo: student.profile_photo
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ message: err.message || 'Server error fetching students' });
  }
});

// @route   GET /api/students/:id
// @desc    Get student by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const { data: student, error } = await supabase
      .from('students')
      .select(`
        id,
        student_id_code,
        semester,
        section,
        date_of_birth,
        address,
        profile_photo,
        department_id,
        departments (name, code),
        profiles:profiles!students_id_fkey (
          full_name,
          email,
          phone,
          role
        )
      `)
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const formatted = {
      id: student.id,
      student_id_code: student.student_id_code,
      name: student.profiles?.full_name,
      email: student.profiles?.email,
      phone: student.profiles?.phone,
      department_id: student.department_id,
      department_name: student.departments?.name,
      department_code: student.departments?.code,
      semester: student.semester,
      section: student.section,
      date_of_birth: student.date_of_birth,
      address: student.address,
      profile_photo: student.profile_photo
    };

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching student:', err);
    res.status(500).json({ message: err.message || 'Server error fetching student' });
  }
});

// @route   POST /api/students
// @desc    Add a student (creates Auth User, profile and student records)
// @access  Private (Admin only)
router.post('/', protect, requireRole(['ADMIN']), async (req, res) => {
  const {
    name,
    email,
    phone,
    password,
    student_id_code,
    department_id,
    semester,
    section,
    date_of_birth,
    address,
    profile_photo
  } = req.body;

  if (!name || !email || !student_id_code || !department_id) {
    return res.status(400).json({ message: 'Name, Email, Student ID Code, and Department are required fields.' });
  }

  const userPassword = password || 'Student@123';

  try {
    // 1. Create Supabase Auth User
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: userPassword,
      email_confirm: true,
      user_metadata: {
        role: 'STUDENT',
        full_name: name,
        phone: phone || ''
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return res.status(400).json({ message: 'A user with this email is already registered.' });
      }
      throw authError;
    }

    const newUserId = authData.user.id;

    // 2. The database trigger automatically inserts into profiles.
    // Let's perform a direct update to ensure profiles table has phone and name correctly set
    await supabase
      .from('profiles')
      .update({ full_name: name, phone: phone || '', role: 'STUDENT' })
      .eq('id', newUserId);

    // 3. Create records in public.students
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .insert([
        {
          id: newUserId,
          student_id_code,
          department_id: parseInt(department_id),
          semester: parseInt(semester) || 1,
          section: section || 'A',
          date_of_birth: date_of_birth || null,
          address: address || '',
          profile_photo: profile_photo || ''
        }
      ])
      .select()
      .single();

    if (studentError) {
      // Rollback Auth User if Student profile creation fails
      await supabase.auth.admin.deleteUser(newUserId);
      if (studentError.code === '23505') {
        return res.status(400).json({ message: 'Student ID Code already exists.' });
      }
      throw studentError;
    }

    res.status(201).json({
      message: 'Student created successfully',
      student: {
        id: newUserId,
        student_id_code,
        name,
        email,
        phone,
        department_id,
        semester,
        section,
        date_of_birth,
        address,
        profile_photo
      }
    });
  } catch (err) {
    console.error('Error creating student:', err);
    res.status(500).json({ message: err.message || 'Server error creating student' });
  }
});

// @route   PUT /api/students/:id
// @desc    Update student details
// @access  Private (Admin only)
router.put('/:id', protect, requireRole(['ADMIN']), async (req, res) => {
  const {
    name,
    phone,
    student_id_code,
    department_id,
    semester,
    section,
    date_of_birth,
    address,
    profile_photo
  } = req.body;

  const studentId = req.params.id;

  try {
    // 1. Update Profile (Name, Phone)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: name,
        phone: phone || '',
        updated_at: new Date()
      })
      .eq('id', studentId);

    if (profileError) throw profileError;

    // 2. Update Student Academic details
    const { data: student, error: studentError } = await supabase
      .from('students')
      .update({
        student_id_code,
        department_id: parseInt(department_id),
        semester: parseInt(semester) || 1,
        section: section || 'A',
        date_of_birth: date_of_birth || null,
        address: address || '',
        profile_photo: profile_photo || '',
        updated_at: new Date()
      })
      .eq('id', studentId)
      .select()
      .single();

    if (studentError) {
      if (studentError.code === '23505') {
        return res.status(400).json({ message: 'Student ID Code already exists.' });
      }
      throw studentError;
    }

    res.json({
      message: 'Student updated successfully',
      student: {
        id: studentId,
        student_id_code,
        name,
        phone,
        department_id,
        semester,
        section,
        date_of_birth,
        address,
        profile_photo
      }
    });
  } catch (err) {
    console.error('Error updating student:', err);
    res.status(500).json({ message: err.message || 'Server error updating student' });
  }
});

// @route   DELETE /api/students/:id
// @desc    Delete a student (deletes from auth, cascading to profiles & students)
// @access  Private (Admin only)
router.delete('/:id', protect, requireRole(['ADMIN']), async (req, res) => {
  const studentId = req.params.id;
  try {
    // Deleting via Admin auth triggers cascade deletion in DB
    const { error } = await supabase.auth.admin.deleteUser(studentId);
    if (error) throw error;

    res.json({ message: 'Student and associated accounts deleted successfully' });
  } catch (err) {
    console.error('Error deleting student:', err);
    res.status(500).json({ message: err.message || 'Server error deleting student' });
  }
});

module.exports = router;
