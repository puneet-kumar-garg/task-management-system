import { useState, useEffect, useCallback } from 'react';
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import toast from 'react-hot-toast';

const STATUSES = ['', 'pending', 'in_progress', 'completed'];
const PRIORITIES = ['', 'high', 'medium', 'low'];

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.priority) params.set('priority', filters.priority);
      if (filters.search) params.set('search', filters.search);
      const { data } = await api.get(`/tasks?${params}`);
      setTasks(data);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(fetchTasks, filters.search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchTasks, filters.search]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    await api.delete(`/tasks/${id}`);
    toast.success('Task deleted');
    fetchTasks();
  };

  const handleStatusChange = async (id, status) => {
    await api.patch(`/tasks/${id}/status`, { status });
    fetchTasks();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <button onClick={() => { setEditTask(null); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-4 h-4" /> New Task
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="input pl-9" placeholder="Search tasks..." value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <select className="input w-auto" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All Status</option>
              {STATUSES.filter(Boolean).map((s) => <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
            </select>
            <select className="input w-auto" value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
              <option value="">All Priority</option>
              {PRIORITIES.filter(Boolean).map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Task list */}
      {loading ? (
        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : tasks.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <FunnelIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>No tasks found. {!filters.status && !filters.priority && !filters.search && 'Create your first task!'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">{tasks.length} task{tasks.length !== 1 ? 's' : ''} found</p>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task}
              onEdit={(t) => { setEditTask(t); setShowModal(true); }}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {showModal && (
        <TaskModal task={editTask} onClose={() => setShowModal(false)} onSaved={fetchTasks} />
      )}
    </div>
  );
}
