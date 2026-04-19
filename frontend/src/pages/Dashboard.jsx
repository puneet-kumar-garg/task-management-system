import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PlusIcon, ClipboardDocumentListIcon, CheckCircleIcon,
  ClockIcon, ExclamationTriangleIcon, ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import { SkeletonStat, SkeletonList } from '../components/ui/SkeletonLoader';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import toast from 'react-hot-toast';

const KPI_CONFIG = [
  { key: 'total',       label: 'Total Tasks',  icon: ClipboardDocumentListIcon, gradient: 'from-blue-500 to-blue-600' },
  { key: 'completed',   label: 'Completed',    icon: CheckCircleIcon,           gradient: 'from-green-500 to-green-600' },
  { key: 'in_progress', label: 'In Progress',  icon: ClockIcon,                 gradient: 'from-yellow-500 to-orange-500' },
  { key: 'overdue',     label: 'Overdue',      icon: ExclamationTriangleIcon,   gradient: 'from-red-500 to-red-600' },
];

const KPICard = ({ label, value, icon: Icon, gradient, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.08, duration: 0.3 }}
    className="kpi-card"
  >
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm flex-shrink-0`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold dark:text-white">{value ?? '—'}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      </div>
    </div>
  </motion.div>
);

const PAGE_SIZE = 10;

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/tasks/stats');
      setStats(data);
    } catch {} finally { setLoadingStats(false); }
  }, []);

  const fetchTasks = useCallback(async (p = 1, append = false) => {
    setLoadingTasks(true);
    try {
      const { data } = await api.get(`/tasks?status=pending&page=${p}&limit=${PAGE_SIZE}`);
      setTasks((prev) => append ? [...prev, ...data] : data);
      setHasMore(data.length === PAGE_SIZE);
    } catch {} finally { setLoadingTasks(false); }
  }, []);

  useEffect(() => { fetchStats(); fetchTasks(1); }, []);

  // Real-time sync
  useEffect(() => {
    const handler = () => { fetchStats(); fetchTasks(1); };
    window.addEventListener('task_update', handler);
    return () => window.removeEventListener('task_update', handler);
  }, []);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingTasks) return;
    const next = page + 1;
    setPage(next);
    fetchTasks(next, true);
  }, [hasMore, loadingTasks, page, fetchTasks]);

  const sentinelRef = useInfiniteScroll(loadMore, hasMore);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    await api.delete(`/tasks/${id}`);
    toast.success('Task deleted');
    fetchStats();
    fetchTasks(1);
  };

  const handleStatusChange = async (id, status) => {
    await api.patch(`/tasks/${id}/status`, { status });
    fetchStats();
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const completionPct = stats?.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Good day, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Here's what's happening with your tasks</p>
        </div>
        <button onClick={() => { setEditTask(null); setShowModal(true); }} className="btn-primary">
          <PlusIcon className="w-4 h-4" /> New Task
        </button>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loadingStats
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)
          : KPI_CONFIG.map((k, i) => <KPICard key={k.key} {...k} value={stats?.[k.key]} index={i} />)
        }
      </div>

      {/* Progress bar */}
      {!loadingStats && stats?.total > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ArrowTrendingUpIcon className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium dark:text-white">Overall Progress</span>
            </div>
            <span className="text-sm font-bold text-blue-600">{completionPct}%</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${completionPct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </motion.div>
      )}

      {/* Task list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold dark:text-white">Pending Tasks</h2>
          <Link to="/tasks" className="text-sm text-blue-600 hover:underline">View all →</Link>
        </div>

        {loadingTasks && tasks.length === 0 ? (
          <SkeletonList count={4} />
        ) : tasks.length === 0 ? (
          <div className="card text-center py-12 text-gray-400">
            <ClipboardDocumentListIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No pending tasks. You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-3 group">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task}
                onEdit={(t) => { setEditTask(t); setShowModal(true); }}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            ))}
            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-4" />
            {loadingTasks && <SkeletonList count={2} />}
          </div>
        )}
      </div>

      {showModal && (
        <TaskModal task={editTask} onClose={() => setShowModal(false)} onSaved={() => { fetchStats(); fetchTasks(1); }} />
      )}
    </div>
  );
}
