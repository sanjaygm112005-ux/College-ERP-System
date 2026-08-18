import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Megaphone, AlertCircle, Calendar } from 'lucide-react';

const StudentAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
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

    fetchAnnouncements();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-red-600 max-w-xl mx-auto">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-4 text-lg font-bold">Announcements Error</h3>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-sans">Campus Announcements</h1>
        <p className="text-sm text-slate-500">Stay updated with the latest circulars, events, and schedules from the college.</p>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4 border-b pb-3 flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-slate-500" /> Latest Announcements
        </h3>
        
        {announcements.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-12">No announcements published.</p>
        ) : (
          <div className="space-y-6">
            {announcements.map((ann) => (
              <div key={ann.id} className="border-b last:border-b-0 pb-6 last:pb-0 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <h4 className="text-base font-bold text-slate-800 hover:text-brand-600 transition">
                    {ann.title}
                  </h4>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(ann.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed font-sans">{ann.description}</p>
                <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
                  <span>Posted By:</span>
                  <span className="font-semibold text-slate-600">{ann.created_by_name}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAnnouncements;
