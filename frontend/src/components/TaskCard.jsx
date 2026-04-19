import { motion } from 'framer-motion';
import { PencilIcon, TrashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import { formatDate, isOverdue, isDueToday } from '../utils/helpers';

const PRIORITY_BORDER = { high: 'priority-high', medium: 'priority-medium', low: 'priority-low' };
const PRIORITY_BADGE  = { high: 'badge badge-high', medium: 'badge badge-medium', low: 'badge badge-low' };
const STATUS_BADGE = {
  completed:   'badge bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  in_progress: 'badge bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  pending:     'badge bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

const Avatar = ({ name, avatar, size = 6 }) => (
  avatar
    ? <img src={avatar} alt={name} className={`w-${size} h-${size} rounded-full object-cover ring-2 ring-white dark:ring-gray-800`} />
    : <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-white dark:ring-gray-800`}>
        {name?.[0]?.toUpperCase()}
      </div>
);

export default function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const overdue  = isOverdue(task.deadline, task.status);
  const dueToday = isDueToday(task.deadline);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18 }}
      className={`card ${PRIORITY_BORDER[task.priority]} ${overdue ? 'ring-1 ring-red-300 dark:ring-red-700' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* Complete toggle */}
        <button
          onClick={() => onStatusChange(task.id, task.status === 'completed' ? 'pending' : 'completed')}
          className="mt-0.5 flex-shrink-0 text-gray-300 hover:text-green-500 transition-colors"
        >
          {task.status === 'completed'
            ? <CheckCircleSolid className="w-5 h-5 text-green-500" />
            : <CheckCircleIcon className="w-5 h-5" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`font-medium text-sm leading-snug ${task.status === 'completed' ? 'line-through text-gray-400' : 'dark:text-white'}`}>
              {task.title}
            </h3>
            <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => onEdit(task)} className="p-1 text-gray-400 hover:text-blue-500 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                <PencilIcon className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => onDelete(task.id)} className="p-1 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {task.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{task.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            <span className={PRIORITY_BADGE[task.priority]}>{task.priority}</span>
            <span className={STATUS_BADGE[task.status]}>{task.status.replace('_', ' ')}</span>

            {task.deadline && (
              <span className={`badge ${overdue ? 'badge-overdue' : dueToday ? 'badge-medium' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                {overdue ? '⚠ Overdue' : dueToday ? '📅 Due today' : `📅 ${formatDate(task.deadline)}`}
              </span>
            )}

            {task.team_name && (
              <span className="badge bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400">
                🏷 {task.team_name}
              </span>
            )}
          </div>

          {/* Assignee */}
          {task.assignee_name && (
            <div className="flex items-center gap-1.5 mt-2.5">
              <Avatar name={task.assignee_name} avatar={task.assignee_avatar} size={5} />
              <span className="text-xs text-gray-500 dark:text-gray-400">{task.assignee_name}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
