import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { CreditCard, Plus, Edit2, Trash2, X, AlertCircle, Filter } from 'lucide-react';
import confetti from 'canvas-confetti';

const FeeManagement = () => {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editingId, setEditingId] = useState(null);

  // Form Fields
  const [studentId, setStudentId] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('0');
  const [status, setStatus] = useState('PENDING');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [semester, setSemester] = useState('1');

  const fetchFees = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/fees', {
        params: { status: statusFilter }
      });
      setFees(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch fee records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initData = async () => {
      try {
        const [feesRes, studentsRes] = await Promise.all([
          api.get('/fees'),
          api.get('/students')
        ]);
        setFees(feesRes.data);
        setStudents(studentsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  useEffect(() => {
    fetchFees();
  }, [statusFilter]);

  const handleOpenAdd = () => {
    setModalMode('add');
    setEditingId(null);
    setStudentId(students[0]?.id || '');
    setTotalAmount('');
    setPaidAmount('0');
    setStatus('PENDING');
    setDueDate('');
    setDescription('');
    setSemester('1');
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (fee) => {
    setModalMode('edit');
    setEditingId(fee.id);
    setStudentId(fee.student_id);
    setTotalAmount(String(fee.total_amount));
    setPaidAmount(String(fee.paid_amount));
    setStatus(fee.status);
    setDueDate(fee.due_date);
    setDescription(fee.description);
    setSemester(String(fee.semester));
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const payload = {
      student_id: studentId,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      status,
      due_date: dueDate,
      description,
      semester
    };

    try {
      if (modalMode === 'add') {
        await api.post('/fees', payload);
        setSuccess('Fee invoice recorded successfully.');
      } else {
        await api.put(`/fees/${editingId}`, payload);
        setSuccess('Invoice updated.');
      }

      confetti({ particleCount: 30 });
      setShowModal(false);
      await fetchFees();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save fee invoice.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    setError('');
    setSuccess('');

    try {
      await api.delete(`/fees/${id}`);
      setSuccess('Invoice record deleted.');
      await fetchFees();
    } catch (err) {
      console.error(err);
      setError('Failed to delete invoice.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-sans">Fees & Billing Management</h1>
          <p className="text-sm text-slate-500 font-sans">View student balances, record tuition invoices, and track payments.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-500 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Create Invoice
        </button>
      </div>

      {success && (
        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-600 border border-green-100">
          {success}
        </div>
      )}

      {/* Filter */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
          <Filter className="h-4 w-4" /> Filter Status
        </div>
        <div className="max-w-xs">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-700 focus:outline-none"
          >
            <option value="">All Invoices</option>
            <option value="PAID">PAID</option>
            <option value="PARTIAL">PARTIAL</option>
            <option value="PENDING">PENDING</option>
          </select>
        </div>
      </div>

      {/* Grid table */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4 border-b pb-3 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-slate-500" /> Invoice History
        </h3>

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"></div>
          </div>
        ) : fees.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-12">No invoice logs found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-600">
              <thead>
                <tr className="border-b bg-slate-50 font-semibold text-slate-700">
                  <th className="px-6 py-3">Student</th>
                  <th className="px-6 py-3">ID Code</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3 text-center">Semester</th>
                  <th className="px-6 py-3 text-right">Total Billed</th>
                  <th className="px-6 py-3 text-right">Paid Amount</th>
                  <th className="px-6 py-3 text-right">Balance Due</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {fees.map((fee) => {
                  const balance = fee.total_amount - fee.paid_amount;
                  return (
                    <tr key={fee.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-semibold text-slate-800">{fee.student_name}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{fee.student_id_code}</td>
                      <td className="px-6 py-4">{fee.description}</td>
                      <td className="px-6 py-4 text-center">Sem {fee.semester}</td>
                      <td className="px-6 py-4 text-right font-medium">${fee.total_amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right text-emerald-600 font-semibold">${fee.paid_amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right text-rose-600 font-bold">${balance.toLocaleString()}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          fee.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700'
                            : fee.status === 'PARTIAL'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}>
                          {fee.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(fee)}
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(fee.id)}
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600 transition cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl border overflow-hidden">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-base font-bold text-slate-900 capitalize">
                {modalMode === 'add' ? 'Record Tuition Invoice' : 'Edit Invoice Record'}
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
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Student</label>
                  <select
                    value={studentId}
                    disabled={modalMode === 'edit'}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-700 disabled:bg-slate-50"
                  >
                    <option value="">Select Student...</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.student_id_code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Semester</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-700"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Total Billed</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Paid Amount</label>
                  <input
                    type="number"
                    min="0"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Payment Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-700 font-bold"
                  >
                    <option value="PAID">PAID</option>
                    <option value="PARTIAL">PARTIAL</option>
                    <option value="PENDING">PENDING</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Invoice Description</label>
                <textarea
                  rows="3"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="E.g., Tuition & Examination Fee - Sem 1"
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
                  {modalMode === 'add' ? 'Add Invoice' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeManagement;
