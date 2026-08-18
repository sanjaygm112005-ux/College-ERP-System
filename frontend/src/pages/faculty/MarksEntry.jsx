import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Award, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

const MarksEntry = () => {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  
  // Marks record sheet
  const [records, setRecords] = useState([]);
  const [examMeta, setExamMeta] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const { data } = await api.get('/examinations');
        setExams(data);
      } catch (err) {
        console.error('Error loading exams:', err);
      }
    };
    fetchExams();
  }, []);

  const handleLoadMarksSheet = async () => {
    if (!selectedExam) return;
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data } = await api.get(`/marks/exam/${selectedExam}`);
      setExamMeta(data.examination);
      setRecords(data.records);
    } catch (err) {
      console.error(err);
      setError('Failed to load student exam record sheet.');
    } finally {
      setLoading(false);
    }
  };

  // Recalculates grade live in client State!
  const calculateGradeLive = (total, max) => {
    if (max <= 0) return { grade: 'F', result: 'FAIL' };
    const pct = (total / max) * 100;
    let grade = 'F';
    let result = 'FAIL';

    if (pct >= 90) grade = 'O';
    else if (pct >= 80) grade = 'A+';
    else if (pct >= 70) grade = 'A';
    else if (pct >= 60) grade = 'B';
    else if (pct >= 50) grade = 'C';
    else if (pct >= 40) grade = 'P';

    if (grade !== 'F') result = 'PASS';

    return { grade, result };
  };

  const handleScoreChange = (studentId, field, value) => {
    const parsedVal = parseFloat(value) || 0;

    setRecords(prev =>
      prev.map(rec => {
        if (rec.student_id === studentId) {
          const updated = { ...rec, [field]: parsedVal };
          const newTotal = (field === 'internal_marks' ? parsedVal : rec.internal_marks) +
                           (field === 'external_marks' ? parsedVal : rec.external_marks);

          const { grade, result } = calculateGradeLive(newTotal, examMeta.max_marks);
          return {
            ...updated,
            total_marks: newTotal,
            grade,
            result
          };
        }
        return rec;
      })
    );
  };

  const handleSaveMarks = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = records.map(rec => ({
        student_id: rec.student_id,
        internal_marks: rec.internal_marks,
        external_marks: rec.external_marks
      }));

      await api.post('/marks', {
        examination_id: selectedExam,
        records: payload
      });

      setSuccess('Student scores updated and grades recorded.');
      confetti({
        particleCount: 50,
        spread: 30
      });
    } catch (err) {
      console.error(err);
      setError('Failed to record student scores.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-sans">Marks Entry</h1>
        <p className="text-sm text-slate-500">Record and publish student marks for specific internal or external examinations.</p>
      </div>

      {/* Selector */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-4">
        <div className="max-w-md">
          <label className="block text-xs font-semibold text-slate-400 uppercase">Select Examination</label>
          <div className="mt-1 flex gap-3">
            <select
              value={selectedExam}
              onChange={(e) => {
                setSelectedExam(e.target.value);
                setRecords([]);
              }}
              className="block w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              <option value="">Select an exam...</option>
              {exams.map(e => (
                <option key={e.id} value={e.id}>
                  {e.exam_name} - {e.subjects?.subject_name} (Sem {e.subjects?.semester})
                </option>
              ))}
            </select>
            <button
              onClick={handleLoadMarksSheet}
              disabled={!selectedExam}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-50 transition cursor-pointer"
            >
              Load
            </button>
          </div>
        </div>
      </div>

      {/* Marks sheet */}
      {records.length > 0 && examMeta && (
        <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
          <div className="border-b pb-4 mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="h-5 w-5 text-slate-500" /> Exam Marks List ({examMeta.exam_name})
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Subject: {examMeta.subjects?.subject_name} | Max Marks: {examMeta.max_marks} | Type: {examMeta.exam_type}
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-100">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg bg-green-50 p-3 text-xs text-green-600 border border-green-100">
              {success}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-600">
              <thead>
                <tr className="border-b bg-slate-50 font-semibold text-slate-700">
                  <th className="px-6 py-3">Student Name</th>
                  <th className="px-6 py-3">ID Code</th>
                  <th className="px-6 py-3 text-center w-32">Internals</th>
                  <th className="px-6 py-3 text-center w-32">Externals</th>
                  <th className="px-6 py-3 text-center w-28">Total</th>
                  <th className="px-6 py-3 text-center w-24">Grade</th>
                  <th className="px-6 py-3 text-center w-24">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {records.map((rec) => (
                  <tr key={rec.student_id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-semibold text-slate-800">{rec.name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">{rec.student_id_code}</td>
                    
                    {/* Internals */}
                    <td className="px-6 py-4 text-center">
                      <input
                        type="number"
                        min="0"
                        max={examMeta.max_marks}
                        value={rec.internal_marks}
                        onChange={(e) => handleScoreChange(rec.student_id, 'internal_marks', e.target.value)}
                        className="w-20 rounded border border-slate-200 px-2 py-1 text-center font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </td>

                    {/* Externals */}
                    <td className="px-6 py-4 text-center">
                      <input
                        type="number"
                        min="0"
                        max={examMeta.max_marks}
                        value={rec.external_marks}
                        disabled={examMeta.exam_type === 'INTERNAL'}
                        onChange={(e) => handleScoreChange(rec.student_id, 'external_marks', e.target.value)}
                        className="w-20 rounded border border-slate-200 px-2 py-1 text-center font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
                      />
                    </td>

                    {/* Total */}
                    <td className="px-6 py-4 text-center font-bold text-slate-800">
                      {rec.total_marks}
                    </td>

                    {/* Grade */}
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-brand-500 text-white font-bold text-xs">
                        {rec.grade}
                      </span>
                    </td>

                    {/* Result */}
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        rec.result === 'PASS'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}>
                        {rec.result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={handleSaveMarks}
              disabled={saving}
              className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-500 transition cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Publishing...' : 'Publish Scores'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarksEntry;
