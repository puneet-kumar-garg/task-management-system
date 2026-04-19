import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import api from '../../utils/api';

const NAV_ACTIONS = [
  { id: 'nav-dashboard', label: 'Go to Dashboard', icon: '🏠', path: '/' },
  { id: 'nav-tasks',     label: 'Go to Tasks',     icon: '📋', path: '/tasks' },
  { id: 'nav-kanban',    label: 'Go to Kanban',    icon: '🗂',  path: '/kanban' },
  { id: 'nav-teams',     label: 'Go to Teams',     icon: '👥', path: '/teams' },
  { id: 'nav-analytics', label: 'Go to Analytics', icon: '📊', path: '/analytics' },
  { id: 'nav-calendar',  label: 'Go to Calendar',  icon: '📅', path: '/calendar' },
];

export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [tasks, setTasks] = useState([]);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) { setQuery(''); setSelected(0); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) { setTasks([]); return; }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get(`/tasks?search=${encodeURIComponent(query)}&limit=5`);
        setTasks(data);
      } catch { setTasks([]); }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const filtered = query
    ? [...tasks.map((t) => ({ id: `task-${t.id}`, label: t.title, icon: '📌', path: `/tasks`, sub: t.status })),
       ...NAV_ACTIONS.filter((a) => a.label.toLowerCase().includes(query.toLowerCase()))]
    : NAV_ACTIONS;

  const handleSelect = (item) => {
    navigate(item.path);
    onClose();
  };

  const handleKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && filtered[selected]) handleSelect(filtered[selected]);
    if (e.key === 'Escape') onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="cmd-overlay" onClick={onClose}>
          <motion.div
            className="cmd-box"
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
                onKeyDown={handleKey}
                placeholder="Search tasks or navigate…"
                className="flex-1 bg-transparent text-sm outline-none dark:text-white placeholder-gray-400"
              />
              <kbd className="text-[10px] text-gray-400 border border-gray-200 dark:border-gray-600 rounded px-1.5 py-0.5">ESC</kbd>
            </div>

            {/* Results */}
            <div className="max-h-72 overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-6">No results found</p>
              ) : filtered.map((item, i) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelected(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    i === selected ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium dark:text-white truncate">{item.label}</p>
                    {item.sub && <p className="text-xs text-gray-400 capitalize">{item.sub.replace('_', ' ')}</p>}
                  </div>
                  {i === selected && <kbd className="text-[10px] text-gray-400 border border-gray-200 dark:border-gray-600 rounded px-1.5 py-0.5">↵</kbd>}
                </button>
              ))}
            </div>

            <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 flex gap-4 text-[10px] text-gray-400">
              <span><kbd className="border border-gray-200 dark:border-gray-600 rounded px-1">↑↓</kbd> navigate</span>
              <span><kbd className="border border-gray-200 dark:border-gray-600 rounded px-1">↵</kbd> select</span>
              <span><kbd className="border border-gray-200 dark:border-gray-600 rounded px-1">esc</kbd> close</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
