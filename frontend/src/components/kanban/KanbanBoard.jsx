import { useState, useEffect, useCallback } from 'react';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon } from '@heroicons/react/24/outline';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import TaskModal from '../TaskModal';

const COLUMNS = [
  { id: 'pending',     label: 'To Do',       color: 'bg-gray-400',   ring: 'ring-gray-200 dark:ring-gray-700' },
  { id: 'in_progress', label: 'In Progress',  color: 'bg-blue-500',   ring: 'ring-blue-200 dark:ring-blue-900' },
  { id: 'completed',   label: 'Done',         color: 'bg-green-500',  ring: 'ring-green-200 dark:ring-green-900' },
];

const PRIORITY_BORDER = { high: 'border-l-red-400', medium: 'border-l-yellow-400', low: 'border-l-green-400' };

function KanbanCard({ task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-xl p-3 shadow-sm border-l-4 ${PRIORITY_BORDER[task.priority]} cursor-grab active:cursor-grabbing select-none hover:shadow-md transition-shadow`}
      style={{ backgroundColor: 'var(--bg-card)' }}
    >
      <p className="text-sm font-medium line-clamp-2">{task.title}</p>
      {task.deadline && (
        <p className="text-xs text-gray-400 mt-1.5">📅 {task.deadline?.split('T')[0]}</p>
      )}
      <div className="flex items-center justify-between mt-2">
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
          task.priority === 'high' ? 'bg-red-100 text-red-600' :
          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'
        }`}>{task.priority}</span>
        {task.assignee_name && (
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-[9px] font-bold">
            {task.assignee_name[0]}
          </div>
        )}
      </div>
    </div>
  );
}

function Column({ col, tasks, onAddTask }) {
  return (
    <div className={`kanban-col ring-1 ${col.ring}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
          <span className="text-sm font-semibold">{col.label}</span>
          <span className="text-xs text-gray-400 bg-gray-200 rounded-full px-1.5">{tasks.length}</span>
        </div>
        <button onClick={() => onAddTask(col.id)} className="p-1 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors">
          <PlusIcon className="w-4 h-4" />
        </button>
      </div>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <AnimatePresence>
          {tasks.map((task) => (
            <motion.div key={task.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <KanbanCard task={task} />
            </motion.div>
          ))}
        </AnimatePresence>
      </SortableContext>
    </div>
  );
}

export default function KanbanBoard() {
  const [tasks, setTasks] = useState({ pending: [], in_progress: [], completed: [] });
  const [activeTask, setActiveTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState('pending');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const fetchTasks = useCallback(async () => {
    try {
      const { data } = await api.get('/tasks');
      const grouped = { pending: [], in_progress: [], completed: [] };
      data.forEach((t) => { if (grouped[t.status]) grouped[t.status].push(t); });
      setTasks(grouped);
    } catch { toast.error('Failed to load tasks'); }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // Real-time sync
  useEffect(() => {
    const handler = () => fetchTasks();
    window.addEventListener('task_update', handler);
    return () => window.removeEventListener('task_update', handler);
  }, [fetchTasks]);

  const findColumn = (taskId) => {
    for (const col of Object.keys(tasks)) {
      if (tasks[col].find((t) => t.id === taskId)) return col;
    }
    return null;
  };

  const handleDragStart = ({ active }) => {
    const col = findColumn(active.id);
    setActiveTask(tasks[col]?.find((t) => t.id === active.id));
  };

  const handleDragEnd = async ({ active, over }) => {
    setActiveTask(null);
    if (!over) return;
    const fromCol = findColumn(active.id);
    const toCol = COLUMNS.find((c) => c.id === over.id)?.id || findColumn(over.id);
    if (!toCol || fromCol === toCol) return;

    // Optimistic update
    setTasks((prev) => {
      const task = prev[fromCol].find((t) => t.id === active.id);
      return {
        ...prev,
        [fromCol]: prev[fromCol].filter((t) => t.id !== active.id),
        [toCol]: [...prev[toCol], { ...task, status: toCol }],
      };
    });

    try {
      await api.patch(`/tasks/${active.id}/status`, { status: toCol });
    } catch {
      toast.error('Failed to update status');
      fetchTasks(); // revert
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kanban Board</h1>
        <button onClick={() => { setDefaultStatus('pending'); setShowModal(true); }} className="btn-primary">
          <PlusIcon className="w-4 h-4" /> New Task
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <Column key={col.id} col={col} tasks={tasks[col.id] || []} onAddTask={(s) => { setDefaultStatus(s); setShowModal(true); }} />
          ))}
        </div>
        <DragOverlay>
          {activeTask && <KanbanCard task={activeTask} />}
        </DragOverlay>
      </DndContext>

      {showModal && (
        <TaskModal
          task={null}
          defaultStatus={defaultStatus}
          onClose={() => setShowModal(false)}
          onSaved={fetchTasks}
        />
      )}
    </div>
  );
}
