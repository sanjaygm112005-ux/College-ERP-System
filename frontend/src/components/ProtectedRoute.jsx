import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-500">Verifying session...</p>
        </div>
      </div>
    );
  }

  // Not logged in -> Redirect to login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Session loaded, but profile details failed to sync
  if (!profile) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center">
        <h1 className="text-2xl font-bold text-slate-800">Connection Error</h1>
        <p className="max-w-md text-slate-600">
          We found your authentication session, but could not load your ERP profile from the server. 
          Please make sure the backend server is running and the database triggers are loaded.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Logged in, but unauthorized for this role
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    console.warn(`Unauthorized access attempt. Role "${profile.role}" is not in:`, allowedRoles);
    
    // Redirect to respective dashboard
    if (profile.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (profile.role === 'FACULTY') return <Navigate to="/faculty/dashboard" replace />;
    if (profile.role === 'STUDENT') return <Navigate to="/student/dashboard" replace />;
    
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
