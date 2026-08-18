import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide your email.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      await forgotPassword(email);
      setMessage('Password reset link has been sent to your email.');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error requesting password reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Forgot Password</h2>
          <p className="mt-2 text-sm text-slate-500">
            Enter your registered email to receive a password reset link
          </p>
        </div>

        <div className="bg-white px-8 py-10 shadow-xl shadow-slate-100 rounded-2xl border">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100">
                {error}
              </div>
            )}
            {message && (
              <div className="rounded-lg bg-green-50 p-4 text-sm text-green-600 border border-green-100">
                {message}
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
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 transition"
                  placeholder="name@college.edu"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 disabled:opacity-50 transition cursor-pointer"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-500"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
