import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Users, Search, AlertCircle, Filter } from 'lucide-react';

const FacultyStudents = () => {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter States
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSem, setSelectedSem] = useState('');
  const [selectedSec, setSelectedSec] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const initData = async () => {
      try {
        const [deptRes, studentRes] = await Promise.all([
          api.get('/departments'),
          api.get('/students')
        ]);
        setDepartments(deptRes.data);
        setStudents(studentRes.data);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to fetch department or student directories.');
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  const handleFilterSearch = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/students', {
        params: {
          department_id: selectedDept,
          semester: selectedSem,
          section: selectedSec,
          search: searchTerm
        }
      });
      setStudents(data);
    } catch (err) {
      console.error(err);
      setError('Filter operation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-sans">Students Directory</h1>
        <p className="text-sm text-slate-500">Query student profiles, departments, sections, and emails.</p>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
          <Filter className="h-4 w-4" /> Filters & Search
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Dept filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase">Department</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.code}</option>
              ))}
            </select>
          </div>

          {/* Semester Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase">Semester</label>
            <select
              value={selectedSem}
              onChange={(e) => setSelectedSem(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>

          {/* Section Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase">Section</label>
            <select
              value={selectedSec}
              onChange={(e) => setSelectedSec(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              <option value="">All Sections</option>
              {['A', 'B', 'C', 'D'].map(sec => (
                <option key={sec} value={sec}>Section {sec}</option>
              ))}
            </select>
          </div>

          {/* Search Term */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase">Search Name / Code</label>
            <div className="relative mt-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="block w-full rounded-lg border border-slate-200 p-2 pl-8 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
              <Search className="absolute left-2.5 top-3 h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleFilterSearch}
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-500 transition cursor-pointer"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4 border-b pb-3 flex items-center gap-2">
          <Users className="h-5 w-5 text-slate-500" /> Registered Students
        </h3>

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="text-center text-sm text-red-500 py-6">{error}</div>
        ) : students.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-12">No student records match filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-600">
              <thead>
                <tr className="border-b bg-slate-50 font-semibold text-slate-700">
                  <th className="px-6 py-3">Student Name</th>
                  <th className="px-6 py-3">ID Code</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3 text-center">Semester / Section</th>
                  <th className="px-6 py-3">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {students.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-semibold text-slate-800">{st.name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{st.student_id_code}</td>
                    <td className="px-6 py-4">{st.department_name} ({st.department_code})</td>
                    <td className="px-6 py-4 text-center">Sem {st.semester} - {st.section}</td>
                    <td className="px-6 py-4">
                      <div className="text-xs space-y-0.5">
                        <p className="text-slate-600">{st.email}</p>
                        <p className="text-slate-400">{st.phone || 'No phone'}</p>
                      </div>
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

export default FacultyStudents;
