import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, ClipboardDocumentListIcon, CheckCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import toast from 'react-hot-toast';

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="card flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold dark:text-white">{value ?? '—'}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);

  const fetchData = async () => {
    const [statsRes, tasksRes] = await Promise.all([
      api.get('/tasks/stats'),
      api.get('/tasks?status=pending'),
    ]);
    setStats(statsRes.data);
    setTasks(tasksRes.data.slice(0, 5));
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    await api.delete(`/tasks/${id}`);
    toast.success('Task deleted');
    fetchData();
  };

  const handleStatusChange = async (id, status) => {
    await api.patch(`/tasks/${id}/status`, { status });
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Good day, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-gray-500 text-sm mt-1">Here's what's happening with your tasks</p>
        </div>
        <button onClick={() => { setEditTask(null); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-4 h-4" /> New Task
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Tasks" value={stats?.total} icon={ClipboardDocumentListIcon} color="bg-blue-500" />
        <StatCard label="Completed" value={stats?.completed} icon={CheckCircleIcon} color="bg-green-500" />
        <StatCard label="In Progress" value={stats?.in_progress} icon={ClockIcon} color="bg-yellow-500" />
        <StatCard label="Overdue" value={stats?.overdue} icon={ExclamationTriangleIcon} color="bg-red-500" />
      </div>

      {/* Recent tasks */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold dark:text-white">Recent Pending Tasks</h2>
          <Link to="/tasks" className="text-sm text-blue-600 hover:underline">View all →</Link>
        </div>
        {tasks.length === 0 ? (
          <div className="card text-center py-10 text-gray-400">
            <ClipboardDocumentListIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No pending tasks. Create one!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task}
                onEdit={(t) => { setEditTask(t); setShowModal(true); }}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <TaskModal task={editTask} onClose={() => setShowModal(false)} onSaved={fetchData} />
      )}
    </div>
  );
}
