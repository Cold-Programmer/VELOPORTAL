import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ReceiptModal from '../components/ReceiptModal';

export default function Checkout() {
  const { items, total, refresh } = useCart();
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm] = useState({
    shippingAddress: '', shippingCity: 'Nairobi',
    shippingPhone: user?.phone || '', paymentMethod: 'mpesa',
  });
  const [status, setStatus] = useState('idle');
  const [error,  setError]  = useState('');
  const [order,  setOrder]  = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => () => clearInterval(pollRef.current), []);

  // Polls the order AND actively asks Daraja for the transaction's real
  // status (self-healing) — this catches cases where the STK callback never
  // reaches us (e.g. no public callback URL configured), which would
  // otherwise leave the order stuck on "pending" forever even after the
  // customer actually pays.
  const pollOrder = (id, checkoutRequestId) => {
    clearInterval(pollRef.current);
    let n = 0;
    pollRef.current = setInterval(async () => {
      n++;
      if (checkoutRequestId) {
        try { await api.get(`/payments/mpesa/status/${checkoutRequestId}`); } catch (_) { /* keep polling */ }
      }
      const { data } = await api.get(`/orders/${id}`);
      setOrder(data.order);
      if (data.order.Payment?.status !== 'pending' || n > 20) clearInterval(pollRef.current);
    }, 3000);
  };

  const submit = async e => {
    e.preventDefault();
    setStatus('processing'); setError('');
    try {
      const { data } = await api.post('/orders/checkout', form);
      await refresh();
      setOrder(data.order);
      setShowReceipt(true);
      if (form.paymentMethod === 'mpesa' && data.paymentInitiated) {
        setStatus('awaiting'); pollOrder(data.order.id, data.mpesa?.CheckoutRequestID);
      } else {
        setStatus('placed');
        if (data.message) setError(data.message);
      }
    } catch (err) {
      setStatus('error');
      setError(err.response?.data?.message || 'Checkout failed — please check your details.');
    }
  };

  const retry = async () => {
    setRetrying(true);
    try {
      const { data } = await api.post(`/orders/${order.id}/retry-payment`, { phone: form.shippingPhone });
      pollOrder(order.id, data.mpesa?.CheckoutRequestID);
    }
    catch (err) { setError(err.response?.data?.message || 'Retry failed'); }
    finally { setRetrying(false); }
  };

  if (!items.length && status === 'idle') return (
    <div className="section flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="text-6xl animate-float">🛒</span>
      <h1 className="mt-6 font-display text-2xl font-bold">Your cart is empty</h1>
      <Link to="/shop" className="btn-primary mt-6">Browse the shop</Link>
    </div>
  );

  return (
    <div className="section">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Checkout</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Form */}
        <form onSubmit={submit} className="space-y-5 lg:col-span-2">
          {/* Delivery */}
          <div className="card p-6">
            <h2 className="font-display text-lg font-semibold mb-5">📦 Delivery details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label">Delivery address</label>
                <input required className="input" value={form.shippingAddress}
                  onChange={e => setForm({...form, shippingAddress: e.target.value})}
                  placeholder="Street, building, apartment number" />
              </div>
              <div>
                <label className="label">City</label>
                <input required className="input" value={form.shippingCity}
                  onChange={e => setForm({...form, shippingCity: e.target.value})} />
              </div>
              <div>
                <label className="label">Phone (for delivery updates)</label>
                <input required className="input" value={form.shippingPhone}
                  onChange={e => setForm({...form, shippingPhone: e.target.value})} placeholder="07XXXXXXXX" />
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="card p-6">
            <h2 className="font-display text-lg font-semibold mb-5">💳 Payment method</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { value: 'mpesa', icon: '📱', label: 'M-Pesa STK Push', desc: 'Instant payment prompt to your phone' },
                { value: 'cash_on_delivery', icon: '💵', label: 'Cash on delivery', desc: 'Pay when you receive your order' },
              ].map(opt => (
                <label key={opt.value}
                  className={`card cursor-pointer p-4 transition-all duration-200 ${form.paymentMethod === opt.value ? 'ring-2 ring-forest dark:ring-amber' : 'card-hover'}`}>
                  <input type="radio" name="paymentMethod" value={opt.value} className="sr-only"
                    checked={form.paymentMethod === opt.value}
                    onChange={e => setForm({...form, paymentMethod: e.target.value})} />
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{opt.icon}</span>
                    <div>
                      <p className="text-sm font-semibold">{opt.label}</p>
                      <p className="text-xs text-ink-400 dark:text-white/50">{opt.desc}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {error && status !== 'placed' && (
            <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 dark:bg-amber/10 dark:text-amber">{error}</div>
          )}

          <button type="submit" disabled={status === 'processing' || status === 'awaiting'}
            className="btn-primary w-full py-4 text-base disabled:opacity-40">
            {status === 'processing' ? <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              : status === 'awaiting' ? '⏳ Waiting for M-Pesa PIN…'
              : form.paymentMethod === 'mpesa' ? '📱 Place order & pay with M-Pesa' : '✅ Place order'}
          </button>
        </form>

        {/* Summary */}
        <div>
          <div className="card p-6 sticky top-24">
            <h2 className="font-display text-lg font-semibold">Order summary</h2>
            <div className="mt-5 space-y-3">
              {items.map(i => (
                <div key={i.id} className="flex items-center gap-3">
                  <img src={i.Bicycle?.images?.[0]} className="h-12 w-14 rounded-lg object-cover bg-sand-100" alt="" loading="lazy" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{i.Bicycle?.name}</p>
                    <p className="text-xs text-ink-400 dark:text-white/50">× {i.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold shrink-0">KES {(Number(i.Bicycle?.price) * i.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex justify-between border-t border-ink-100 pt-4 font-display text-xl font-bold dark:border-white/10">
              <span>Total</span><span className="text-forest dark:text-amber">KES {Number(total).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <ReceiptModal open={showReceipt} onClose={() => { setShowReceipt(false); navigate('/dashboard'); }}
        kind="order" record={order} onRetry={retry} retrying={retrying} />
    </div>
  );
}
