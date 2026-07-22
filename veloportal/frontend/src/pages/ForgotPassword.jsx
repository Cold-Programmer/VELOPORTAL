import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [msg, setMsg]     = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    const { data } = await api.post('/auth/forgot-password', { email });
    setMsg(data.message);
    setLoading(false);
  };

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md animate-rise">
        <div className="mb-8 text-center">
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-sand-100 text-3xl">🔑</span>
          <h1 className="mt-5 font-display text-2xl font-bold sm:text-3xl">Reset your password</h1>
          <p className="mt-1 text-sm text-ink-400 dark:text-white/50">We'll send a reset link to your email</p>
        </div>
        <form onSubmit={submit} className="card p-7 sm:p-8">
          <label className="label">Email address</label>
          <input required type="email" className="input" value={email}
            onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          {msg && <div className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700 animate-rise dark:bg-green-900/20 dark:text-green-400">✅ {msg}</div>}
          <button type="submit" disabled={loading} className="btn-primary mt-6 w-full">
            {loading ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : 'Send reset link'}
          </button>
          <p className="mt-5 text-center text-sm text-ink-400 dark:text-white/50">
            Remember it? <Link to="/login" className="font-semibold text-forest dark:text-amber">Sign in →</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
