import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  User,
  Users,
  GraduationCap,
  Building2,
  BookOpen,
  ClipboardCheck,
  Award,
  FileText,
  CreditCard,
  Calendar,
  FileSpreadsheet,
  Megaphone,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const { profile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!profile) return null;

  const role = profile.role;

  // Define sidebar navigation links per role
  const adminLinks = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Students', path: '/admin/students', icon: Users },
    { label: 'Faculty', path: '/admin/faculty', icon: GraduationCap },
    { label: 'Departments', path: '/admin/departments', icon: Building2 },
    { label: 'Subjects', path: '/admin/subjects', icon: BookOpen },
    { label: 'Attendance', path: '/admin/attendance', icon: ClipboardCheck },
    { label: 'Examinations', path: '/admin/examinations', icon: Award },
    { label: 'Marks', path: '/admin/marks', icon: FileText },
    { label: 'Fees', path: '/admin/fees', icon: CreditCard },
    { label: 'Timetable', path: '/admin/timetable', icon: Calendar },
    { label: 'Leave Requests', path: '/admin/leaves', icon: FileSpreadsheet },
    { label: 'Announcements', path: '/admin/announcements', icon: Megaphone }
  ];

  const facultyLinks = [
    { label: 'Dashboard', path: '/faculty/dashboard', icon: LayoutDashboard },
    { label: 'Profile', path: '/faculty/profile', icon: User },
    { label: 'My Subjects', path: '/faculty/subjects', icon: BookOpen },
    { label: 'Students', path: '/faculty/students', icon: Users },
    { label: 'Attendance', path: '/faculty/attendance', icon: ClipboardCheck },
    { label: 'Marks', path: '/faculty/marks', icon: FileText },
    { label: 'Timetable', path: '/faculty/timetable', icon: Calendar },
    { label: 'Leave Requests', path: '/faculty/leaves', icon: FileSpreadsheet },
    { label: 'Announcements', path: '/faculty/announcements', icon: Megaphone }
  ];

  const studentLinks = [
    { label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { label: 'Profile', path: '/student/profile', icon: User },
    { label: 'Attendance', path: '/student/attendance', icon: ClipboardCheck },
    { label: 'Subjects', path: '/student/subjects', icon: BookOpen },
    { label: 'Timetable', path: '/student/timetable', icon: Calendar },
    { label: 'Marks & Results', path: '/student/marks', icon: FileText },
    { label: 'Fees', path: '/student/fees', icon: CreditCard },
    { label: 'Leave', path: '/student/leave', icon: FileSpreadsheet },
    { label: 'Announcements', path: '/student/announcements', icon: Megaphone }
  ];

  const sidebarLinks = 
    role === 'ADMIN' ? adminLinks : 
    role === 'FACULTY' ? facultyLinks : 
    studentLinks;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const navContent = (
    <div className="flex h-full flex-col justify-between bg-white text-slate-800">
      <div>
        {/* Logo/Branding Header */}
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-200">
            <span className="text-xl font-bold">E</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-none">ERP Portal</h1>
            <span className="text-xs font-semibold text-brand-600 tracking-wider uppercase">{role}</span>
          </div>
        </div>

        {/* Links Navigation */}
        <nav className="mt-6 space-y-1 px-4">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-50 text-brand-600 shadow-sm shadow-brand-50'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Logout */}
      <div className="border-t p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="h-5 w-5 text-red-500" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Sidebar overlay */}
      <div
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile Drawer (Left Slide-in) */}
      <aside
        className={`fixed bottom-0 top-0 left-0 z-50 w-64 border-r bg-white transition-transform duration-300 ease-in-out lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
        >
          <X className="h-5 w-5" />
        </button>
        {navContent}
      </aside>

      {/* Desktop Sidebar (Permanent) */}
      <aside className="fixed bottom-0 top-0 left-0 hidden w-64 border-r bg-white lg:block">
        {navContent}
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col lg:pl-64">
        {/* Header Navbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white/80 px-6 backdrop-blur-md">
          {/* Mobile Menu trigger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Page Heading breadcrumbs */}
          <div className="hidden items-center gap-2 text-sm font-medium text-slate-500 md:flex">
            <span>College ERP</span>
            <span>/</span>
            <span className="text-slate-800 capitalize">
              {location.pathname.split('/').filter(Boolean).slice(1).join(' / ') || 'Dashboard'}
            </span>
          </div>

          {/* Quick Actions (Notifications + User profile menu) */}
          <div className="flex items-center gap-4">
            <button className="relative rounded-full p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-brand-500 ring-2 ring-white"></span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-slate-50"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-bold border border-brand-200">
                  {profile.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="hidden text-left md:block">
                  <p className="text-sm font-semibold text-slate-900 leading-none">{profile.name}</p>
                  <p className="mt-0.5 text-xs text-slate-400 capitalize leading-none">{role.toLowerCase()}</p>
                </div>
                <ChevronDown className="hidden h-4 w-4 text-slate-400 md:block" />
              </button>

              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl border bg-white p-1.5 shadow-lg ring-1 ring-black/5 z-20">
                    <Link
                      to={role === 'STUDENT' ? '/student/profile' : role === 'FACULTY' ? '/faculty/profile' : '/admin/dashboard'}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-all"
                    >
                      <User className="h-4 w-4 text-slate-400" />
                      My Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-all text-left"
                    >
                      <LogOut className="h-4 w-4 text-red-400" />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
