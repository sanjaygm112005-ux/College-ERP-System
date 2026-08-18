import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  ClipboardCheck,
  BookOpen,
  CreditCard,
  Award,
  Megaphone,
  AlertCircle,
  TrendingUp,
  FileText
} from 'lucide-react';

const StudentDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/dashboard/student');
        setStats(data);
      } catch (err) {
        console.error('Error fetching student dashboard:', err);
        setError('Could not load student statistics.');
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

  const { semester, subjectCount, attendance, pendingFees, recentMarks, recentAnnouncements } = stats;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Student Dashboard</h1>
        <p className="text-sm text-slate-500">Track your academic progress, attendance, grades, and due fees.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Attendance */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Attendance Rate</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-800">{attendance.percentage}%</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <ClipboardCheck className="h-5 w-5" />
          </div>
        </div>

        {/* Card 2: Semester */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Semester</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-800">Sem {semester}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        {/* Card 3: Subjects */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Enrolled Subjects</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-800">{subjectCount}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-brand-600">
            <BookOpen className="h-5 w-5" />
          </div>
        </div>

        {/* Card 4: Pending Fees */}
        <div className="rounded-2xl border bg-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Outstanding Fees</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-800">
              {pendingFees > 0 ? `$${pendingFees.toLocaleString()}` : '$0'}
            </p>
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${pendingFees > 0 ? 'bg-rose-100 text-rose-600' : 'bg-teal-100 text-teal-600'}`}>
            <CreditCard className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Marks */}
        <div className="lg:col-span-2 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b pb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="h-5 w-5 text-slate-500" /> Recent Examination Marks
            </h2>
            <Link to="/student/marks" className="text-xs font-semibold text-brand-600 hover:text-brand-500">
              Full Marksheet
            </Link>
          </div>
          {recentMarks.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              No examination marks published yet.
            </div>
          ) : (
            <div className="space-y-4">
              {recentMarks.map((m, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-xl bg-slate-50 p-4 border border-slate-100">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">{m.subject_name}</h4>
                    <p className="text-xs text-slate-400 mt-1">{m.exam_name} • {m.subject_code}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-slate-800">{m.score} / {m.max}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{m.result}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white font-bold text-sm shadow">
                      {m.grade}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Circular Attendance Graphic */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Attendance Log</h2>
            <p className="text-xs text-slate-400 mt-1">Keep track of your classes to maintain eligibility</p>
          </div>

          <div className="flex flex-col items-center justify-center my-6">
            <div className="relative flex h-36 w-36 items-center justify-center rounded-full bg-slate-50">
              <svg className="absolute h-full w-full -rotate-90">
                <circle cx="72" cy="72" r="60" className="stroke-slate-100 fill-none" strokeWidth="8" />
                <circle 
                  cx="72" 
                  cy="72" 
                  r="60" 
                  className={`fill-none transition-all duration-1000 ${
                    attendance.percentage >= 75 ? 'stroke-emerald-500' : 'stroke-rose-500'
                  }`} 
                  strokeWidth="8" 
                  strokeDasharray={`${2 * Math.PI * 60}`}
                  strokeDashoffset={`${2 * Math.PI * 60 * (1 - attendance.percentage / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="text-center">
                <span className="text-3xl font-extrabold text-slate-800">{attendance.percentage}%</span>
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                  {attendance.present} of {attendance.total} Classes
                </span>
              </div>
            </div>
          </div>

          <Link
            to="/student/attendance"
            className="flex items-center justify-between rounded-xl border p-3 hover:bg-slate-50 transition text-xs font-semibold text-slate-700 mt-2"
          >
            <span>View Attendance History</span>
            <FileText className="h-4 w-4 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* Announcements */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b pb-4 mb-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-slate-500" /> Recent Campus Announcements
          </h2>
          <Link to="/student/announcements" className="text-xs font-semibold text-brand-600 hover:text-brand-500">
            View All
          </Link>
        </div>
        {recentAnnouncements.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">
            No announcements today.
          </div>
        ) : (
          <div className="space-y-4">
            {recentAnnouncements.map(ann => (
              <div key={ann.id} className="border-b last:border-0 pb-3 last:pb-0">
                <h4 className="text-sm font-bold text-slate-800 hover:text-brand-600 transition">
                  {ann.title}
                </h4>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{ann.description}</p>
                <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
                  <span>Author: {ann.created_by_name}</span>
                  <span>{new Date(ann.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
