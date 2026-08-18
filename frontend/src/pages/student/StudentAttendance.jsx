import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Calendar, ClipboardCheck, AlertCircle } from 'lucide-react';

const StudentAttendance = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const { data: res } = await api.get(`/attendance/student/${user.id}`);
        setData(res);
      } catch (err) {
        console.error('Error fetching student attendance:', err);
        setError('Failed to fetch attendance history.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) fetchAttendance();
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-red-600 max-w-xl mx-auto">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-4 text-lg font-bold">Attendance Error</h3>
        <p className="mt-2 text-sm">{error || 'No records available.'}</p>
      </div>
    );
  }

  const { overall, subjectWise, history } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Attendance</h1>
        <p className="text-sm text-slate-500">Monitor your overall and course-wise class attendance metrics.</p>
      </div>

      {/* Stats Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="rounded-2xl border bg-white p-5 shadow-sm text-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Classes</span>
          <span className="text-3xl font-extrabold text-slate-800 mt-2 block">{overall.totalClasses}</span>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm text-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Present</span>
          <span className="text-3xl font-extrabold text-emerald-600 mt-2 block">{overall.present}</span>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm text-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Absent</span>
          <span className="text-3xl font-extrabold text-rose-500 mt-2 block">{overall.absent}</span>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm text-center">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Presence Rate</span>
          <span className={`text-3xl font-extrabold mt-2 block ${overall.percentage >= 75 ? 'text-emerald-600' : 'text-rose-500'}`}>
            {overall.percentage}%
          </span>
        </div>
      </div>

      {/* Detailed Course-Wise breakdown */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4 border-b pb-3 flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-slate-500" /> Subject-wise Breakdown
        </h3>
        
        {subjectWise.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-6">No subject-wise records compiled yet.</p>
        ) : (
          <div className="space-y-4">
            {subjectWise.map((sub, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span className="text-slate-800">{sub.subject_name} ({sub.subject_code})</span>
                  <span className={`${sub.percentage >= 75 ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {sub.present} / {sub.total} ({sub.percentage}%)
                  </span>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      sub.percentage >= 75 ? 'bg-emerald-500' : 'bg-rose-500'
                    }`} 
                    style={{ width: `${sub.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Log History */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4 border-b pb-3 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-slate-500" /> Daily Attendance Logs
        </h3>
        
        {history.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-6">No logs available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-600">
              <thead>
                <tr className="border-b bg-slate-50 font-semibold text-slate-700">
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Subject</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {history.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {new Date(log.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      {log.subject_name} <span className="text-xs text-slate-400">({log.subject_code})</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        log.status === 'PRESENT' 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : 'bg-rose-50 text-rose-700'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs italic text-slate-400">
                      {log.remarks || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAttendance;
