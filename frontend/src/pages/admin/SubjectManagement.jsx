import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { BookOpen, Plus, Edit2, Trash2, X, AlertCircle, Filter } from 'lucide-react';
import confetti from 'canvas-confetti';

const SubjectManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSem, setSelectedSem] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editingId, setEditingId] = useState(null);

  // Form Fields
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [deptId, setDeptId] = useState('');
  const [semester, setSemester] = useState('1');
  const [credits, setCredits] = useState('3');
  const [facultyId, setFacultyId] = useState('');

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/subjects', {
        params: {
          department_id: selectedDept,
          semester: selectedSem
        }
      });
      setSubjects(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch subjects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initData = async () => {
      try {
        const [depts, facs] = await Promise.all([
          api.get('/departments'),
          api.get('/faculty')
        ]);
        setDepartments(depts.data);
        setFaculty(facs.data);
        await fetchSubjects();
      } catch (err) {
        console.error(err);
      }
    };
    initData();
  }, []);

  const handleOpenAdd = () => {
    setModalMode('add');
    setEditingId(null);
    setSubjectCode('');
    setSubjectName('');
    setDeptId(departments[0]?.id || '');
    setSemester('1');
    setCredits('3');
    setFacultyId('');
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (sub) => {
    setModalMode('edit');
    setEditingId(sub.id);
    setSubjectCode(sub.subject_code);
    setSubjectName(sub.subject_name);
    setDeptId(sub.department_id || '');
    setSemester(String(sub.semester));
    setCredits(String(sub.credits));
    setFacultyId(sub.faculty_id || '');
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const payload = {
      subject_code: subjectCode,
      subject_name: subjectName,
      department_id: deptId,
      semester,
      credits,
      faculty_id: facultyId || null
    };

    try {
      if (modalMode === 'add') {
        await api.post('/subjects', payload);
        setSuccess('Subject created successfully.');
      } else {
        await api.put(`/subjects/${editingId}`, payload);
        setSuccess('Subject details updated.');
      }

      confetti({ particleCount: 30 });
      setShowModal(false);
      await fetchSubjects();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save subject.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;
    setError('');
    setSuccess('');

    try {
      await api.delete(`/subjects/${id}`);
      setSuccess('Subject deleted successfully.');
      await fetchSubjects();
    } catch (err) {
      console.error(err);
      setError('Failed to delete subject.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-sans">Subject Management</h1>
          <p className="text-sm text-slate-500 font-sans">Manage subjects, syllabus credits, and assign faculty lecturers.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-500 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Add Subject
        </button>
      </div>

      {success && (
        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-600 border border-green-100">
          {success}
        </div>
      )}

      {/* Filter and Search */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
          <Filter className="h-4 w-4" /> Filters
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase">Department</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-700 focus:outline-none"
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.code}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase">Semester</label>
            <select
              value={selectedSem}
              onChange={(e) => setSelectedSem(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-700 focus:outline-none"
            >
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={fetchSubjects}
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-500 transition cursor-pointer"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Roster list */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4 border-b pb-3 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-slate-500" /> Subjects
        </h3>

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"></div>
          </div>
        ) : subjects.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-12">No subjects found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-600">
              <thead>
                <tr className="border-b bg-slate-50 font-semibold text-slate-700">
                  <th className="px-6 py-3">Subject Name</th>
                  <th className="px-6 py-3">Subject Code</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3 text-center">Semester</th>
                  <th className="px-6 py-3 text-center">Credits</th>
                  <th className="px-6 py-3">Assigned Faculty</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {subjects.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-semibold text-slate-800">{sub.subject_name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-brand-600">{sub.subject_code}</td>
                    <td className="px-6 py-4">{sub.department_name} ({sub.department_code})</td>
                    <td className="px-6 py-4 text-center">Sem {sub.semester}</td>
                    <td className="px-6 py-4 text-center">{sub.credits}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">{sub.faculty_name}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(sub)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(sub.id)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600 transition cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Dialog Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl border overflow-hidden">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-base font-bold text-slate-900 capitalize">
                {modalMode === 'add' ? 'Add New Subject' : 'Edit Subject Details'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-100 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Subject Name</label>
                  <input
                    type="text"
                    required
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    placeholder="E.g., Algorithms"
                    className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Subject Code</label>
                  <input
                    type="text"
                    required
                    value={subjectCode}
                    onChange={(e) => setSubjectCode(e.target.value)}
                    placeholder="E.g., CS101"
                    className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Department</label>
                  <select
                    value={deptId}
                    onChange={(e) => setDeptId(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-700 focus:outline-none"
                  >
                    <option value="">Select Department...</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Semester</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-700 focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Credits</label>
                  <select
                    value={credits}
                    onChange={(e) => setCredits(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-700 focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6].map(c => (
                      <option key={c} value={c}>{c} Credits</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Assign Faculty</label>
                  <select
                    value={facultyId}
                    onChange={(e) => setFacultyId(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-700 focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {faculty.map(f => (
                      <option key={f.id} value={f.id}>{f.name} ({f.faculty_id_code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-500 cursor-pointer"
                >
                  {modalMode === 'add' ? 'Create Subject' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectManagement;
