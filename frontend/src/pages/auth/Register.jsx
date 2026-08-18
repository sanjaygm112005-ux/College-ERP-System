import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { Eye, EyeOff, Lock, Mail, User, GraduationCap, Users } from 'lucide-react';
import confetti from 'canvas-confetti';

const Register = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password || !role) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        full_name: fullName,
        role
      });

      setSuccess(response.data.message || 'Registration successful!');
      
      // Trigger canvas-confetti for a beautiful celebration!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
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
            Create an Account
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Register to join the College ERP portal
          </p>
        </div>

        {/* Register Card */}
        <div className="bg-white px-8 py-10 shadow-xl shadow-slate-100 rounded-2xl border">
          {success ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-950">Registration Complete!</h3>
              <p className="text-sm text-slate-600">{success}</p>
              <p className="text-xs text-slate-400 animate-pulse">Redirecting to Login Page...</p>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="fullName" className="block text-sm font-semibold text-slate-700">
                  Full Name
                </label>
                <div className="relative mt-1.5 rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="block w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 transition"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                  Email Address
                </label>
                <div className="relative mt-1.5 rounded-md shadow-sm">
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
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                  Password
                </label>
                <div className="relative mt-1.5 rounded-md shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
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
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Select Your Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'STUDENT', label: 'Student' },
                    { id: 'FACULTY', label: 'Faculty' },
                    { id: 'ADMIN', label: 'Admin' }
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg border transition cursor-pointer text-center ${
                        role === r.id
                          ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm shadow-brand-100'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full justify-center rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {loading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    'Register Account'
                  )}
                </button>
              </div>

              <p className="mt-4 text-center text-xs text-slate-500">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-500">
                  Sign In
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
