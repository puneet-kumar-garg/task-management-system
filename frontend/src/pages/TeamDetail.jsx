import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserPlusIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function TeamDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchTeam = () => api.get(`/teams/${id}`).then((r) => setTeam(r.data)).catch(() => navigate('/teams'));
  useEffect(() => { fetchTeam(); }, [id]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/teams/${id}/members`, { email });
      toast.success('Member added');
      setEmail('');
      fetchTeam();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally { setLoading(false); }
  };

  const handleRemove = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    await api.delete(`/teams/${id}/members/${userId}`);
    toast.success('Member removed');
    fetchTeam();
  };

  if (!team) return (
    <div className="flex justify-center py-10">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
    </div>
  );

  const isOwner = team.owner_id === user?.id;

  return (
    <div className="space-y-5 max-w-2xl">
      <button
        onClick={() => navigate('/teams')}
        className="flex items-center gap-2 text-sm transition-colors"
        style={{ color: 'var(--text-muted)' }}
      >
        <ArrowLeftIcon className="w-4 h-4" /> Back to Teams
      </button>

      <div className="card">
        <h1 className="text-2xl font-bold">{team.name}</h1>
        {team.description && <p className="mt-1" style={{ color: 'var(--text-muted)' }}>{team.description}</p>}
        <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Owner: {team.owner_name}</p>
      </div>

      {isOwner && (
        <div className="card">
          <h2 className="font-semibold mb-3">Add Member</h2>
          <form onSubmit={handleAddMember} className="flex gap-2">
            <input className="input flex-1" type="email" placeholder="member@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <button type="submit" disabled={loading} className="btn-primary">
              <UserPlusIcon className="w-4 h-4" /> Add
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h2 className="font-semibold mb-3">Members ({team.members?.length})</h2>
        <div className="space-y-1">
          {team.members?.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between py-2.5 border-b last:border-0"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                  {member.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{member.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  member.role === 'owner'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {member.role}
                </span>
                {isOwner && member.id !== user.id && (
                  <button onClick={() => handleRemove(member.id)} className="text-gray-400 hover:text-red-500 p-1 transition-colors">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
