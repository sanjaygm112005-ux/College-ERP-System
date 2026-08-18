import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Building2, Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editingId, setEditingId] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/departments');
      setDepartments(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch departments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleOpenAdd = () => {
    setModalMode('add');
    setEditingId(null);
    setName('');
    setCode('');
    setDescription('');
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (dept) => {
    setModalMode('edit');
    setEditingId(dept.id);
    setName(dept.name);
    setCode(dept.code);
    setDescription(dept.description || '');
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const payload = { name, code, description };

    try {
      if (modalMode === 'add') {
        await api.post('/departments', payload);
        setSuccess('Department added successfully.');
      } else {
        await api.put(`/departments/${editingId}`, payload);
        setSuccess('Department details updated.');
      }

      confetti({ particleCount: 30 });
      setShowModal(false);
      await fetchDepartments();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save department.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department? This will delete all course links.')) return;
    setError('');
    setSuccess('');

    try {
      await api.delete(`/departments/${id}`);
      setSuccess('Department deleted successfully.');
      await fetchDepartments();
    } catch (err) {
      console.error(err);
      setError('Failed to delete department.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-sans">Departments</h1>
          <p className="text-sm text-slate-500 font-sans">Add and configure college engineering departments.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-500 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Add Department
        </button>
      </div>

      {success && (
        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-600 border border-green-100">
          {success}
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100">
          {error}
        </div>
      )}

      {/* Grid List */}
      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"></div>
        </div>
      ) : departments.length === 0 ? (
        <p className="text-center text-sm text-slate-400 py-12">No department records created.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <div key={dept.id} className="rounded-2xl border bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow transition">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 border border-brand-100">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <span className="font-mono text-xs font-bold text-brand-600 bg-brand-50 border border-brand-100 rounded px-2 py-0.5 uppercase">
                    {dept.code}
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-800 mt-4">{dept.name}</h4>
                <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">{dept.description || 'No description added.'}</p>
              </div>

              <div className="flex justify-end gap-2 border-t mt-6 pt-4">
                <button
                  onClick={() => handleOpenEdit(dept)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(dept.id)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600 transition cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border overflow-hidden">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-base font-bold text-slate-900 capitalize">
                {modalMode === 'add' ? 'Add New Department' : 'Edit Department Details'}
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

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Department Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="E.g., Computer Science & Engineering"
                  className="mt-1 block w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Short Code</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="E.g., CSE"
                  className="mt-1 block w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Description</label>
                <textarea
                  rows="4"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide department description..."
                  className="mt-1 block w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-800 focus:outline-none"
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
                  {modalMode === 'add' ? 'Add Record' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentManagement;
