import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FileSpreadsheet, Check, X, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

const FacultyLeaves = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Approval actions state
  const [selectedReq, setSelectedReq] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchLeaves = async () => {
    try {
      const { data } = await api.get('/leave');
      setRequests(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch leave requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleAction = async (status) => {
    if (!selectedReq) return;
    setSaving(true);
    setError('');

    try {
      await api.put(`/leave/${selectedReq.id}`, {
        status,
        remarks
      });

      confetti({
        particleCount: 40,
        spread: 30
      });

      // Clear states
      setSelectedReq(null);
      setRemarks('');
      
      // Refresh list
      await fetchLeaves();
    } catch (err) {
      console.error(err);
      setError('Failed to submit leave status update.');
    } finally {
      setSaving(false);
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
        <h1 className="text-2xl font-bold text-slate-900 font-sans">Leave Approvals</h1>
        <p className="text-sm text-slate-500">Review, approve, or decline student leave of absence requests.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Requests List */}
        <div className="lg:col-span-2 rounded-2xl border bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 mb-4 border-b pb-3 flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-slate-500" /> Pending Requests
          </h3>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-100">
              {error}
            </div>
          )}

          {requests.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-12">No leave requests found.</p>
          ) : (
            <div className="space-y-4">
              {requests.map((l) => (
                <div 
                  key={l.id} 
                  onClick={() => setSelectedReq(l)}
                  className={`rounded-xl border p-4 hover:shadow-sm transition cursor-pointer ${
                    selectedReq?.id === l.id ? 'border-brand-500 bg-brand-50/10' : 'bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {l.student_id_code}
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
                  <h4 className="text-sm font-bold text-slate-800 mt-2">{l.student_name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Dept: {l.department_name}</p>
                  <p className="text-xs text-slate-600 mt-3 italic">Reason: "{l.reason}"</p>
                  <p className="text-[11px] font-semibold text-slate-500 mt-3">
                    Duration: {l.start_date} to {l.end_date}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Panel */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm h-fit">
          <h3 className="text-base font-bold text-slate-900 mb-4 border-b pb-3">Review Leave</h3>
          
          {selectedReq ? (
            <div className="space-y-4">
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Student Name</span>
                <span className="text-sm font-bold text-slate-800">{selectedReq.student_name}</span>
              </div>

              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Leave Duration</span>
                <span className="text-sm font-semibold text-slate-700">
                  {selectedReq.start_date} to {selectedReq.end_date}
                </span>
              </div>

              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 font-sans">Reason</span>
                <span className="text-sm font-normal text-slate-600 italic mt-0.5 block">
                  "{selectedReq.reason}"
                </span>
              </div>

              {selectedReq.status === 'PENDING' ? (
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Remarks / Explanation</label>
                    <textarea
                      rows="3"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 transition"
                      placeholder="Add remarks..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleAction('APPROVED')}
                      disabled={saving}
                      className="flex justify-center items-center gap-1.5 rounded-lg bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50 transition cursor-pointer"
                    >
                      <Check className="h-4 w-4" /> Approve
                    </button>
                    <button
                      onClick={() => handleAction('REJECTED')}
                      disabled={saving}
                      className="flex justify-center items-center gap-1.5 rounded-lg bg-rose-600 py-2.5 text-xs font-bold text-white hover:bg-rose-500 disabled:opacity-50 transition cursor-pointer"
                    >
                      <X className="h-4 w-4" /> Reject
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-slate-50 p-4 text-center border">
                  <p className="text-xs font-bold text-slate-400 uppercase">Request Status</p>
                  <p className={`text-base font-extrabold mt-1 ${
                    selectedReq.status === 'APPROVED' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {selectedReq.status}
                  </p>
                  {selectedReq.remarks && (
                    <p className="text-xs text-slate-500 mt-2 italic font-serif">"{selectedReq.remarks}"</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400 py-12 text-center">Select a leave request to review and approve.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacultyLeaves;
