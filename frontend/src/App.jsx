import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import Layout from './components/Layout';

// Lazy-loaded pages
const Login      = lazy(() => import('./pages/Login'));
const Signup     = lazy(() => import('./pages/Signup'));
const Dashboard  = lazy(() => import('./pages/Dashboard'));
const Tasks      = lazy(() => import('./pages/Tasks'));
const Kanban     = lazy(() => import('./pages/Kanban'));
const Calendar   = lazy(() => import('./pages/Calendar'));
const Analytics  = lazy(() => import('./pages/Analytics'));
const Teams      = lazy(() => import('./pages/Teams'));
const TeamDetail = lazy(() => import('./pages/TeamDetail'));
const Activity   = lazy(() => import('./pages/Activity'));
const Profile    = lazy(() => import('./pages/Profile'));

const Spinner = () => (
  <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-950">
    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : children;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter>
            <Toaster
              position="top-right"
              toastOptions={{
                className: 'dark:bg-gray-800 dark:text-white text-sm',
                duration: 3500,
              }}
            />
            <Suspense fallback={<Spinner />}>
              <Routes>
                <Route path="/login"  element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
                <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                  <Route index          element={<Dashboard />} />
                  <Route path="tasks"   element={<Tasks />} />
                  <Route path="kanban"  element={<Kanban />} />
                  <Route path="calendar" element={<Calendar />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="teams"   element={<Teams />} />
                  <Route path="teams/:id" element={<TeamDetail />} />
                  <Route path="activity" element={<Activity />} />
                  <Route path="profile"  element={<Profile />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
