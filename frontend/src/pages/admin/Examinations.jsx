import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Award, Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

const Examinations = () => {
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editingId, setEditingId] = useState(null);

  // Form Fields
  const [subjectId, setSubjectId] = useState('');
  const [examName, setExamName] = useState('');
  const [maxMarks, setMaxMarks] = useState('100');
  const [examDate, setExamDate] = useState('');
  const [examType, setExamType] = useState('INTERNAL');

  const fetchExams = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/examinations');
      setExams(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch examinations list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initData = async () => {
      try {
        const [examsRes, subjectsRes] = await Promise.all([
          api.get('/examinations'),
          api.get('/subjects')
        ]);
        setExams(examsRes.data);
        setSubjects(subjectsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  const handleOpenAdd = () => {
    setModalMode('add');
    setEditingId(null);
    setSubjectId(subjects[0]?.id || '');
    setExamName('');
    setMaxMarks('100');
    setExamDate('');
    setExamType('INTERNAL');
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (exam) => {
    setModalMode('edit');
    setEditingId(exam.id);
    setSubjectId(exam.subject_id);
    setExamName(exam.exam_name);
    setMaxMarks(String(exam.max_marks));
    setExamDate(exam.exam_date || '');
    setExamType(exam.exam_type);
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const payload = {
      subject_id: subjectId,
      exam_name: examName,
      max_marks: maxMarks,
      exam_date: examDate,
      exam_type: examType
    };

    try {
      if (modalMode === 'add') {
        await api.post('/examinations', payload);
        setSuccess('Examination created.');
      } else {
        await api.put(`/examinations/${editingId}`, payload);
        setSuccess('Examination details updated.');
      }

      confetti({ particleCount: 30 });
      setShowModal(false);
      await fetchExams();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save examination.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this examination? All entered student marks for this exam will be deleted.')) return;
    setError('');
    setSuccess('');

    try {
      await api.delete(`/examinations/${id}`);
      setSuccess('Examination deleted.');
      await fetchExams();
    } catch (err) {
      console.error(err);
      setError('Failed to delete examination.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-sans">Examinations Control</h1>
          <p className="text-sm text-slate-500 font-sans">Schedule examinations, configure maximum scores, and specify evaluation types.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-500 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Create Exam
        </button>
      </div>

      {success && (
        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-600 border border-green-100">
          {success}
        </div>
      )}

      {/* Grid table */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4 border-b pb-3 flex items-center gap-2">
          <Award className="h-5 w-5 text-slate-500" /> Scheduled Examinations
        </h3>

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"></div>
          </div>
        ) : exams.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-12">No exams scheduled.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-600">
              <thead>
                <tr className="border-b bg-slate-50 font-semibold text-slate-700">
                  <th className="px-6 py-3">Exam Name</th>
                  <th className="px-6 py-3">Subject</th>
                  <th className="px-6 py-3 text-center">Semester</th>
                  <th className="px-6 py-3 text-center">Max Marks</th>
                  <th className="px-6 py-3 text-center">Exam Date</th>
                  <th className="px-6 py-3 text-center">Exam Type</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {exams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-semibold text-slate-800">{exam.exam_name}</td>
                    <td className="px-6 py-4">
                      {exam.subjects?.subject_name} <span className="text-xs text-slate-400 font-mono">({exam.subjects?.subject_code})</span>
                    </td>
                    <td className="px-6 py-4 text-center">Sem {exam.subjects?.semester}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-900">{exam.max_marks}</td>
                    <td className="px-6 py-4 text-center">{exam.exam_date || '—'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        exam.exam_type === 'INTERNAL'
                          ? 'bg-blue-50 text-blue-700'
                          : exam.exam_type === 'EXTERNAL'
                          ? 'bg-purple-50 text-purple-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {exam.exam_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(exam)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(exam.id)}
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

      {/* Modal form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl border overflow-hidden">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-base font-bold text-slate-900 capitalize">
                {modalMode === 'add' ? 'Create Examination' : 'Edit Examination Details'}
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
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Exam Name</label>
                  <input
                    type="text"
                    required
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    placeholder="E.g., Midterm Assessment"
                    className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Subject Link</label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-700 focus:outline-none"
                  >
                    <option value="">Select subject...</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.subject_name} ({s.subject_code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Max Marks</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={maxMarks}
                    onChange={(e) => setMaxMarks(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Exam Date</label>
                  <input
                    type="date"
                    required
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Evaluation Type</label>
                  <select
                    value={examType}
                    onChange={(e) => setExamType(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-700 focus:outline-none"
                  >
                    <option value="INTERNAL">INTERNAL (IA)</option>
                    <option value="EXTERNAL">EXTERNAL (Finals)</option>
                    <option value="PRACTICAL">PRACTICAL</option>
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
                  {modalMode === 'add' ? 'Create Exam' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Examinations;
