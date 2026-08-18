import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Lock, Mail, GraduationCap } from 'lucide-react';
import confetti from 'canvas-confetti';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await login(email, password);
      
      // Select redirect path based on metadata role
      const userRole = data.user?.user_metadata?.role || 'STUDENT';
      
      // Trigger canvas-confetti for a beautiful celebration on successful login!
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 }
      });

      if (userRole === 'ADMIN') navigate('/admin/dashboard');
      else if (userRole === 'FACULTY') navigate('/faculty/dashboard');
      else navigate('/student/dashboard');

    } catch (err) {
      console.error(err);
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  // Quick fill helper for testing
  const handleQuickLogin = (role) => {
    setError('');
    if (role === 'admin') {
      setEmail('admin@college.edu');
      setPassword('Admin@123');
    } else if (role === 'faculty') {
      setEmail('faculty1@college.edu');
      setPassword('Faculty@123');
    } else if (role === 'student') {
      setEmail('student1@college.edu');
      setPassword('Student@123');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Brand Header */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-xl shadow-brand-100">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900">
            College ERP System
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Securely access your academic and management portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white px-8 py-10 shadow-xl shadow-slate-100 rounded-2xl border">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                Email Address
              </label>
              <div className="relative mt-2 rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 transition"
                  placeholder="name@college.edu"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-brand-600 hover:text-brand-500"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative mt-2 rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-10 text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>

            <p className="mt-4 text-center text-xs text-slate-500">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-500">
                Register here
              </Link>
            </p>
          </form>

          {/* Quick Demo Logins Section */}
          <div className="mt-8 border-t pt-6">
            <h3 className="text-center text-xs font-bold uppercase tracking-wider text-slate-400">
              Quick Demo Logins
            </h3>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <button
                onClick={() => handleQuickLogin('admin')}
                className="rounded-lg border bg-slate-50 px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition"
              >
                Admin
              </button>
              <button
                onClick={() => handleQuickLogin('faculty')}
                className="rounded-lg border bg-slate-50 px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition"
              >
                Faculty
              </button>
              <button
                onClick={() => handleQuickLogin('student')}
                className="rounded-lg border bg-slate-50 px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition"
              >
                Student
              </button>
            </div>
            <p className="mt-3 text-center text-[10px] text-slate-400">
              Demo passwords default to <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">Role@123</code> (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">Admin@123</code>)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
