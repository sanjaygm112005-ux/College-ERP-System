import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { BookOpen, AlertCircle } from 'lucide-react';

const StudentSubjects = () => {
  const { profile } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const details = profile?.studentDetails;
        if (!details) {
          setError('Student details not found.');
          setLoading(false);
          return;
        }

        const { data } = await api.get('/subjects', {
          params: {
            department_id: details.department_id,
            semester: details.semester
          }
        });
        setSubjects(data);
      } catch (err) {
        console.error('Error fetching student subjects:', err);
        setError('Failed to fetch subjects.');
      } finally {
        setLoading(false);
      }
    };

    if (profile) fetchSubjects();
  }, [profile]);

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
        <h3 className="mt-4 text-lg font-bold">Subjects Error</h3>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-sans">My Enrolled Subjects</h1>
        <p className="text-sm text-slate-500">Review the syllabus, courses, credit scores, and assigned faculty for this semester.</p>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4 border-b pb-3 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-slate-500" /> Subjects List
        </h3>
        
        {subjects.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-12">No subjects found for your semester.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {subjects.map((sub) => (
              <div key={sub.id} className="rounded-xl border p-5 bg-slate-50 hover:bg-slate-50/50 hover:shadow-sm transition">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="font-mono text-xs font-bold text-brand-600 bg-brand-50 border border-brand-100 rounded px-2 py-0.5">
                      {sub.subject_code}
                    </span>
                    <h4 className="text-base font-bold text-slate-800 mt-2">{sub.subject_name}</h4>
                  </div>
                  <span className="text-xs font-bold bg-slate-200/50 text-slate-600 rounded-full px-2.5 py-1">
                    {sub.credits} Credits
                  </span>
                </div>
                <div className="border-t mt-4 pt-4 flex items-center justify-between text-xs text-slate-500">
                  <span>Assigned Faculty:</span>
                  <span className="font-bold text-slate-700">{sub.faculty_name || 'Unassigned'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentSubjects;
