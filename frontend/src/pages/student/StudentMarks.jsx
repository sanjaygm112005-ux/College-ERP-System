import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Award, AlertCircle } from 'lucide-react';

const StudentMarks = () => {
  const { user } = useAuth();
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMarks = async () => {
      try {
        const { data } = await api.get(`/marks/student/${user.id}`);
        setMarks(data);
      } catch (err) {
        console.error('Error fetching student marks:', err);
        setError('Failed to load examination marks sheet.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) fetchMarks();
  }, [user]);

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
        <h3 className="mt-4 text-lg font-bold">Marksheet Error</h3>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-sans">Marks & Examination Results</h1>
        <p className="text-sm text-slate-500">View your published assessment marks, final exam grades, and results.</p>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4 border-b pb-3 flex items-center gap-2">
          <Award className="h-5 w-5 text-slate-500" /> Academic Marksheet
        </h3>
        
        {marks.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-12">No assessment marks published yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-600">
              <thead>
                <tr className="border-b bg-slate-50 font-semibold text-slate-700">
                  <th className="px-6 py-3">Subject Name</th>
                  <th className="px-6 py-3">Subject Code</th>
                  <th className="px-6 py-3">Exam Name</th>
                  <th className="px-6 py-3 text-center">Internals</th>
                  <th className="px-6 py-3 text-center">Externals</th>
                  <th className="px-6 py-3 text-center">Total</th>
                  <th className="px-6 py-3 text-center">Grade</th>
                  <th className="px-6 py-3 text-center">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {marks.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {record.subject_name}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      {record.subject_code}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500">
                      {record.exam_name}
                    </td>
                    <td className="px-6 py-4 text-center font-medium">
                      {record.internal_marks}
                    </td>
                    <td className="px-6 py-4 text-center font-medium">
                      {record.external_marks}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-900">
                      {record.total_marks} / {record.max_marks}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded bg-brand-600 text-white font-bold text-xs shadow-sm">
                        {record.grade}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        record.result === 'PASS' 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : 'bg-rose-50 text-rose-700'
                      }`}>
                        {record.result}
                      </span>
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

export default StudentMarks;
