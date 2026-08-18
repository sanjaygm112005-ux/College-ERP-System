import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Users,
  GraduationCap,
  Building2,
  BookOpen,
  Megaphone,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/dashboard/admin');
        setStats(data);
      } catch (err) {
        console.error('Error fetching admin stats:', err);
        setError('Could not load dashboard statistics. Make sure the database is seeded.');
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
        <Link 
          to="/admin/students"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
        >
          Manage Students
        </Link>
      </div>
    );
  }

  const { counts, attendanceRate, recentAnnouncements, pendingLeaves, recentStudents } = stats;

  const cards = [
    { label: 'Total Students', value: counts.students, color: 'from-blue-500 to-indigo-500', icon: Users, path: '/admin/students' },
    { label: 'Total Faculty', value: counts.faculty, color: 'from-purple-500 to-pink-500', icon: GraduationCap, path: '/admin/faculty' },
    { label: 'Departments', value: counts.departments, color: 'from-amber-500 to-orange-500', icon: Building2, path: '/admin/departments' },
    { label: 'Total Subjects', value: counts.subjects, color: 'from-emerald-500 to-teal-500', icon: BookOpen, path: '/admin/subjects' }
  ];

  // Chart Data: Academic distribution
  const chartData = [
    { name: 'Students', count: counts.students, fill: '#5275ff' },
    { name: 'Faculty', count: counts.faculty, fill: '#d946ef' },
    { name: 'Departments', count: counts.departments, fill: '#f97316' },
    { name: 'Subjects', count: counts.subjects, fill: '#10b981' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome Back, Admin</h1>
        <p className="text-sm text-slate-500">Here is a quick breakdown of your college activities today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              to={card.path}
              className="relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-400">{card.label}</p>
                  <p className="mt-2 text-3xl font-extrabold text-slate-800">{card.value}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr ${card.color} text-white shadow-md`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity">
                Manage records <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Main Grid: Charts & Overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Analytics Chart */}
        <div className="lg:col-span-2 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">ERP Analytics Overview</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
              <TrendingUp className="h-3.5 w-3.5" /> Real-time
            </span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Circular Attendance Card */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">College Attendance</h2>
            <p className="text-xs text-slate-400 mt-1">Average student presence rate across all sections</p>
          </div>
          
          <div className="flex flex-col items-center justify-center my-6">
            <div className="relative flex h-36 w-36 items-center justify-center rounded-full bg-brand-50">
              {/* Outer track */}
              <svg className="absolute h-full w-full -rotate-90">
                <circle cx="72" cy="72" r="60" className="stroke-slate-100 fill-none" strokeWidth="10" />
                <circle 
                  cx="72" 
                  cy="72" 
                  r="60" 
                  className="stroke-brand-500 fill-none transition-all duration-1000" 
                  strokeWidth="10" 
                  strokeDasharray={`${2 * Math.PI * 60}`}
                  strokeDashoffset={`${2 * Math.PI * 60 * (1 - attendanceRate / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="text-center">
                <span className="text-3xl font-extrabold text-slate-800">{attendanceRate}%</span>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Present</span>
              </div>
            </div>
          </div>

          <div className="text-center text-xs text-slate-500 border-t pt-4">
            Total recorded entries synced.
          </div>
        </div>
      </div>

      {/* Lower Grid: Pending Leaves & Announcements */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pending Leaves */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b pb-4 mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-slate-500" /> Pending Leave Requests
            </h2>
            <Link to="/admin/leaves" className="text-xs font-semibold text-brand-600 hover:text-brand-500">
              View All
            </Link>
          </div>
          {pendingLeaves.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              No pending leave requests.
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
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-200/50 rounded-full px-2 py-0.5 uppercase">
                      {leave.start_date} to {leave.end_date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Announcements */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b pb-4 mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-slate-500" /> Recent Announcements
            </h2>
            <Link to="/admin/announcements" className="text-xs font-semibold text-brand-600 hover:text-brand-500">
              Manage
            </Link>
          </div>
          {recentAnnouncements.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              No recent announcements.
            </div>
          ) : (
            <div className="space-y-4">
              {recentAnnouncements.map(ann => (
                <div key={ann.id} className="border-b last:border-0 pb-3 last:pb-0">
                  <h4 className="text-sm font-bold text-slate-800 hover:text-brand-600 transition">
                    {ann.title}
                  </h4>
                  <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
                    <span>By {ann.created_by}</span>
                    <span>{new Date(ann.created_at).toLocaleDateString()}</span>
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

export default AdminDashboard;
