import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { ClipboardCheck, Check, X, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

const AttendanceSheet = () => {
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  // Selection states
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSem, setSelectedSem] = useState('');
  const [selectedSec, setSelectedSec] = useState('');
  const [selectedSub, setSelectedSub] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Students list
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const { data: depts } = await api.get('/departments');
        setDepartments(depts);
      } catch (err) {
        console.error('Error loading metadata:', err);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch subjects when department or semester changes
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!selectedDept || !selectedSem) {
        setSubjects([]);
        return;
      }
      try {
        const { data } = await api.get('/subjects', {
          params: { department_id: selectedDept, semester: selectedSem }
        });
        setSubjects(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSubjects();
  }, [selectedDept, selectedSem]);

  const handleFetchStudents = async () => {
    if (!selectedDept || !selectedSem || !selectedSec || !selectedSub || !selectedDate) {
      setError('Please fill in all parameters before loading the sheet.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data } = await api.get('/attendance/students', {
        params: {
          department_id: selectedDept,
          semester: selectedSem,
          section: selectedSec,
          subject_id: selectedSub,
          date: selectedDate
        }
      });
      
      // Default empty records to PRESENT
      const updated = data.map(st => ({
        ...st,
        status: st.status || 'PRESENT'
      }));

      setStudents(updated);
    } catch (err) {
      console.error(err);
      setError('Failed to load attendance roster.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setStudents(prev =>
      prev.map(st => (st.id === studentId ? { ...st, status } : st))
    );
  };

  const handleMarkAll = (status) => {
    setStudents(prev => prev.map(st => ({ ...st, status })));
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const records = students.map(st => ({
        student_id: st.id,
        status: st.status
      }));

      await api.post('/attendance', {
        subject_id: selectedSub,
        date: selectedDate,
        semester: selectedSem,
        section: selectedSec,
        records
      });

      setSuccess('Attendance sheet recorded successfully.');
      confetti({
        particleCount: 50,
        spread: 30
      });
    } catch (err) {
      console.error('Error saving attendance:', err);
      setError('Failed to record attendance logs.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-sans">Mark Attendance</h1>
        <p className="text-sm text-slate-500">Select course parameters, mark student present/absents, and update records.</p>
      </div>

      {/* Roster Controls */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Department */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase">Department</label>
            <select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setStudents([]);
              }}
              className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              <option value="">Select...</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.code}</option>
              ))}
            </select>
          </div>

          {/* Semester */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase">Semester</label>
            <select
              value={selectedSem}
              onChange={(e) => {
                setSelectedSem(e.target.value);
                setStudents([]);
              }}
              className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              <option value="">Select...</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                <option key={s} value={s}>Sem {s}</option>
              ))}
            </select>
          </div>

          {/* Section */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase">Section</label>
            <select
              value={selectedSec}
              onChange={(e) => {
                setSelectedSec(e.target.value);
                setStudents([]);
              }}
              className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              <option value="">Select...</option>
              {['A', 'B', 'C', 'D'].map(sec => (
                <option key={sec} value={sec}>Sec {sec}</option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase">Subject</label>
            <select
              value={selectedSub}
              disabled={!selectedDept || !selectedSem}
              onChange={(e) => {
                setSelectedSub(e.target.value);
                setStudents([]);
              }}
              className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:opacity-50"
            >
              <option value="">Select...</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.subject_name}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setStudents([]);
              }}
              className="mt-1 block w-full rounded-lg border border-slate-200 p-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>

        <div className="flex justify-end border-t pt-4">
          <button
            onClick={handleFetchStudents}
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-500 transition cursor-pointer"
          >
            Load Roster
          </button>
        </div>
      </div>

      {/* Roster Sheet */}
      {students.length > 0 && (
        <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 mb-4 gap-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-slate-500" /> Attendance Roster
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleMarkAll('PRESENT')}
                className="rounded bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
              >
                Mark All Present
              </button>
              <button
                onClick={() => handleMarkAll('ABSENT')}
                className="rounded bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
              >
                Mark All Absent
              </button>
            </div>
          </div>

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

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-600">
              <thead>
                <tr className="border-b bg-slate-50 font-semibold text-slate-700">
                  <th className="px-6 py-3">Student Name</th>
                  <th className="px-6 py-3">ID Code</th>
                  <th className="px-6 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {students.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-semibold text-slate-800">{st.name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">{st.student_id_code}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => handleStatusChange(st.id, 'PRESENT')}
                          className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                            st.status === 'PRESENT'
                              ? 'bg-emerald-600 text-white shadow'
                              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          <Check className="h-3.5 w-3.5" /> Present
                        </button>
                        <button
                          onClick={() => handleStatusChange(st.id, 'ABSENT')}
                          className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                            st.status === 'ABSENT'
                              ? 'bg-rose-600 text-white shadow'
                              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          <X className="h-3.5 w-3.5" /> Absent
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={handleSaveAttendance}
              disabled={saving}
              className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-500 transition cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceSheet;
