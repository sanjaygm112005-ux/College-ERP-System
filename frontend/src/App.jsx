import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentManagement from './pages/admin/StudentManagement';
import FacultyManagement from './pages/admin/FacultyManagement';
import DepartmentManagement from './pages/admin/DepartmentManagement';
import SubjectManagement from './pages/admin/SubjectManagement';
import TimetableManagement from './pages/admin/TimetableManagement';
import FeeManagement from './pages/admin/FeeManagement';
import LeaveRequests from './pages/admin/LeaveRequests';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import Examinations from './pages/admin/Examinations';

// Faculty Pages
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import FacultyProfile from './pages/faculty/FacultyProfile';
import FacultySubjects from './pages/faculty/FacultySubjects';
import FacultyStudents from './pages/faculty/FacultyStudents';
import AttendanceSheet from './pages/faculty/AttendanceSheet';
import MarksEntry from './pages/faculty/MarksEntry';
import FacultyTimetable from './pages/faculty/FacultyTimetable';
import FacultyLeaves from './pages/faculty/FacultyLeaves';
import FacultyAnnouncements from './pages/faculty/FacultyAnnouncements';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentProfile from './pages/student/StudentProfile';
import StudentAttendance from './pages/student/StudentAttendance';
import StudentSubjects from './pages/student/StudentSubjects';
import StudentTimetable from './pages/student/StudentTimetable';
import StudentMarks from './pages/student/StudentMarks';
import StudentFees from './pages/student/StudentFees';
import StudentLeave from './pages/student/StudentLeave';
import StudentAnnouncements from './pages/student/StudentAnnouncements';

// Root Redirect component based on role
const RootRedirect = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (profile?.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (profile?.role === 'FACULTY') return <Navigate to="/faculty/dashboard" replace />;
  if (profile?.role === 'STUDENT') return <Navigate to="/student/dashboard" replace />;

  return <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Root Redirector */}
          <Route path="/" element={<RootRedirect />} />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout><AdminDashboard /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout><StudentManagement /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/faculty"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout><FacultyManagement /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/departments"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout><DepartmentManagement /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/subjects"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout><SubjectManagement /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/attendance"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout><AttendanceSheet /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/examinations"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout><Examinations /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/marks"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout><MarksEntry /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/fees"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout><FeeManagement /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/timetable"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout><TimetableManagement /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/leaves"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout><LeaveRequests /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/announcements"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout><AdminAnnouncements /></DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Faculty Routes */}
          <Route
            path="/faculty/dashboard"
            element={
              <ProtectedRoute allowedRoles={['FACULTY']}>
                <DashboardLayout><FacultyDashboard /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/profile"
            element={
              <ProtectedRoute allowedRoles={['FACULTY']}>
                <DashboardLayout><FacultyProfile /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/subjects"
            element={
              <ProtectedRoute allowedRoles={['FACULTY']}>
                <DashboardLayout><FacultySubjects /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/students"
            element={
              <ProtectedRoute allowedRoles={['FACULTY']}>
                <DashboardLayout><FacultyStudents /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/attendance"
            element={
              <ProtectedRoute allowedRoles={['FACULTY']}>
                <DashboardLayout><AttendanceSheet /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/marks"
            element={
              <ProtectedRoute allowedRoles={['FACULTY']}>
                <DashboardLayout><MarksEntry /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/timetable"
            element={
              <ProtectedRoute allowedRoles={['FACULTY']}>
                <DashboardLayout><FacultyTimetable /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/leaves"
            element={
              <ProtectedRoute allowedRoles={['FACULTY']}>
                <DashboardLayout><FacultyLeaves /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/announcements"
            element={
              <ProtectedRoute allowedRoles={['FACULTY']}>
                <DashboardLayout><FacultyAnnouncements /></DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Student Routes */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <DashboardLayout><StudentDashboard /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <DashboardLayout><StudentProfile /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/attendance"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <DashboardLayout><StudentAttendance /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/subjects"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <DashboardLayout><StudentSubjects /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/timetable"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <DashboardLayout><StudentTimetable /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/marks"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <DashboardLayout><StudentMarks /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/fees"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <DashboardLayout><StudentFees /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/leave"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <DashboardLayout><StudentLeave /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/announcements"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <DashboardLayout><StudentAnnouncements /></DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all Redirect to Root */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
