import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Reveal from '../components/Reveal';

export default function Repair() {
  const [services,  setServices]  = useState([]);
  const [bookings,  setBookings]  = useState([]);
  const [selected,  setSelected]  = useState(null);
  const [form, setForm]           = useState({ bicycleDescription: '', scheduledDate: '', notes: '' });
  const [msg,  setMsg]            = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const { user } = useAuth();
  const navigate  = useNavigate();

  const loadBookings = () => user && api.get('/repairs/bookings/mine').then(r => setBookings(r.data.bookings));
  useEffect(() => {
    api.get('/repairs/services').then(r => setServices(r.data.services)).catch(() => {});
    loadBookings();
  }, [user]);

  const submit = async e => {
    e.preventDefault();
    if (!user) return navigate('/login');
    if (!selected) return setError('Please select a service first');
    setLoading(true); setError(''); setMsg('');
    try {
      await api.post('/repairs/bookings', { serviceId: selected.id, ...form });
      setMsg(`✅ Repair booked for ${new Date(form.scheduledDate).toLocaleString()}. Track it below.`);
      setForm({ bicycleDescription: '', scheduledDate: '', notes: '' });
      setSelected(null);
      loadBookings();
    } catch (err) { setError(err.response?.data?.message || 'Booking failed'); }
    finally { setLoading(false); }
  };

  const STATUS_COLOR = { booked: 'badge-forest', in_progress: 'badge-warning', completed: 'badge-success', cancelled: 'badge-danger' };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-ink to-ink-500 py-16 text-white">
        <div className="section-sm">
          <Reveal>
            <p className="eyebrow text-amber">Repair</p>
            <h1 className="mt-2 font-display text-3xl font-bold sm:text-5xl">Book a certified mechanic</h1>
            <p className="mt-3 max-w-xl text-white/65">Select a service, tell us about your bike, and pick a slot. Track your repair from booking to collection.</p>
          </Reveal>
        </div>
      </div>

      <div className="section">
        <div className="grid gap-10 lg:grid-cols-5">
          {/* Services */}
          <div className="lg:col-span-3">
            <h2 className="font-display text-xl font-bold">1. Choose a service</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {services.map(s => (
                <button key={s.id} onClick={() => setSelected(s)}
                  className={`card text-left p-5 transition-all duration-300 ${selected?.id === s.id ? 'ring-2 ring-forest shadow-forest scale-[1.02]' : 'card-hover'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display font-semibold">{s.name}</p>
                      <p className="mt-1 text-sm text-ink-400 dark:text-white/50">{s.description}</p>
                    </div>
                    {selected?.id === s.id && <span className="text-xl">✅</span>}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="font-display text-lg font-bold text-forest dark:text-amber">KES {Number(s.price).toLocaleString()}</p>
                    <p className="text-xs text-ink-400 dark:text-white/40">~{s.estimatedHours}h</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Booking form */}
          <div className="lg:col-span-2">
            <form onSubmit={submit} className="card p-6 sticky top-24">
              <h2 className="font-display text-lg font-bold">2. Book your slot</h2>
              {selected && (
                <div className="mt-3 rounded-xl bg-forest/8 p-3 dark:bg-forest/20">
                  <p className="text-sm font-semibold text-forest dark:text-amber">{selected.name}</p>
                  <p className="text-xs text-ink-400 dark:text-white/50">KES {Number(selected.price).toLocaleString()} · ~{selected.estimatedHours}h</p>
                </div>
              )}
              <div className="mt-4 space-y-4">
                <div>
                  <label className="label">Your bicycle</label>
                  <input required className="input" value={form.bicycleDescription}
                    onChange={e => setForm({...form, bicycleDescription: e.target.value})}
                    placeholder="e.g. Trek Marlin 7, blue, 2023" />
                </div>
                <div>
                  <label className="label">Preferred date & time</label>
                  <input required type="datetime-local" className="input" value={form.scheduledDate}
                    onChange={e => setForm({...form, scheduledDate: e.target.value})}
                    min={new Date().toISOString().slice(0,16)} />
                </div>
                <div>
                  <label className="label">Notes for the mechanic</label>
                  <textarea className="input" rows="3" value={form.notes}
                    onChange={e => setForm({...form, notes: e.target.value})}
                    placeholder="Describe the issue or any special requests…" />
                </div>
              </div>
              {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
              {msg   && <p className="mt-3 text-sm font-medium text-green-700 dark:text-green-400">{msg}</p>}
              <button type="submit" disabled={loading || !selected} className="btn-primary mt-5 w-full">
                {loading ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  : user ? 'Book repair' : 'Sign in to book'}
              </button>
            </form>
          </div>
        </div>

        {/* Booking history */}
        {user && bookings.length > 0 && (
          <div className="mt-16">
            <h2 className="font-display text-xl font-bold">Your repair history</h2>
            <div className="mt-5 space-y-3">
              {bookings.map(b => (
                <div key={b.id} className="card flex flex-wrap items-center justify-between gap-4 p-5">
                  <div>
                    <p className="font-semibold">{b.RepairService?.name}</p>
                    <p className="text-sm text-ink-400 dark:text-white/50">{b.bicycleDescription}</p>
                    <p className="text-xs text-ink-400 dark:text-white/40 mt-1">📅 {new Date(b.scheduledDate).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`badge capitalize ${STATUS_COLOR[b.status] || 'badge-ink'}`}>{b.status.replace('_', ' ')}</span>
                    <p className="text-sm font-bold text-forest dark:text-amber">KES {Number(b.totalCost).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
