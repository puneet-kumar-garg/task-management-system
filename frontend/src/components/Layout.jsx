import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HomeIcon, ClipboardDocumentListIcon, UserGroupIcon,
  BellIcon, UserCircleIcon, SunIcon, MoonIcon,
  Bars3Icon, XMarkIcon, ArrowRightOnRectangleIcon,
  ChartBarIcon, CalendarIcon, ViewColumnsIcon,
  ChevronLeftIcon, MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NotificationBell from './ui/NotificationBell';
import CommandPalette from './ui/CommandPalette';

const navItems = [
  { to: '/',          icon: HomeIcon,                  label: 'Dashboard' },
  { to: '/tasks',     icon: ClipboardDocumentListIcon, label: 'Tasks' },
  { to: '/kanban',    icon: ViewColumnsIcon,           label: 'Kanban' },
  { to: '/calendar',  icon: CalendarIcon,              label: 'Calendar' },
  { to: '/analytics', icon: ChartBarIcon,              label: 'Analytics' },
  { to: '/teams',     icon: UserGroupIcon,             label: 'Teams' },
  { to: '/activity',  icon: BellIcon,                  label: 'Activity' },
  { to: '/profile',   icon: UserCircleIcon,            label: 'Profile' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setCmdOpen(true); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  const SidebarContent = ({ mobile = false }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className={`flex items-center gap-3 px-4 py-5 border-b ${collapsed && !mobile ? 'justify-center' : ''}`}
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
          <ClipboardDocumentListIcon className="w-5 h-5 text-white" />
        </div>
        {(!collapsed || mobile) && (
          <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            TaskFlow
          </span>
        )}
        {mobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto"
            style={{ color: 'var(--text-muted)' }}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative ${
                collapsed && !mobile ? 'justify-center' : ''
              } ${isActive ? 'nav-active' : 'nav-item'}`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 rounded-xl"
                    style={{ backgroundColor: dark ? 'rgba(37,99,235,0.15)' : 'rgba(239,246,255,1)' }}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <Icon className="w-5 h-5 flex-shrink-0 relative z-10" />
                {(!collapsed || mobile) && <span className="relative z-10">{label}</span>}
                {collapsed && !mobile && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-black text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                    {label}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Credits */}
      {(!collapsed || mobile) && (
        <div className="px-4 py-2 text-center">
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            Made by <span className="font-medium">Puneet</span>, <span className="font-medium">Adarsh</span>, <span className="font-medium">Riya</span> &amp; <span className="font-medium">Saurav</span>
          </p>
        </div>
      )}

      {/* User */}
      <div
        className={`px-2 py-3 border-t ${collapsed && !mobile ? 'flex flex-col items-center gap-2' : ''}`}
        style={{ borderColor: 'var(--border)' }}
      >
        {(!collapsed || mobile) ? (
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl transition-colors" style={{ cursor: 'default' }}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user?.role || 'member'}</p>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 px-3 py-2 w-full text-sm text-red-500 rounded-xl mt-1 transition-colors hover:bg-red-500/10 ${collapsed && !mobile ? 'justify-center' : ''}`}
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
          {(!collapsed || mobile) && 'Logout'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg-page)' }}>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
        className="hidden lg:flex flex-col relative flex-shrink-0 overflow-hidden"
        style={{ backgroundColor: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)' }}
      >
        <SidebarContent />
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -right-3 top-16 w-6 h-6 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow z-10"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronLeftIcon className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
          </motion.div>
        </button>
      </motion.aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="absolute left-0 top-0 h-full w-64 z-50 shadow-2xl"
              style={{ backgroundColor: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)' }}
            >
              <SidebarContent mobile />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header
          className="px-4 py-3 flex items-center gap-3 flex-shrink-0"
          style={{ backgroundColor: 'var(--bg-sidebar)', borderBottom: '1px solid var(--border)' }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-1 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <Bars3Icon className="w-6 h-6" />
          </button>

          <button
            onClick={() => setCmdOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors flex-1 max-w-xs"
            style={{ backgroundColor: dark ? '#1f1f1f' : '#f3f4f6', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          >
            <MagnifyingGlassIcon className="w-4 h-4" />
            <span>Search…</span>
            <kbd
              className="ml-auto text-[10px] rounded px-1"
              style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            >⌘K</kbd>
          </button>

          <div className="flex-1" />

          <NotificationBell />

          <button
            onClick={toggle}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            {dark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
}
