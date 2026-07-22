import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', regNumber: '', email: '', phone: '', password: '' });
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async e => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      await register(form);
      setSuccess('Account created! Check your email for a confirmation link.');
      setTimeout(() => navigate('/dashboard'), 1800);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-md animate-rise">
        <div className="mb-8 text-center">
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-amber text-3xl shadow-amber">🚲</span>
          <h1 className="mt-5 font-display text-2xl font-bold sm:text-3xl">Create your account</h1>
          <p className="mt-1 text-sm text-ink-400 dark:text-white/50">Free forever — no credit card required</p>
        </div>

        <form onSubmit={submit} className="card p-7 sm:p-8">
          <div className="space-y-4">
            {/* Full name */}
            <div>
              <label className="label">Full name <span className="text-danger">*</span></label>
              <input required className="input" value={form.name}
                onChange={e => set('name', e.target.value)} placeholder="Elvis Muthomi" />
            </div>

            {/* Student reg number */}
            <div>
              <label className="label">Student registration number <span className="text-ink-300">(optional)</span></label>
              <input className="input" value={form.regNumber}
                onChange={e => set('regNumber', e.target.value)} placeholder="e.g. 25/01220" />
              <p className="mt-1 text-2xs text-ink-400 dark:text-white/40">Appears on your rental ledger receipt</p>
            </div>

            {/* Email */}
            <div>
              <label className="label">Email address <span className="text-danger">*</span></label>
              <input required type="email" autoComplete="email" className="input" value={form.email}
                onChange={e => set('email', e.target.value)} placeholder="you@example.com" />
              <p className="mt-1 text-2xs text-ink-400 dark:text-white/40">A confirmation link will be sent to this address</p>
            </div>

            {/* Phone */}
            <div>
              <label className="label">Telephone <span className="text-ink-300">(optional)</span></label>
              <input className="input" value={form.phone}
                onChange={e => set('phone', e.target.value)} placeholder="+254 7XX XXX XXX" />
              <p className="mt-1 text-2xs text-ink-400 dark:text-white/40">Used for M-Pesa payment prompts</p>
            </div>

            {/* Password */}
            <div>
              <label className="label">Password <span className="text-danger">*</span></label>
              <div className="relative">
                <input required type={showPwd ? 'text' : 'password'} minLength={6} className="input pr-11"
                  value={form.password} onChange={e => set('password', e.target.value)} placeholder="Minimum 6 characters" />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-forest dark:text-white/40">
                  {showPwd ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 animate-rise dark:bg-red-900/20 dark:text-red-400">{error}</div>
          )}
          {success && (
            <div className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700 animate-rise dark:bg-green-900/20 dark:text-green-400">✅ {success}</div>
          )}

          <button type="submit" disabled={loading} className="btn-primary mt-6 w-full">
            {loading ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : 'Create account'}
          </button>

          <p className="mt-5 text-center text-sm text-ink-400 dark:text-white/50">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-forest hover:text-amber-dark dark:text-amber">Sign in →</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
