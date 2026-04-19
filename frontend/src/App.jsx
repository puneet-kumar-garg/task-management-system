import { lazy, Suspense, Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import Layout from './components/Layout';

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
  <div className="flex items-center justify-center h-screen" style={{ backgroundColor: 'var(--bg-page)' }}>
    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center h-screen gap-4 p-8 text-center">
          <p className="text-red-500 font-semibold text-lg">Something went wrong</p>
          <pre className="text-xs text-gray-500 bg-gray-100 p-4 rounded-lg max-w-xl overflow-auto">
            {this.state.error.message}
          </pre>
          <button className="btn-primary" onClick={() => window.location.reload()}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <BrowserRouter>
              <Toaster
                position="top-right"
                toastOptions={{
                  className: 'text-sm',
                  style: { backgroundColor: 'var(--bg-card)', color: 'inherit' },
                  duration: 3500,
                }}
              />
              <Suspense fallback={<Spinner />}>
                <Routes>
                  <Route path="/login"  element={<PublicRoute><Login /></PublicRoute>} />
                  <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
                  <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                    <Route index             element={<Dashboard />} />
                    <Route path="tasks"      element={<Tasks />} />
                    <Route path="kanban"     element={<Kanban />} />
                    <Route path="calendar"   element={<Calendar />} />
                    <Route path="analytics"  element={<Analytics />} />
                    <Route path="teams"      element={<Teams />} />
                    <Route path="teams/:id"  element={<TeamDetail />} />
                    <Route path="activity"   element={<Activity />} />
                    <Route path="profile"    element={<Profile />} />
                  </Route>
                </Routes>
              </Suspense>
            </BrowserRouter>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
