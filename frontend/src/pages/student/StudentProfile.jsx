import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Phone, Mail, Award, BookOpen, MapPin, CalendarDays } from 'lucide-react';

const StudentProfile = () => {
  const { profile } = useAuth();

  if (!profile) return null;

  const details = profile.studentDetails || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-sm text-slate-500">View and verify your registered academic and personal information.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Card: Avatar & Basic Info */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm flex flex-col items-center text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-3xl font-extrabold border-2 border-brand-200">
            {profile.name?.charAt(0).toUpperCase()}
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-800">{profile.name}</h2>
          <p className="text-xs font-semibold text-brand-600 bg-brand-50 rounded-full px-3 py-1 uppercase tracking-wider mt-2">
            Student
          </p>
          <span className="text-xs text-slate-400 mt-2">ID Code: {details.student_id_code || 'N/A'}</span>

          <div className="w-full border-t mt-6 pt-6 space-y-4 text-left">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Mail className="h-4 w-4 text-slate-400" />
              <span className="truncate">{profile.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Phone className="h-4 w-4 text-slate-400" />
              <span>{profile.phone || 'No phone recorded'}</span>
            </div>
          </div>
        </div>

        {/* Right Cards: Academic Details & Personal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Academic Details */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2 border-b pb-3">
              <Award className="h-5 w-5 text-slate-500" /> Academic Enrollment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase">Department</span>
                <span className="text-sm font-semibold text-slate-800 mt-1 block">
                  {details.departments?.name || 'Computer Science & Engineering'}
                </span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase">Semester / Class</span>
                <span className="text-sm font-semibold text-slate-800 mt-1 block">
                  Semester {details.semester || '1'} (Section {details.section || 'A'})
                </span>
              </div>
            </div>
          </div>

          {/* Personal Details */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2 border-b pb-3">
              <User className="h-5 w-5 text-slate-500" /> Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" /> Date of Birth
                </span>
                <span className="text-sm font-semibold text-slate-800 mt-1 block">
                  {details.date_of_birth ? new Date(details.date_of_birth).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-slate-400 uppercase flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> Permanent Address
                </span>
                <span className="text-sm font-semibold text-slate-800 mt-1 block">
                  {details.address || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
