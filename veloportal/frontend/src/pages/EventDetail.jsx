import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import ReceiptModal from '../components/ReceiptModal';

export default function EventDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data,    setData]    = useState(null);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [phone, setPhone]     = useState(user?.phone || '');
  const [registration, setRegistration] = useState(null);
  const [showReceipt, setShowReceipt]   = useState(false);
  const [retrying, setRetrying]         = useState(false);
  const pollRef = useRef(null);

  const load = () => { api.get(`/events/${slug}`).then(r => setData(r.data)).catch(() => {}); };
  useEffect(() => { load(); }, [slug]);
  useEffect(() => () => clearInterval(pollRef.current), []);

  const pollRegistration = (id, checkoutRequestId) => {
    clearInterval(pollRef.current);
    let n = 0;
    pollRef.current = setInterval(async () => {
      n++;
      if (checkoutRequestId) {
        try { await api.get(`/payments/mpesa/status/${checkoutRequestId}`); } catch (_) { /* keep polling */ }
      }
      const { data } = await api.get(`/events/registrations/${id}`);
      setRegistration(data.registration);
      if (data.registration.Payment?.status !== 'pending' || n > 20) clearInterval(pollRef.current);
    }, 3000);
  };

  const register = async () => {
    if (!user) return navigate('/login');
    setLoading(true); setError('');
    try {
      const isFree = Number(data.event.price) === 0;
      const body = isFree ? {} : { paymentMethod, phone };
      const { data: res } = await api.post(`/events/${slug}/register`, body);
      setRegistration(res.registration);
      setShowReceipt(true);
      if (res.paymentInitiated) pollRegistration(res.registration.id, res.mpesa?.CheckoutRequestID);
      load();
    } catch (err) { setError(err.response?.data?.message || 'Registration failed'); }
    finally { setLoading(false); }
  };

  const retry = async () => {
    setRetrying(true);
    try {
      const { data } = await api.post(`/events/registrations/${registration.id}/retry-payment`, { phone });
      pollRegistration(registration.id, data.mpesa?.CheckoutRequestID);
    }
    catch (err) { setError(err.response?.data?.message || 'Retry failed'); }
    finally { setRetrying(false); }
  };

  if (!data) return (
    <div className="section max-w-3xl">
      <div className="h-64 rounded-3xl bg-ink-100 animate-pulse dark:bg-white/5" />
      <div className="mt-6 space-y-3">
        {[300, 200, 400].map((w, i) => <div key={i} className="h-5 rounded bg-ink-100 animate-pulse dark:bg-white/5" style={{ maxWidth: w }} />)}
      </div>
    </div>
  );

  const { event, spotsLeft } = data;
  const date = new Date(event.date);
  const isFull = spotsLeft === 0;
  const isFree = Number(event.price) === 0;

  return (
    <div className="section-tight">
      {/* Hero image */}
      <div className="relative h-64 overflow-hidden rounded-3xl bg-forest/20 sm:h-80">
        <img src={event.imageUrl} alt={event.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-6 left-6">
          {isFree
            ? <span className="badge badge-success text-sm px-4 py-2">Free entry</span>
            : <span className="badge badge-forest text-sm px-4 py-2">KES {Number(event.price).toLocaleString()}</span>}
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Details */}
        <div className="lg:col-span-2">
          <p className="eyebrow">{date.toLocaleString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{event.title}</h1>
          <p className="mt-4 leading-relaxed text-ink-500 dark:text-white/65">{event.description}</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              { icon: '📍', label: 'Location',    value: event.location },
              { icon: '🕐', label: 'Time',         value: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
              { icon: '👥', label: 'Capacity',     value: `${event.capacity} riders` },
              { icon: '🎟️', label: 'Spots left',   value: isFull ? 'Fully booked' : `${spotsLeft} available` },
            ].map(d => (
              <div key={d.label} className="card p-4">
                <p className="text-lg">{d.icon}</p>
                <p className="mt-1 text-2xs font-bold uppercase tracking-wider text-ink-400 dark:text-white/40">{d.label}</p>
                <p className="mt-0.5 text-sm font-semibold">{d.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Registration card */}
        <div>
          <div className="card p-6 sticky top-24">
            <p className="font-display text-2xl font-bold text-forest dark:text-amber">
              {isFree ? 'Free' : `KES ${Number(event.price).toLocaleString()}`}
            </p>
            <p className="mt-1 text-sm text-ink-400 dark:text-white/50">per ticket</p>

            {/* Payment method choice — only for paid events */}
            {!isFree && user && !registration && (
              <div className="mt-5 space-y-2">
                <p className="label">Payment method</p>
                {[
                  { value: 'mpesa', icon: '📱', label: 'M-Pesa STK Push' },
                  { value: 'cash',  icon: '💵', label: 'Cash at the event' },
                ].map(opt => (
                  <label key={opt.value}
                    className={`card cursor-pointer flex items-center gap-3 p-3 transition-all ${paymentMethod === opt.value ? 'ring-2 ring-forest dark:ring-amber' : 'card-hover'}`}>
                    <input type="radio" name="eventPayment" className="sr-only" value={opt.value}
                      checked={paymentMethod === opt.value} onChange={e => setPaymentMethod(e.target.value)} />
                    <span className="text-lg">{opt.icon}</span>
                    <span className="text-sm font-semibold">{opt.label}</span>
                  </label>
                ))}
                {paymentMethod === 'mpesa' && (
                  <>
                    <input className="input mt-2" placeholder="07XXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} />
                  </>
                )}
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600 animate-rise dark:bg-red-900/20 dark:text-red-400">{error}</div>
            )}

            {!registration && (
              <button onClick={register} disabled={isFull || loading}
                className="btn-primary mt-5 w-full disabled:opacity-40">
                {loading ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  : isFull ? 'Fully booked' : user ? 'Register for this event' : 'Sign in to register'}
              </button>
            )}

            {registration && (
              <button onClick={() => setShowReceipt(true)} className="btn-secondary mt-5 w-full">
                🎟️ View my ticket receipt
              </button>
            )}

            {!user && (
              <p className="mt-3 text-center text-xs text-ink-400 dark:text-white/40">
                <Link to="/login" className="font-semibold text-forest hover:underline dark:text-amber">Sign in</Link> to register
              </p>
            )}

            <div className="mt-5 border-t border-ink-100 pt-4 dark:border-white/10">
              <p className="text-xs text-ink-400 dark:text-white/40">
                Once registered, your ticket code and receipt appear in your dashboard under "Events".
              </p>
            </div>
          </div>
        </div>
      </div>

      <ReceiptModal
        open={showReceipt}
        onClose={() => { setShowReceipt(false); navigate('/dashboard'); }}
        kind="event" record={registration} onRetry={retry} retrying={retrying}
      />
    </div>
  );
}
