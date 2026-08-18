const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const { protect, requireRole } = require('../middleware/authMiddleware');

// @route   GET /api/timetable
// @desc    Get timetable records with optional filters
// @access  Private
router.get('/', protect, async (req, res) => {
  const { department_id, semester, section, faculty_id } = req.query;

  try {
    let query = supabase
      .from('timetable')
      .select(`
        *,
        subjects (subject_name, subject_code, credits),
        departments (name, code),
        faculty (
          id,
          faculty_id_code,
          profiles:profiles!faculty_id_fkey (
            full_name
          )
        )
      `)
      .order('start_time', { ascending: true });

    if (department_id) query = query.eq('department_id', department_id);
    if (semester) query = query.eq('semester', semester);
    if (section) query = query.eq('section', section);
    if (faculty_id) query = query.eq('faculty_id', faculty_id);

    const { data: timetable, error } = await query;
    if (error) throw error;

    const formatted = timetable.map(t => ({
      id: t.id,
      day_of_week: t.day_of_week,
      start_time: t.start_time,
      end_time: t.end_time,
      subject_id: t.subject_id,
      subject_name: t.subjects?.subject_name,
      subject_code: t.subjects?.subject_code,
      faculty_id: t.faculty_id,
      faculty_name: t.faculty?.profiles?.full_name,
      faculty_id_code: t.faculty?.faculty_id_code,
      classroom: t.classroom,
      department_id: t.department_id,
      department_name: t.departments?.name,
      department_code: t.departments?.code,
      semester: t.semester,
      section: t.section
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching timetable:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// @route   POST /api/timetable
// @desc    Create a timetable slot
// @access  Private (Admin only)
router.post('/', protect, requireRole(['ADMIN']), async (req, res) => {
  const {
    day_of_week,
    start_time,
    end_time,
    subject_id,
    faculty_id,
    classroom,
    department_id,
    semester,
    section
  } = req.body;

  if (!day_of_week || !start_time || !end_time || !subject_id || !faculty_id || !classroom || !department_id || !semester || !section) {
    return res.status(400).json({ message: 'All timetable slot fields are required.' });
  }

  try {
    const { data: slot, error } = await supabase
      .from('timetable')
      .insert([
        {
          day_of_week,
          start_time,
          end_time,
          subject_id: parseInt(subject_id),
          faculty_id,
          classroom,
          department_id: parseInt(department_id),
          semester: parseInt(semester),
          section
        }
      ])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(slot);
  } catch (err) {
    console.error('Error creating timetable slot:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// @route   PUT /api/timetable/:id
// @desc    Update a timetable slot
// @access  Private (Admin only)
router.put('/:id', protect, requireRole(['ADMIN']), async (req, res) => {
  const {
    day_of_week,
    start_time,
    end_time,
    subject_id,
    faculty_id,
    classroom,
    department_id,
    semester,
    section
  } = req.body;

  try {
    const { data: slot, error } = await supabase
      .from('timetable')
      .update({
        day_of_week,
        start_time,
        end_time,
        subject_id: subject_id ? parseInt(subject_id) : undefined,
        faculty_id,
        classroom,
        department_id: department_id ? parseInt(department_id) : undefined,
        semester: semester ? parseInt(semester) : undefined,
        section,
        updated_at: new Date()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(slot);
  } catch (err) {
    console.error('Error updating timetable slot:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// @route   DELETE /api/timetable/:id
// @desc    Delete a timetable slot
// @access  Private (Admin only)
router.delete('/:id', protect, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { error } = await supabase
      .from('timetable')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Timetable slot deleted successfully' });
  } catch (err) {
    console.error('Error deleting timetable slot:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

module.exports = router;
