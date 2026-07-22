import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]   = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const user = await login(form.email, form.password);
      navigate(['admin','staff','mechanic'].includes(user.role) ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-md animate-rise">
        {/* Brand */}
        <div className="mb-8 text-center">
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-forest text-3xl shadow-forest">🚲</span>
          <h1 className="mt-5 font-display text-2xl font-bold sm:text-3xl">Welcome back</h1>
          <p className="mt-1 text-sm text-ink-400 dark:text-white/50">Sign in to your VeloPortal account</p>
        </div>

        <form onSubmit={submit} className="card p-7 sm:p-8">
          <div className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input required type="email" autoComplete="email" className="input"
                value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                placeholder="you@example.com" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="label">Password</label>
                <Link to="/forgot-password" className="text-2xs font-semibold text-forest hover:text-amber-dark dark:text-amber">Forgot password?</Link>
              </div>
              <div className="relative">
                <input required type={showPwd ? 'text' : 'password'} autoComplete="current-password" className="input pr-11"
                  value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                  placeholder="••••••••" />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-forest dark:text-white/40">
                  {showPwd ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 animate-rise dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary mt-6 w-full">
            {loading ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : 'Sign in'}
          </button>

          <p className="mt-5 text-center text-sm text-ink-400 dark:text-white/50">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-forest hover:text-amber-dark dark:text-amber">Create one free →</Link>
          </p>
        </form>

        {/* Demo hint */}
        <div className="mt-6 rounded-2xl border border-dashed border-ink-200 bg-sand-100 p-4 dark:border-white/15 dark:bg-white/5">
          <p className="text-2xs font-bold uppercase tracking-wider text-ink-400 dark:text-white/40">Demo accounts</p>
          <div className="mt-2 grid gap-1 text-xs text-ink-400 dark:text-white/50">
            <span>🔑 admin@veloportal.app / Admin@12345 (super admin)</span>
            <span>⚙️ mechanic@veloportal.app / Mechanic@12345</span>
            <span>🏪 staff@veloportal.app / Staff@12345</span>
            <span>🚲 rider@veloportal.app / Rider@12345</span>
          </div>
        </div>
      </div>
    </div>
  );
}
