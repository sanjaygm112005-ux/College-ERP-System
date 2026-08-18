import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Megaphone, AlertCircle, Calendar, Plus, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';

const FacultyAnnouncements = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Creation States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetRole, setTargetRole] = useState('ALL');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  const fetchAnnouncements = async () => {
    try {
      const { data } = await api.get('/announcements');
      setAnnouncements(data);
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setError('Failed to fetch announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description) {
      setError('Please provide title and description.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/announcements', {
        title,
        description,
        target_role: targetRole
      });

      setTitle('');
      setDescription('');
      setTargetRole('ALL');
      setSuccess('Announcement published successfully.');
      confetti({ particleCount: 30, spread: 30 });
      await fetchAnnouncements();
    } catch (err) {
      console.error(err);
      setError('Failed to publish announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      setAnnouncements(prev => prev.filter(ann => ann.id !== id));
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to delete announcement.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-sans">Announcements Management</h1>
        <p className="text-sm text-slate-500">Publish and manage notices targeted at students, faculty, or all college members.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form to create */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm h-fit">
          <h3 className="text-base font-bold text-slate-900 mb-4 border-b pb-3 flex items-center gap-2">
            <Plus className="h-5 w-5 text-slate-500" /> Publish Notice
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-100">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-lg bg-green-50 p-3 text-xs text-green-600 border border-green-100">
                {success}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Notice Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g., Special Holiday Announcement"
                className="mt-1 block w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Target Role</label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-100"
              >
                <option value="ALL">Everyone (ALL)</option>
                <option value="STUDENT">Students Only</option>
                <option value="FACULTY">Faculty Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Content / Description</label>
              <textarea
                required
                rows="5"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 transition"
                placeholder="Enter details of notice..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full justify-center rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 disabled:opacity-50 transition cursor-pointer"
            >
              {submitting ? 'Publishing...' : 'Publish Notice'}
            </button>
          </form>
        </div>

        {/* Announcements List */}
        <div className="lg:col-span-2 rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4 border-b pb-3 flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-slate-500" /> Active Notices
          </h3>

          {announcements.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-12">No notices found.</p>
          ) : (
            <div className="space-y-6">
              {announcements.map((ann) => (
                <div key={ann.id} className="border-b last:border-b-0 pb-6 last:pb-0 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-base font-bold text-slate-800">{ann.title}</h4>
                      <span className="text-[10px] font-bold bg-brand-50 text-brand-600 rounded-full px-2 py-0.5 inline-block mt-1">
                        Audience: {ann.target_role}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(ann.created_at).toLocaleDateString()}
                      </span>
                      {/* Only allow deleting if faculty created it or is admin */}
                      {user && (
                        <button
                          onClick={() => handleDelete(ann.id)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-500 transition cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed font-sans">{ann.description}</p>
                  <div className="text-xs text-slate-400">
                    Posted By: <span className="font-semibold text-slate-600">{ann.created_by_name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacultyAnnouncements;
