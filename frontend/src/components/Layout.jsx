import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  HomeIcon, ClipboardDocumentListIcon, UserGroupIcon,
  BellIcon, UserCircleIcon, SunIcon, MoonIcon,
  Bars3Icon, XMarkIcon, ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const navItems = [
  { to: '/', icon: HomeIcon, label: 'Dashboard' },
  { to: '/tasks', icon: ClipboardDocumentListIcon, label: 'Tasks' },
  { to: '/teams', icon: UserGroupIcon, label: 'Teams' },
  { to: '/activity', icon: BellIcon, label: 'Activity' },
  { to: '/profile', icon: UserCircleIcon, label: 'Profile' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const Sidebar = ({ mobile = false }) => (
    <aside className={`${mobile ? 'flex' : 'hidden lg:flex'} flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200 dark:border-gray-700">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <ClipboardDocumentListIcon className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-lg text-gray-900 dark:text-white">TaskFlow</span>
        {mobile && (
          <button onClick={() => setSidebarOpen(false)} className="ml-auto text-gray-500">
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Credits */}
      <div className="px-4 py-2 text-center">
        <p className="text-xs text-gray-400 dark:text-gray-500">Made by <span className="font-medium text-gray-500 dark:text-gray-400">Puneet</span>, <span className="font-medium text-gray-500 dark:text-gray-400">Adarsh</span>, <span className="font-medium text-gray-500 dark:text-gray-400">Riya</span> &amp; <span className="font-medium text-gray-500 dark:text-gray-400">Saurav</span></p>
      </div>

      {/* User */}
      <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate dark:text-white">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 w-full text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg mt-1">
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 z-50">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <Bars3Icon className="w-6 h-6" />
          </button>
          <div className="flex-1" />
          <button onClick={toggle} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
            {dark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
