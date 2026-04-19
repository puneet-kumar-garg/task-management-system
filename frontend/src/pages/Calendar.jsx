import { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, parseISO } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import api from '../utils/api';
import TaskModal from '../components/TaskModal';

const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales: { 'en-US': enUS } });

const PRIORITY_COLOR = { high: '#ef4444', medium: '#eab308', low: '#22c55e' };

export default function CalendarPage() {
  const [tasks, setTasks] = useState([]);
  const [view, setView] = useState(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      const { data } = await api.get('/tasks');
      setTasks(data.filter((t) => t.deadline));
    } catch {}
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const events = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    start: parseISO(t.deadline),
    end: parseISO(t.deadline),
    allDay: true,
    resource: t,
  }));

  const eventStyleGetter = (event) => ({
    style: {
      backgroundColor: PRIORITY_COLOR[event.resource.priority] || '#3b82f6',
      borderRadius: '6px',
      border: 'none',
      fontSize: '11px',
      padding: '2px 6px',
      color: '#fff',
      opacity: event.resource.status === 'completed' ? 0.5 : 1,
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <div className="flex gap-2">
          {[Views.MONTH, Views.WEEK, Views.DAY].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${view === v ? 'bg-blue-600 text-white' : 'btn-secondary'}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="rbc-wrapper card p-0 overflow-hidden" style={{ height: 640 }}>
        <Calendar
          localizer={localizer}
          events={events}
          view={view}
          date={date}
          onView={setView}
          onNavigate={setDate}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={(e) => { setSelectedTask(e.resource); setShowModal(true); }}
          style={{ height: '100%' }}
        />
      </div>

      <div className="flex gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
        {Object.entries(PRIORITY_COLOR).map(([p, c]) => (
          <div key={p} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
            <span className="capitalize">{p} priority</span>
          </div>
        ))}
      </div>

      {showModal && (
        <TaskModal task={selectedTask} onClose={() => setShowModal(false)} onSaved={fetchTasks} />
      )}
    </div>
  );
}
