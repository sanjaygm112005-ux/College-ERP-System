import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { GraduationCap, Search, Plus, Edit2, Trash2, Filter, AlertCircle, X } from 'lucide-react';
import confetti from 'canvas-confetti';

const FacultyManagement = () => {
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [selectedDept, setSelectedDept] = useState('');
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
  const [facultyIdCode, setFacultyIdCode] = useState('');
  const [deptId, setDeptId] = useState('');
  const [designation, setDesignation] = useState('Assistant Professor');

  const fetchFaculty = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/faculty', {
        params: {
          department_id: selectedDept,
          search: searchTerm
        }
      });
      setFaculty(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch faculty directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const { data } = await api.get('/departments');
        setDepartments(data);
        await fetchFaculty();
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
    setFacultyIdCode('');
    setDeptId(departments[0]?.id || '');
    setDesignation('Assistant Professor');
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (fac) => {
    setModalMode('edit');
    setEditingId(fac.id);
    setName(fac.name);
    setEmail(fac.email);
    setPhone(fac.phone || '');
    setPassword('');
    setFacultyIdCode(fac.faculty_id_code);
    setDeptId(fac.department_id || '');
    setDesignation(fac.designation);
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
      faculty_id_code: facultyIdCode,
      department_id: deptId,
      designation
    };

    if (modalMode === 'add') {
      payload.password = password;
    }

    try {
      if (modalMode === 'add') {
        await api.post('/faculty', payload);
        setSuccess('Faculty account created successfully.');
      } else {
        await api.put(`/faculty/${editingId}`, payload);
        setSuccess('Faculty details updated successfully.');
      }

      confetti({ particleCount: 40 });
      setShowModal(false);
      await fetchFaculty();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save faculty.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this faculty member? This deletes their credentials and all details.')) return;
    setError('');
    setSuccess('');

    try {
      await api.delete(`/faculty/${id}`);
      setSuccess('Faculty account deleted.');
      await fetchFaculty();
    } catch (err) {
      console.error(err);
      setError('Failed to delete faculty member.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-sans">Faculty Management</h1>
          <p className="text-sm text-slate-500">Manage credentials and assignments for faculty lecturers.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-500 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Add Faculty
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
          <Filter className="h-4 w-4" /> Filters & Search
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
            <label className="block text-xs font-semibold text-slate-400 uppercase">Search Faculty</label>
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
            onClick={fetchFaculty}
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-500 transition cursor-pointer"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Grid table */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4 border-b pb-3 flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-slate-500" /> Faculty Directory
        </h3>

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"></div>
          </div>
        ) : faculty.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-12">No faculty records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-600">
              <thead>
                <tr className="border-b bg-slate-50 font-semibold text-slate-700">
                  <th className="px-6 py-3">Lecturer Name</th>
                  <th className="px-6 py-3">Faculty Code</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Designation</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {faculty.map((fac) => (
                  <tr key={fac.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-semibold text-slate-800">{fac.name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{fac.faculty_id_code}</td>
                    <td className="px-6 py-4">{fac.department_name} ({fac.department_code})</td>
                    <td className="px-6 py-4 font-medium text-slate-600">{fac.designation}</td>
                    <td className="px-6 py-4 text-xs">
                      <p>{fac.email}</p>
                      <p className="text-slate-400">{fac.phone || '—'}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(fac)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(fac.id)}
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
                {modalMode === 'add' ? 'Add New Faculty Member' : 'Edit Faculty Details'}
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
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Lecturer Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Faculty ID Code</label>
                  <input
                    type="text"
                    required
                    value={facultyIdCode}
                    onChange={(e) => setFacultyIdCode(e.target.value)}
                    placeholder="E.g., FAC2026001"
                    className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-800 focus:outline-none"
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
                    className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-800 focus:outline-none disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-800 focus:outline-none"
                  />
                </div>

                {modalMode === 'add' && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Login Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Defaults to Faculty@123"
                      className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-800 focus:outline-none"
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
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Designation</label>
                  <select
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-700 focus:outline-none"
                  >
                    <option value="Professor">Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Lecturer">Lecturer</option>
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

export default FacultyManagement;
