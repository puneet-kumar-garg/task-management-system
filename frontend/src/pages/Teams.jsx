import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, UserGroupIcon, XMarkIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);

  const fetchTeams = () => api.get('/teams').then((r) => setTeams(r.data)).catch(() => {});
  useEffect(() => { fetchTeams(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/teams', form);
      toast.success('Team created');
      setShowModal(false);
      setForm({ name: '', description: '' });
      fetchTeams();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create team');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this team?')) return;
    await api.delete(`/teams/${id}`);
    toast.success('Team deleted');
    fetchTeams();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Teams</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <PlusIcon className="w-4 h-4" /> New Team
        </button>
      </div>

      {teams.length === 0 ? (
        <div className="card text-center py-12" style={{ color: 'var(--text-muted)' }}>
          <UserGroupIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p>No teams yet. Create one to collaborate!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <div key={team.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <UserGroupIcon className="w-5 h-5 text-indigo-600" />
                </div>
                <button onClick={() => handleDelete(team.id)} className="text-gray-400 hover:text-red-500 p-1 transition-colors">
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-semibold mt-3">{team.name}</h3>
              {team.description && <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{team.description}</p>}
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{team.member_count} member{team.member_count !== 1 ? 's' : ''}</span>
                <Link to={`/teams/${team.id}`} className="text-sm text-blue-500 hover:underline">Manage →</Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="rounded-xl shadow-2xl w-full max-w-md" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-lg font-semibold">Create Team</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Team Name *</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Engineering" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Description</label>
                <textarea className="input resize-none" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
