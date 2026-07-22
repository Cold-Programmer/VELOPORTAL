import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import ReceiptModal from '../components/ReceiptModal';

export default function RentalDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bike, setBike] = useState(null);
  const [form, setForm] = useState({ startDate: '', endDate: '', phone: '' });
  const [avail, setAvail] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [rental, setRental] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    api.get(`/products/${slug}`).then(r => setBike(r.data.item)).catch(() => {});
    if (user?.phone) setForm(f => ({ ...f, phone: user.phone }));
  }, [slug, user]);
  useEffect(() => () => clearInterval(pollRef.current), []);

  const checkAvail = async () => {
    if (!bike || !form.startDate || !form.endDate) return;
    const { data } = await api.get(`/rentals/availability/${bike.id}`, {
      params: { start: form.startDate, end: form.endDate }
    });
    setAvail(data.available);
  };

  // Polls the rental AND actively asks Daraja for the real transaction status
  // (self-healing) — catches cases where the STK callback never reaches us.
  const pollRental = (id, checkoutRequestId) => {
    clearInterval(pollRef.current);
    let n = 0;
    pollRef.current = setInterval(async () => {
      n++;
      if (checkoutRequestId) {
        try { await api.get(`/payments/mpesa/status/${checkoutRequestId}`); } catch (_) { /* keep polling */ }
      }
      const { data } = await api.get(`/rentals/${id}`);
      setRental(data.rental);
      if (data.rental.Payment?.status !== 'pending' || n > 20) clearInterval(pollRef.current);
    }, 3000);
  };

  const book = async e => {
    e.preventDefault();
    if (!user) return navigate('/login');
    setStatus('processing'); setError('');
    try {
      const { data } = await api.post('/rentals', { bicycleId: bike.id, ...form });
      setRental(data.rental);
      setShowReceipt(true);
      if (data.paymentInitiated) { setStatus('awaiting'); pollRental(data.rental.id, data.mpesa?.CheckoutRequestID); }
      else { setStatus('placed'); if (data.message) setError(data.message); }
    } catch (err) {
      setStatus('error');
      setError(err.response?.data?.message || 'Booking failed. Please check your details.');
    }
  };

  const retry = async () => {
    setRetrying(true);
    try {
      const { data } = await api.post(`/rentals/${rental.id}/retry-payment`, { phone: form.phone });
      pollRental(rental.id, data.mpesa?.CheckoutRequestID);
    }
    catch (err) { setError(err.response?.data?.message || 'Retry failed'); }
    finally { setRetrying(false); }
  };

  if (!bike) return (
    <div className="section grid gap-10 lg:grid-cols-2">
      <div className="aspect-[4/3] rounded-3xl bg-ink-100 animate-pulse dark:bg-white/5" />
      <div className="space-y-4">{[300, 200, 150, 200].map((w,i) => <div key={i} className="h-5 rounded bg-ink-100 animate-pulse dark:bg-white/5" style={{ maxWidth: w }} />)}</div>
    </div>
  );

  const hours = form.startDate && form.endDate
    ? Math.max(1, Math.ceil((new Date(form.endDate) - new Date(form.startDate)) / 36e5)) : 0;
  const subtotal = hours * Number(bike.rentalPricePerHour);

  return (
    <div className="section grid gap-12 lg:grid-cols-2">
      {/* Image */}
      <div className="aspect-[4/3] overflow-hidden rounded-3xl bg-sand-100 dark:bg-forest-dark/50">
        <img src={bike.images?.[0]} alt={bike.name} className="h-full w-full object-cover" />
      </div>

      {/* Booking form */}
      <div>
        <p className="eyebrow">{bike.Category?.name}</p>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{bike.name}</h1>
        <p className="mt-1 text-sm text-ink-400 dark:text-white/50">{bike.brand} · Frame {bike.frameSize} · Wheel {bike.wheelSize}</p>
        <p className="mt-5 font-display text-4xl font-bold text-forest dark:text-amber">
          KES {Number(bike.rentalPricePerHour).toLocaleString()}<span className="text-lg font-normal text-ink-400 dark:text-white/50">/hr</span>
        </p>

        <form onSubmit={book} className="card mt-7 p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Start date & time</label>
              <input required type="datetime-local" className="input" value={form.startDate}
                min={new Date().toISOString().slice(0,16)}
                onChange={e => setForm({...form, startDate: e.target.value})} onBlur={checkAvail} />
            </div>
            <div>
              <label className="label">End date & time</label>
              <input required type="datetime-local" className="input" value={form.endDate}
                min={form.startDate || new Date().toISOString().slice(0,16)}
                onChange={e => setForm({...form, endDate: e.target.value})} onBlur={checkAvail} />
            </div>
          </div>

          <div>
            <label className="label">M-Pesa phone number</label>
            <input required className="input" value={form.phone}
              onChange={e => setForm({...form, phone: e.target.value})} placeholder="07XXXXXXXX" />
          </div>


          {avail === false && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-900/20 dark:text-red-400">
              ❌ This bike is already booked for that window. Choose a different time.
            </div>
          )}
          {avail === true && (
            <div className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
              ✅ Available for this period!
            </div>
          )}

          {hours > 0 && (
            <div className="flex justify-between border-t border-ink-100 pt-4 font-display dark:border-white/10">
              <span className="text-sm">{hours} hour{hours !== 1 ? 's' : ''}</span>
              <span className="text-xl font-bold text-forest dark:text-amber">KES {subtotal.toLocaleString()}</span>
            </div>
          )}

          {error && status !== 'placed' && (
            <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 dark:bg-amber/10 dark:text-amber">{error}</div>
          )}

          <button type="submit" disabled={avail === false || status === 'processing' || status === 'awaiting'}
            className="btn-primary w-full disabled:opacity-40">
            {!user ? 'Sign in to book'
              : status === 'processing' ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              : status === 'awaiting' ? '⏳ Waiting for M-Pesa PIN…'
              : '📱 Book & pay with M-Pesa'}
          </button>
        </form>
      </div>

      <ReceiptModal open={showReceipt} onClose={() => { setShowReceipt(false); navigate('/dashboard'); }}
        kind="rental" record={rental} onRetry={retry} retrying={retrying} />
    </div>
  );
}
