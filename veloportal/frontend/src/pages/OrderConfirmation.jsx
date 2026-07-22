import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import LedgerReceipt from '../components/LedgerReceipt';

export default function OrderConfirmation() {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const load = () => api.get(`/orders/${id}`).then(r => setOrder(r.data.order)).catch(() => {});
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [id]);

  if (!order) return (
    <div className="section flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-forest border-t-transparent" />
        <p className="mt-4 text-sm text-ink-400">Loading your order…</p>
      </div>
    </div>
  );

  const payment = order.Payment;
  const paid    = payment?.status === 'success';
  const failed  = payment?.status === 'failed';
  const pending = !payment || payment?.status === 'pending';

  return (
    <div className="section-tight text-center print:p-0">
      {/* Status icon */}
      <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-4xl animate-pop print:hidden
        ${paid ? 'bg-green-50 dark:bg-green-900/20' : failed ? 'bg-red-50 dark:bg-red-900/20' : 'bg-amber/10'}`}>
        {paid ? '✅' : failed ? '⚠️' : '⏳'}
      </div>

      <h1 className="mt-5 font-display text-2xl font-bold print:hidden sm:text-3xl">
        {paid ? 'Payment confirmed!' : failed ? 'Payment failed' : 'Waiting for payment…'}
      </h1>
      <p className="mt-2 text-sm text-ink-400 dark:text-white/50 print:hidden">
        Order <span className="font-semibold text-ink dark:text-white">{order.orderNumber}</span> · Status: <span className="capitalize">{order.status.replace('_', ' ')}</span>
      </p>
      {pending && (
        <p className="mt-3 text-sm text-ink-400 dark:text-white/50 print:hidden">Check your phone and enter your M-Pesa PIN to complete the payment. This page updates automatically.</p>
      )}

      {/* Ledger receipt */}
      <div className="mx-auto mt-8 max-w-md">
        <LedgerReceipt kind="order" user={user} record={order} />
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3 print:hidden">
        {paid && (
          <button onClick={() => window.print()} className="btn-secondary">🖨️ Print receipt</button>
        )}
        <Link to="/dashboard" className="btn-primary">Go to dashboard →</Link>
      </div>
    </div>
  );
}
