const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const { protect, requireRole } = require('../middleware/authMiddleware');

// @route   GET /api/faculty
// @desc    Get all faculty with optional search & filters
// @access  Private (Admin, Faculty, Student)
router.get('/', protect, async (req, res) => {
  try {
    const { department_id, search } = req.query;

    let query = supabase
      .from('faculty')
      .select(`
        id,
        faculty_id_code,
        designation,
        profile_photo,
        department_id,
        departments (name, code),
        profiles:profiles!faculty_id_fkey (
          full_name,
          email,
          phone
        )
      `);

    if (department_id) {
      query = query.eq('department_id', department_id);
    }

    const { data: faculty, error } = await query;
    if (error) throw error;

    let filteredFaculty = faculty || [];
    if (search) {
      const searchLower = search.toLowerCase();
      filteredFaculty = filteredFaculty.filter(fac => {
        const name = fac.profiles?.full_name?.toLowerCase() || '';
        const email = fac.profiles?.email?.toLowerCase() || '';
        const code = fac.faculty_id_code?.toLowerCase() || '';
        return name.includes(searchLower) || email.includes(searchLower) || code.includes(searchLower);
      });
    }

    const formatted = filteredFaculty.map(fac => ({
      id: fac.id,
      faculty_id_code: fac.faculty_id_code,
      name: fac.profiles?.full_name,
      email: fac.profiles?.email,
      phone: fac.profiles?.phone,
      department_id: fac.department_id,
      department_name: fac.departments?.name,
      department_code: fac.departments?.code,
      designation: fac.designation,
      profile_photo: fac.profile_photo
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching faculty:', err);
    res.status(500).json({ message: err.message || 'Server error fetching faculty' });
  }
});

// @route   GET /api/faculty/:id
// @desc    Get faculty details by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const { data: fac, error } = await supabase
      .from('faculty')
      .select(`
        id,
        faculty_id_code,
        designation,
        profile_photo,
        department_id,
        departments (name, code),
        profiles:profiles!faculty_id_fkey (
          full_name,
          email,
          phone
        )
      `)
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!fac) return res.status(404).json({ message: 'Faculty not found' });

    const formatted = {
      id: fac.id,
      faculty_id_code: fac.faculty_id_code,
      name: fac.profiles?.full_name,
      email: fac.profiles?.email,
      phone: fac.profiles?.phone,
      department_id: fac.department_id,
      department_name: fac.departments?.name,
      department_code: fac.departments?.code,
      designation: fac.designation,
      profile_photo: fac.profile_photo
    };

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching faculty details:', err);
    res.status(500).json({ message: err.message || 'Server error fetching faculty' });
  }
});

// @route   POST /api/faculty
// @desc    Create a faculty user (creates Auth User, profile and faculty records)
// @access  Private (Admin only)
router.post('/', protect, requireRole(['ADMIN']), async (req, res) => {
  const {
    name,
    email,
    phone,
    password,
    faculty_id_code,
    department_id,
    designation,
    profile_photo
  } = req.body;

  if (!name || !email || !faculty_id_code || !department_id || !designation) {
    return res.status(400).json({
      message: 'Name, Email, Faculty ID Code, Department, and Designation are required.'
    });
  }

  const userPassword = password || 'Faculty@123';

  try {
    // 1. Create Supabase Auth User
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: userPassword,
      email_confirm: true,
      user_metadata: {
        role: 'FACULTY',
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

    // Ensure database trigger role is updated if not synced
    await supabase
      .from('profiles')
      .update({ full_name: name, phone: phone || '', role: 'FACULTY' })
      .eq('id', newUserId);

    // 2. Insert into public.faculty
    const { data: facultyData, error: facultyError } = await supabase
      .from('faculty')
      .insert([
        {
          id: newUserId,
          faculty_id_code,
          department_id: parseInt(department_id),
          designation,
          profile_photo: profile_photo || ''
        }
      ])
      .select()
      .single();

    if (facultyError) {
      // Rollback auth user
      await supabase.auth.admin.deleteUser(newUserId);
      if (facultyError.code === '23505') {
        return res.status(400).json({ message: 'Faculty ID Code already exists.' });
      }
      throw facultyError;
    }

    res.status(201).json({
      message: 'Faculty created successfully',
      faculty: {
        id: newUserId,
        faculty_id_code,
        name,
        email,
        phone,
        department_id,
        designation,
        profile_photo
      }
    });
  } catch (err) {
    console.error('Error creating faculty:', err);
    res.status(500).json({ message: err.message || 'Server error creating faculty' });
  }
});

// @route   PUT /api/faculty/:id
// @desc    Update faculty details
// @access  Private (Admin only)
router.put('/:id', protect, requireRole(['ADMIN']), async (req, res) => {
  const {
    name,
    phone,
    faculty_id_code,
    department_id,
    designation,
    profile_photo
  } = req.body;

  const facultyId = req.params.id;

  try {
    // 1. Update profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: name,
        phone: phone || '',
        updated_at: new Date()
      })
      .eq('id', facultyId);

    if (profileError) throw profileError;

    // 2. Update faculty table
    const { data: faculty, error: facultyError } = await supabase
      .from('faculty')
      .update({
        faculty_id_code,
        department_id: parseInt(department_id),
        designation,
        profile_photo: profile_photo || '',
        updated_at: new Date()
      })
      .eq('id', facultyId)
      .select()
      .single();

    if (facultyError) {
      if (facultyError.code === '23505') {
        return res.status(400).json({ message: 'Faculty ID Code already exists.' });
      }
      throw facultyError;
    }

    res.json({
      message: 'Faculty details updated successfully',
      faculty: {
        id: facultyId,
        faculty_id_code,
        name,
        phone,
        department_id,
        designation,
        profile_photo
      }
    });
  } catch (err) {
    console.error('Error updating faculty:', err);
    res.status(500).json({ message: err.message || 'Server error updating faculty' });
  }
});

// @route   DELETE /api/faculty/:id
// @desc    Delete faculty (deletes from auth, cascading to profile & faculty)
// @access  Private (Admin only)
router.delete('/:id', protect, requireRole(['ADMIN']), async (req, res) => {
  const facultyId = req.params.id;
  try {
    const { error } = await supabase.auth.admin.deleteUser(facultyId);
    if (error) throw error;

    res.json({ message: 'Faculty and associated accounts deleted successfully' });
  } catch (err) {
    console.error('Error deleting faculty:', err);
    res.status(500).json({ message: err.message || 'Server error deleting faculty' });
  }
});

module.exports = router;
