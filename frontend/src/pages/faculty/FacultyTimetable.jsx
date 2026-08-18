import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

const FacultyTimetable = () => {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const { data } = await api.get('/timetable', {
          params: { faculty_id: user.id }
        });
        setSchedule(data);
      } catch (err) {
        console.error('Error fetching timetable:', err);
        setError('Failed to fetch teaching schedule.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) fetchTimetable();
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
        <h3 className="mt-4 text-lg font-bold">Timetable Error</h3>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    );
  }

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Map slots to days
  const scheduleByDay = {};
  days.forEach(day => {
    scheduleByDay[day] = schedule.filter(slot => slot.day_of_week === day);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-sans">Teaching Timetable</h1>
        <p className="text-sm text-slate-500">Track your weekly lecture schedules, assigned sections, and classrooms.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {days.map((day) => {
          const slots = scheduleByDay[day] || [];
          return (
            <div key={day} className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-4 border-b pb-2 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-brand-500" /> {day}
              </h3>
              
              {slots.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 italic">No lectures scheduled.</p>
              ) : (
                <div className="space-y-3">
                  {slots.map((slot) => (
                    <div key={slot.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-4 border border-slate-100">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">{slot.subject_name}</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          Class: <span className="font-semibold">Sem {slot.semester} - Section {slot.section}</span>
                        </p>
                        <p className="text-[10px] font-bold text-brand-600 bg-brand-50 rounded-full px-2 py-0.5 inline-block mt-2">
                          Classroom {slot.classroom}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-white rounded-lg p-2 shadow-sm border">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FacultyTimetable;
