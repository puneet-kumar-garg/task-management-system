import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';
import toast from 'react-hot-toast';

const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES = ['pending', 'in_progress', 'completed'];

export default function TaskModal({ task, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium',
    status: 'pending', deadline: '', assignee_id: '', team_id: '',
  });
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        status: task.status || 'pending',
        deadline: task.deadline ? task.deadline.split('T')[0] : '',
        assignee_id: task.assignee_id || '',
        team_id: task.team_id || '',
      });
    }
    api.get('/teams').then((r) => setTeams(r.data)).catch(() => {});
  }, [task]);

  useEffect(() => {
    if (!userSearch.trim()) { setUsers([]); return; }
    const t = setTimeout(() => {
      api.get(`/users/search?q=${userSearch}`).then((r) => setUsers(r.data)).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [userSearch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, assignee_id: form.assignee_id || null, team_id: form.team_id || null, deadline: form.deadline || null };
      if (task?.id) {
        await api.put(`/tasks/${task.id}`, payload);
        toast.success('Task updated');
      } else {
        await api.post('/tasks', payload);
        toast.success('Task created');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold dark:text-white">{task?.id ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Title *</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="Task title" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Description</label>
            <textarea className="input resize-none" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">Priority</label>
              <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Deadline</label>
            <input type="date" className="input" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Team</label>
            <select className="input" value={form.team_id} onChange={(e) => setForm({ ...form, team_id: e.target.value })}>
              <option value="">No team</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Assign to</label>
            <input className="input" placeholder="Search by name or email..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
            {users.length > 0 && (
              <div className="mt-1 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                {users.map((u) => (
                  <button key={u.id} type="button"
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${form.assignee_id === u.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                    onClick={() => { setForm({ ...form, assignee_id: u.id }); setUserSearch(u.name); setUsers([]); }}>
                    <span className="font-medium dark:text-white">{u.name}</span>
                    <span className="text-gray-500 ml-2">{u.email}</span>
                  </button>
                ))}
              </div>
            )}
            {form.assignee_id && (
              <button type="button" className="text-xs text-red-500 mt-1" onClick={() => { setForm({ ...form, assignee_id: '' }); setUserSearch(''); }}>
                Clear assignee
              </button>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving...' : task?.id ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
