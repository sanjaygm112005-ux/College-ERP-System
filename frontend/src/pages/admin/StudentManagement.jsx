import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Users, Search, Plus, Edit2, Trash2, Filter, AlertCircle, X } from 'lucide-react';
import confetti from 'canvas-confetti';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSem, setSelectedSem] = useState('');
  const [selectedSec, setSelectedSec] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [editingId, setEditingId] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [studentIdCode, setStudentIdCode] = useState('');
  const [deptId, setDeptId] = useState('');
  const [semester, setSemester] = useState('1');
  const [section, setSection] = useState('A');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');

  const fetchStudents = async () => {
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
      setError('Failed to fetch students.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const { data } = await api.get('/departments');
        setDepartments(data);
        await fetchStudents();
      } catch (err) {
        console.error(err);
      }
    };
    fetchMetadata();
  }, []);

  const handleOpenAdd = () => {
    setModalMode('add');
    setEditingId(null);
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setStudentIdCode('');
    setDeptId(departments[0]?.id || '');
    setSemester('1');
    setSection('A');
    setDob('');
    setAddress('');
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (st) => {
    setModalMode('edit');
    setEditingId(st.id);
    setName(st.name);
    setEmail(st.email);
    setPhone(st.phone || '');
    setPassword(''); // Don't show password
    setStudentIdCode(st.student_id_code);
    setDeptId(st.department_id || '');
    setSemester(String(st.semester));
    setSection(st.section);
    setDob(st.date_of_birth || '');
    setAddress(st.address || '');
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const payload = {
      name,
      email,
      phone,
      student_id_code: studentIdCode,
      department_id: deptId,
      semester,
      section,
      date_of_birth: dob,
      address
    };

    if (modalMode === 'add') {
      payload.password = password;
    }

    try {
      if (modalMode === 'add') {
        await api.post('/students', payload);
        setSuccess('Student account created successfully.');
      } else {
        await api.put(`/students/${editingId}`, payload);
        setSuccess('Student details updated successfully.');
      }

      confetti({ particleCount: 40 });
      setShowModal(false);
      await fetchStudents();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save student.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student? This deletes their credentials and all details.')) return;
    setError('');
    setSuccess('');

    try {
      await api.delete(`/students/${id}`);
      setSuccess('Student account deleted.');
      await fetchStudents();
    } catch (err) {
      console.error(err);
      setError('Failed to delete student.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-sans">Students Management</h1>
          <p className="text-sm text-slate-500">Add, edit, delete, and view profiles of students.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-500 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Add Student
        </button>
      </div>

      {success && (
        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-600 border border-green-100">
          {success}
        </div>
      )}

      {/* Filter Roster */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
          <Filter className="h-4 w-4" /> Filters & Search
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase">Section</label>
            <select
              value={selectedSec}
              onChange={(e) => setSelectedSec(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-700 focus:outline-none"
            >
              <option value="">All Sections</option>
              {['A', 'B', 'C', 'D'].map(sec => (
                <option key={sec} value={sec}>Section {sec}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase">Search Student</label>
            <div className="relative mt-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="block w-full rounded-lg border border-slate-200 p-2 pl-8 text-sm text-slate-700 focus:outline-none"
              />
              <Search className="absolute left-2.5 top-3 h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={fetchStudents}
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-500 transition cursor-pointer"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Grid table */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4 border-b pb-3 flex items-center gap-2">
          <Users className="h-5 w-5 text-slate-500" /> Student Records
        </h3>

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"></div>
          </div>
        ) : students.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-12">No student records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-600">
              <thead>
                <tr className="border-b bg-slate-50 font-semibold text-slate-700">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">ID Code</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3 text-center">Semester & Section</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {students.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-semibold text-slate-800">{st.name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{st.student_id_code}</td>
                    <td className="px-6 py-4">{st.department_name} ({st.department_code})</td>
                    <td className="px-6 py-4 text-center">Sem {st.semester} - {st.section}</td>
                    <td className="px-6 py-4 text-xs">
                      <p>{st.email}</p>
                      <p className="text-slate-400">{st.phone || '—'}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(st)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(st.id)}
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
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-base font-bold text-slate-900 capitalize">
                {modalMode === 'add' ? 'Add New Student' : 'Edit Student Details'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-100 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Student Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Student ID Code</label>
                  <input
                    type="text"
                    required
                    value={studentIdCode}
                    onChange={(e) => setStudentIdCode(e.target.value)}
                    placeholder="E.g., STD2026001"
                    className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</label>
                  <input
                    type="email"
                    required
                    disabled={modalMode === 'edit'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                {modalMode === 'add' && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Login Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Defaults to Student@123"
                      className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                )}

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
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Section</label>
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-700 focus:outline-none"
                  >
                    {['A', 'B', 'C', 'D'].map(sec => (
                      <option key={sec} value={sec}>Section {sec}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Date of Birth</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Home Address</label>
                <textarea
                  rows="3"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-800 focus:outline-none"
                />
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
                  {modalMode === 'add' ? 'Create Account' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
