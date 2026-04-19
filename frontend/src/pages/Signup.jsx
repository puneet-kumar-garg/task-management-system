import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signup(form.name, form.email, form.password);
      navigate('/');
      toast.success('Account created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-2xl">✓</span>
          </div>
          <h1 className="text-2xl font-bold dark:text-white">Create account</h1>
          <p className="text-gray-500 mt-1">Join TaskFlow today</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">Full Name</label>
              <input className="input" placeholder="John Doe" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">Email</label>
              <input type="email" className="input" placeholder="you@example.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">Password</label>
              <input type="password" className="input" placeholder="Min. 6 characters" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">Sign in</Link>
          </p>
        </div>
        <p className="text-center text-xs text-gray-400 mt-6">
          Made by <span className="font-medium">Puneet</span>, <span className="font-medium">Adarsh</span>, <span className="font-medium">Riya</span> &amp; <span className="font-medium">Saurav</span>
        </p>
      </div>
    </div>
  );
}
