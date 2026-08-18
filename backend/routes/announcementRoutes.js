const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const { protect, requireRole } = require('../middleware/authMiddleware');

// @route   GET /api/announcements
// @desc    Get all relevant announcements based on the user's role
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { role } = req.user;

    // Retrieve announcements matching user role, or target ALL
    const targetRoles = ['ALL'];
    if (role) targetRoles.push(role);

    const { data: announcements, error } = await supabase
      .from('announcements')
      .select(`
        *,
        profiles:created_by (
          full_name
        )
      `)
      .in('target_role', targetRoles)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formatted = announcements.map(a => ({
      id: a.id,
      title: a.title,
      description: a.description,
      target_role: a.target_role,
      created_by_name: a.profiles?.full_name || 'Admin',
      created_at: a.created_at
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching announcements:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// @route   POST /api/announcements
// @desc    Create an announcement
// @access  Private (Admin & Faculty)
router.post('/', protect, requireRole(['ADMIN', 'FACULTY']), async (req, res) => {
  const { title, description, target_role } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: 'Title and description are required.' });
  }

  try {
    const { data: announcement, error } = await supabase
      .from('announcements')
      .insert([
        {
          title,
          description,
          target_role: target_role || 'ALL',
          created_by: req.user.id
        }
      ])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(announcement);
  } catch (err) {
    console.error('Error creating announcement:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// @route   PUT /api/announcements/:id
// @desc    Update an announcement
// @access  Private (Admin & Faculty who created it)
router.put('/:id', protect, requireRole(['ADMIN', 'FACULTY']), async (req, res) => {
  const { title, description, target_role } = req.body;

  try {
    // If faculty, verify ownership
    if (req.user.role === 'FACULTY') {
      const { data: existing } = await supabase.from('announcements').select('created_by').eq('id', req.params.id).single();
      if (!existing || existing.created_by !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden: You can only edit your own announcements.' });
      }
    }

    const { data: announcement, error } = await supabase
      .from('announcements')
      .update({
        title,
        description,
        target_role,
        updated_at: new Date()
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(announcement);
  } catch (err) {
    console.error('Error updating announcement:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// @route   DELETE /api/announcements/:id
// @desc    Delete an announcement
// @access  Private (Admin & Faculty who created it)
router.delete('/:id', protect, requireRole(['ADMIN', 'FACULTY']), async (req, res) => {
  try {
    // If faculty, verify ownership
    if (req.user.role === 'FACULTY') {
      const { data: existing } = await supabase.from('announcements').select('created_by').eq('id', req.params.id).single();
      if (!existing || existing.created_by !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden: You can only delete your own announcements.' });
      }
    }

    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Announcement deleted successfully' });
  } catch (err) {
    console.error('Error deleting announcement:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

module.exports = router;
