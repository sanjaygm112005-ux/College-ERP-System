import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  BookOpen,
  Users,
  Calendar,
  ClipboardCheck,
  FileSpreadsheet,
  AlertCircle,
  Clock,
  ArrowRight
} from 'lucide-react';

const FacultyDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/dashboard/faculty');
        setStats(data);
      } catch (err) {
        console.error('Error fetching faculty dashboard:', err);
        setError('Could not load faculty statistics.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
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
        <h3 className="mt-4 text-lg font-bold">Dashboard Error</h3>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    );
  }

  const { subjects, totalStudents, todayClasses, pendingLeaves, attendanceSummary } = stats;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-sans">Faculty Portal</h1>
        <p className="text-sm text-slate-500">Manage your subjects, classes, student attendance, and internal marks.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Subjects */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Assigned Subjects</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-800">{subjects.length}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <BookOpen className="h-5 w-5" />
          </div>
        </div>

        {/* Card 2: Department Students */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dept Students</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-800">{totalStudents}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-brand-600">
            <Users className="h-5 w-5" />
          </div>
        </div>

        {/* Card 3: Classes Today */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Classes Today</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-800">{todayClasses.length}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <Calendar className="h-5 w-5" />
          </div>
        </div>

        {/* Card 4: Attendance Average */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Class Presence</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-800">{attendanceSummary.percentage}%</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <ClipboardCheck className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-slate-500" /> Today's Lecture Schedule
          </h2>
          {todayClasses.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400 border border-dashed rounded-xl bg-slate-50">
              No lectures scheduled for today. Have a nice day!
            </div>
          ) : (
            <div className="divide-y">
              {todayClasses.map(cls => (
                <div key={cls.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{cls.subject_name}</h4>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">{cls.subject_code}</span>
                      <span>•</span>
                      <span>Classroom {cls.classroom}</span>
                      <span>•</span>
                      <span>Semester {cls.semester} - Sec {cls.section}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-brand-600 bg-brand-50 rounded-lg px-2.5 py-1.5 border border-brand-100">
                      {cls.start_time.slice(0, 5)} - {cls.end_time.slice(0, 5)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions Card */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Quick Faculty Tasks</h2>
            <p className="text-xs text-slate-400 mt-1">Easily navigate to complete your tasks</p>
          </div>
          <div className="space-y-3 my-4">
            <Link
              to="/faculty/attendance"
              className="flex items-center justify-between rounded-xl border p-3 hover:bg-slate-50 transition text-sm font-semibold text-slate-700"
            >
              <span>Mark Student Attendance</span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
            <Link
              to="/faculty/marks"
              className="flex items-center justify-between rounded-xl border p-3 hover:bg-slate-50 transition text-sm font-semibold text-slate-700"
            >
              <span>Upload Examination Marks</span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
            <Link
              to="/faculty/leaves"
              className="flex items-center justify-between rounded-xl border p-3 hover:bg-slate-50 transition text-sm font-semibold text-slate-700"
            >
              <span>Review Student Leave Requests</span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
          </div>
          <div className="text-xs text-slate-400 text-center border-t pt-3">
            Academic Term 2026
          </div>
        </div>
      </div>

      {/* Leave Requests & Class Lists */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Leave Requests */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b pb-4 mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-slate-500" /> Student Leave Approvals
            </h2>
            <Link to="/faculty/leaves" className="text-xs font-semibold text-brand-600 hover:text-brand-500">
              View All
            </Link>
          </div>
          {pendingLeaves.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              No leave requests require review.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingLeaves.map(leave => (
                <div key={leave.id} className="flex items-start justify-between rounded-xl bg-slate-50 p-4 border border-slate-100">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">{leave.student_name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{leave.student_id_code}</p>
                    <p className="text-xs text-slate-600 mt-2 italic">"{leave.reason}"</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-200/50 rounded-full px-2 py-0.5 uppercase">
                      {leave.start_date} to {leave.end_date}
                    </span>
                    <Link to="/faculty/leaves" className="text-[11px] font-bold text-brand-600 hover:underline mt-1">
                      Action
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assigned Subjects detail */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b pb-4 mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-slate-500" /> My Assigned Subjects
            </h2>
            <Link to="/faculty/subjects" className="text-xs font-semibold text-brand-600 hover:text-brand-500">
              Details
            </Link>
          </div>
          {subjects.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              No subjects assigned to you. Contact admin.
            </div>
          ) : (
            <div className="space-y-3">
              {subjects.map(sub => (
                <div key={sub.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{sub.subject_name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{sub.subject_code} • Sem {sub.semester} • {sub.department_name || 'N/A'}</p>
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

export default FacultyDashboard;
