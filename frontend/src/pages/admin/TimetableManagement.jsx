import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Calendar, Plus, Edit2, Trash2, X, AlertCircle, Filter, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';

const TimetableManagement = () => {
  const [timetable, setTimetable] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Roster parameters
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSem, setSelectedSem] = useState('');
  const [selectedSec, setSelectedSec] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [editingId, setEditingId] = useState(null);

  // Form Fields
  const [dayOfWeek, setDayOfWeek] = useState('Monday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [subjectId, setSubjectId] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [classroom, setClassroom] = useState('');
  const [deptId, setDeptId] = useState('');
  const [semester, setSemester] = useState('1');
  const [section, setSection] = useState('A');

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/timetable', {
        params: {
          department_id: selectedDept,
          semester: selectedSem,
          section: selectedSec
        }
      });
      setTimetable(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch class schedules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initData = async () => {
      try {
        const [depts, facs, subs] = await Promise.all([
          api.get('/departments'),
          api.get('/faculty'),
          api.get('/subjects')
        ]);
        setDepartments(depts.data);
        setFaculty(facs.data);
        setSubjects(subs.data);
        
        // Default filters to first dept if any
        if (depts.data.length > 0) {
          setSelectedDept(depts.data[0].id);
          setSelectedSem('1');
          setSelectedSec('A');
        }
      } catch (err) {
        console.error(err);
      }
    };
    initData();
  }, []);

  // Fetch timetable slots when filters are set
  useEffect(() => {
    if (selectedDept && selectedSem && selectedSec) {
      fetchTimetable();
    }
  }, [selectedDept, selectedSem, selectedSec]);

  const handleOpenAdd = () => {
    setModalMode('add');
    setEditingId(null);
    setDayOfWeek('Monday');
    setStartTime('09:00');
    setEndTime('10:00');
    setSubjectId(subjects[0]?.id || '');
    setFacultyId(faculty[0]?.id || '');
    setClassroom('');
    setDeptId(selectedDept || departments[0]?.id || '');
    setSemester(selectedSem || '1');
    setSection(selectedSec || 'A');
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (slot) => {
    setModalMode('edit');
    setEditingId(slot.id);
    setDayOfWeek(slot.day_of_week);
    setStartTime(slot.start_time.slice(0, 5));
    setEndTime(slot.end_time.slice(0, 5));
    setSubjectId(slot.subject_id || '');
    setFacultyId(slot.faculty_id || '');
    setClassroom(slot.classroom);
    setDeptId(slot.department_id || '');
    setSemester(String(slot.semester));
    setSection(slot.section);
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Append seconds to matches DB schema TIME structure
    const start_time_full = startTime.length === 5 ? `${startTime}:00` : startTime;
    const end_time_full = endTime.length === 5 ? `${endTime}:00` : endTime;

    const payload = {
      day_of_week: dayOfWeek,
      start_time: start_time_full,
      end_time: end_time_full,
      subject_id: subjectId,
      faculty_id: facultyId,
      classroom,
      department_id: deptId,
      semester,
      section
    };

    try {
      if (modalMode === 'add') {
        await api.post('/timetable', payload);
        setSuccess('Schedule slot added.');
      } else {
        await api.put(`/timetable/${editingId}`, payload);
        setSuccess('Schedule slot updated.');
      }

      confetti({ particleCount: 30 });
      setShowModal(false);
      await fetchTimetable();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save timetable slot.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this schedule slot?')) return;
    setError('');
    setSuccess('');

    try {
      await api.delete(`/timetable/${id}`);
      setSuccess('Slot removed successfully.');
      await fetchTimetable();
    } catch (err) {
      console.error(err);
      setError('Failed to delete slot.');
    }
  };

  // Group slots by Day
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timetableByDay = {};
  days.forEach(d => {
    timetableByDay[d] = timetable.filter(slot => slot.day_of_week === d);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-sans">Timetable Management</h1>
          <p className="text-sm text-slate-500 font-sans font-medium">Design and configure academic timetable grids.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-500 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Add Time Slot
        </button>
      </div>

      {success && (
        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-600 border border-green-100">
          {success}
        </div>
      )}

      {/* Roster parameters selector */}
      <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
          <Filter className="h-4 w-4" /> Select Class Grid
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase">Department</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-700 focus:outline-none"
            >
              <option value="">Select Department...</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
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
              {['A', 'B', 'C', 'D'].map(sec => (
                <option key={sec} value={sec}>Section {sec}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Timetable Weekly calendar layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {days.map((day) => {
          const slots = timetableByDay[day] || [];
          return (
            <div key={day} className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-4 border-b pb-2 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-brand-500" /> {day}
              </h3>

              {loading ? (
                <div className="flex h-16 items-center justify-center">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent"></div>
                </div>
              ) : slots.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 italic">No lectures scheduled.</p>
              ) : (
                <div className="space-y-3">
                  {slots.map((slot) => (
                    <div key={slot.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-4 border border-slate-100">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">{slot.subject_name}</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Lecturer: <span className="font-semibold">{slot.faculty_name || 'Unassigned'}</span>
                        </p>
                        <p className="text-[10px] font-bold text-brand-600 bg-brand-50 rounded-full px-2 py-0.5 inline-block mt-2">
                          Classroom {slot.classroom}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-white rounded-lg p-2 shadow-sm border">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                        </span>
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleOpenEdit(slot)}
                            className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(slot.id)}
                            className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-red-600 transition cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl border overflow-hidden">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h3 className="text-base font-bold text-slate-900 capitalize">
                {modalMode === 'add' ? 'Add Timetable Slot' : 'Edit Timetable Slot'}
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
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Day of Week</label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-700"
                  >
                    {days.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Classroom</label>
                  <input
                    type="text"
                    required
                    value={classroom}
                    onChange={(e) => setClassroom(e.target.value)}
                    placeholder="E.g., CR-101"
                    className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Start Time</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">End Time</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-200 p-2 text-sm text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Subject</label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-700"
                  >
                    <option value="">Select subject...</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.subject_name} ({s.subject_code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Faculty Lecturer</label>
                  <select
                    value={facultyId}
                    onChange={(e) => setFacultyId(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-700"
                  >
                    <option value="">Select lecturer...</option>
                    {faculty.map(f => (
                      <option key={f.id} value={f.id}>{f.name} ({f.faculty_id_code})</option>
                    ))}
                  </select>
                </div>

                {/* Invisible Form Bindings to enforce filter grids */}
                <input type="hidden" value={deptId} />
                <input type="hidden" value={semester} />
                <input type="hidden" value={section} />
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
                  {modalMode === 'add' ? 'Add Slot' : 'Save Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableManagement;
