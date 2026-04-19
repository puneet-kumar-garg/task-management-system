import { PencilIcon, TrashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import { formatDate, isOverdue, isDueToday, getPriorityColor, getStatusColor } from '../utils/helpers';

export default function TaskCard({ task, onEdit, onDelete, onStatusChange }) {
  const overdue = isOverdue(task.deadline, task.status);
  const dueToday = isDueToday(task.deadline);

  return (
    <div className={`card hover:shadow-md transition-shadow ${overdue ? 'border-red-300 dark:border-red-700' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Complete toggle */}
        <button
          onClick={() => onStatusChange(task.id, task.status === 'completed' ? 'pending' : 'completed')}
          className="mt-0.5 flex-shrink-0 text-gray-400 hover:text-green-500 transition-colors"
        >
          {task.status === 'completed'
            ? <CheckCircleSolid className="w-5 h-5 text-green-500" />
            : <CheckCircleIcon className="w-5 h-5" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`font-medium text-sm ${task.status === 'completed' ? 'line-through text-gray-400' : 'dark:text-white'}`}>
              {task.title}
            </h3>
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => onEdit(task)} className="p-1 text-gray-400 hover:text-blue-500 rounded">
                <PencilIcon className="w-4 h-4" />
              </button>
              <button onClick={() => onDelete(task.id)} className="p-1 text-gray-400 hover:text-red-500 rounded">
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {task.description && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(task.status)}`}>
              {task.status.replace('_', ' ')}
            </span>
            {task.deadline && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                overdue ? 'badge-overdue' : dueToday ? 'badge-medium' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {overdue ? '⚠ Overdue' : dueToday ? '📅 Due today' : formatDate(task.deadline)}
              </span>
            )}
            {task.assignee_name && (
              <span className="text-xs text-gray-500 dark:text-gray-400">→ {task.assignee_name}</span>
            )}
            {task.team_name && (
              <span className="text-xs text-gray-500 dark:text-gray-400">🏷 {task.team_name}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
