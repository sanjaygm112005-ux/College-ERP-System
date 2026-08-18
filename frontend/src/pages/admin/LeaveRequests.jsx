import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FileSpreadsheet, Check, X, AlertCircle, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';

const LeaveRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Selected for review
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
    setSuccess('');

    try {
      await api.put(`/leave/${selectedReq.id}`, {
        status,
        remarks
      });

      confetti({ particleCount: 30 });
      setSuccess(`Request status set to ${status}.`);
      setSelectedReq(null);
      setRemarks('');
      await fetchLeaves();
    } catch (err) {
      console.error(err);
      setError('Failed to update leave status.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this leave request permanently?')) return;
    setError('');
    setSuccess('');

    try {
      await api.delete(`/leave/${id}`);
      setSuccess('Leave request record deleted.');
      setSelectedReq(null);
      await fetchLeaves();
    } catch (err) {
      console.error(err);
      setError('Failed to delete leave request.');
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
        <h1 className="text-2xl font-bold text-slate-900 font-sans">Student Leaves Control</h1>
        <p className="text-sm text-slate-500 font-sans">Review all submitted leave applications, approve requests, and audit logs.</p>
      </div>

      {success && (
        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-600 border border-green-100">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaves Table */}
        <div className="lg:col-span-2 rounded-2xl border bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 mb-4 border-b pb-3 flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-slate-500" /> Student Applications
          </h3>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-100">
              {error}
            </div>
          )}

          {requests.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-12">No leave applications found.</p>
          ) : (
            <div className="space-y-4">
              {requests.map((l) => (
                <div 
                  key={l.id}
                  onClick={() => setSelectedReq(l)}
                  className={`rounded-xl border p-4 hover:shadow-sm transition cursor-pointer flex justify-between items-start ${
                    selectedReq?.id === l.id ? 'border-brand-500 bg-brand-50/10' : 'bg-slate-50/50'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
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
                    <h4 className="text-sm font-bold text-slate-800 pt-1">{l.student_name}</h4>
                    <p className="text-xs text-slate-400">Department: {l.department_name}</p>
                    <p className="text-xs text-slate-600 pt-2 italic">Reason: "{l.reason}"</p>
                    <p className="text-[10px] font-bold text-slate-500 pt-2">
                      Dates: {l.start_date} to {l.end_date}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(l.id);
                    }}
                    className="rounded p-1.5 text-slate-400 hover:bg-slate-200 hover:text-red-500 transition cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Panel */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm h-fit">
          <h3 className="text-base font-bold text-slate-900 mb-4 border-b pb-3">Audit Details</h3>

          {selectedReq ? (
            <div className="space-y-4">
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Student Name</span>
                <span className="text-sm font-bold text-slate-800">{selectedReq.student_name}</span>
              </div>

              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Department</span>
                <span className="text-sm font-semibold text-slate-700">{selectedReq.department_name}</span>
              </div>

              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Leave Duration</span>
                <span className="text-sm font-semibold text-slate-700">
                  {selectedReq.start_date} to {selectedReq.end_date}
                </span>
              </div>

              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Reason</span>
                <span className="text-sm font-normal text-slate-600 italic mt-0.5 block">
                  "{selectedReq.reason}"
                </span>
              </div>

              {selectedReq.status === 'PENDING' ? (
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Remarks</label>
                    <textarea
                      rows="3"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-800 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleAction('APPROVED')}
                      disabled={saving}
                      className="flex justify-center items-center gap-1.5 rounded-lg bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 cursor-pointer disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" /> Approve
                    </button>
                    <button
                      onClick={() => handleAction('REJECTED')}
                      disabled={saving}
                      className="flex justify-center items-center gap-1.5 rounded-lg bg-rose-600 py-2.5 text-xs font-bold text-white hover:bg-rose-500 cursor-pointer disabled:opacity-50"
                    >
                      <X className="h-4 w-4" /> Decline
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-slate-50 p-4 border text-center">
                  <span className="text-xs font-bold text-slate-400 uppercase">Review Status</span>
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
            <p className="text-sm text-slate-400 py-12 text-center">Select an application from the roster to audit details.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveRequests;
