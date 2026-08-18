import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Calendar, FileText, AlertCircle, FilePlus, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';

const StudentLeave = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const fetchLeaves = async () => {
    try {
      const { data } = await api.get(`/leave/student/${user.id}`);
      setLeaves(data);
    } catch (err) {
      console.error('Error fetching leaves:', err);
      setError('Failed to fetch leave request logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchLeaves();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) {
      setError('Please fill in all leave application details.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date cannot be after the end date.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/leave', {
        start_date: startDate,
        end_date: endDate,
        reason
      });

      // Clear form
      setStartDate('');
      setEndDate('');
      setReason('');
      setSuccess('Leave request submitted successfully.');
      
      confetti({
        particleCount: 40,
        spread: 40
      });

      // Refresh list
      await fetchLeaves();
    } catch (err) {
      console.error('Error applying for leave:', err);
      setError(err.response?.data?.message || 'Error submitting leave request.');
    } finally {
      setSubmitting(false);
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
        <h1 className="text-2xl font-bold text-slate-900 font-sans">Apply for Leave</h1>
        <p className="text-sm text-slate-500">Apply for college leave of absence and check reviews from your faculty advisor.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Application Form */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm h-fit">
          <h3 className="text-base font-bold text-slate-900 mb-4 border-b pb-3 flex items-center gap-2">
            <FilePlus className="h-5 w-5 text-slate-500" /> New Application
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
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">End Date</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Reason</label>
              <textarea
                required
                rows="4"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 transition"
                placeholder="Brief description of the reason for leave..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full justify-center rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 disabled:opacity-50 transition cursor-pointer"
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </div>

        {/* Application History */}
        <div className="lg:col-span-2 rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4 border-b pb-3 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-slate-500" /> Leave Application Logs
          </h3>

          {leaves.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-12">No leave applications filed yet.</p>
          ) : (
            <div className="space-y-4">
              {leaves.map((l) => (
                <div key={l.id} className="rounded-xl border p-4 hover:shadow-sm transition">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                      {l.start_date} <ChevronRight className="h-3 w-3" /> {l.end_date}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      l.status === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-700'
                        : l.status === 'REJECTED'
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {l.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-800 mt-3 font-sans">
                    Reason: <span className="font-normal text-slate-600">{l.reason}</span>
                  </p>
                  {l.remarks && (
                    <div className="mt-3 text-xs bg-slate-50 border border-slate-100 rounded-lg p-3 text-slate-500">
                      <span className="font-semibold text-slate-700 block mb-0.5">Faculty Remarks:</span>
                      "{l.remarks}" {l.approved_by_name && `— ${l.approved_by_name}`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentLeave;
