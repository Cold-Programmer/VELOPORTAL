import React from 'react';
import Modal from './Modal';
import LedgerReceipt from './LedgerReceipt';
import { useAuth } from '../context/AuthContext';

/**
 * kind: 'order' | 'rental'
 * record: the order or rental object (with .Payment / .PenaltyPayment attached by the API)
 */
export default function ReceiptModal({ open, onClose, kind, record, onRetry, retrying }) {
  const { user } = useAuth();
  if (!record) return null;

  const payment = record.Payment;
  const isCash  = (kind === 'order' && record.paymentMethod === 'cash_on_delivery')
    || (kind === 'event' && ['cash', 'free'].includes(record.paymentMethod));
  const paid    = payment?.status === 'success';
  const failed  = payment?.status === 'failed';
  // Cash-on-delivery orders / cash-or-free events never get an M-Pesa Payment
  // row — treat that as its own settled state instead of an eternal spinner.
  const pending = !isCash && (!payment || payment?.status === 'pending');

  const icon  = isCash ? (kind === 'event' ? '🎟️' : '💵') : paid ? '✅' : failed ? '⚠️' : '⏳';
  const title = isCash ? (kind === 'event' ? 'You\'re registered!' : 'Order placed — pay on delivery')
    : paid ? 'Payment received'
    : failed ? 'Payment failed'
    : 'Waiting for M-Pesa…';
  const subtitle = isCash
    ? (kind === 'event'
        ? (record.paymentMethod === 'cash' ? 'Pay in cash at the event. Here is your ticket receipt.' : 'Free entry — here is your ticket receipt.')
        : "You'll pay in cash when your order arrives. Here's your receipt.")
    : paid ? 'Here is your receipt.'
    : failed ? 'The M-Pesa prompt was cancelled or timed out.'
    : 'Check your phone and enter your M-Pesa PIN. This closes automatically once confirmed.';

  return (
    <Modal open={open} onClose={onClose} wide>
      <div className="text-center print:hidden">
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl animate-pop ${
          paid || isCash ? 'bg-forest/10 dark:bg-forest/20' : failed ? 'bg-red-50 dark:bg-red-900/20' : 'bg-amber/20'
        }`}>
          {icon}
        </div>
        <h2 className="mt-4 font-display text-2xl font-bold">{title}</h2>
        <p className="mt-1 text-sm text-ink-400 dark:text-white/50">{subtitle}</p>
      </div>

      <div className="mt-6">
        <LedgerReceipt kind={kind} user={user} record={record} />
      </div>

      <p className="mt-4 text-center text-xs text-ink-400 dark:text-white/40 print:hidden">
        This receipt is always available from your <strong>Dashboard</strong> — look for the
        "View receipt" button next to this {kind === 'order' ? 'order' : kind === 'event' ? 'event registration' : 'rental'}.
      </p>

      <div className="mt-4 flex gap-3 print:hidden">
        {(paid || isCash) && <button onClick={() => window.print()} className="btn-secondary flex-1">🖨️ Print receipt</button>}
        {failed && (
          <button onClick={onRetry} disabled={retrying} className="btn-amber flex-1 disabled:opacity-50">
            {retrying ? 'Retrying…' : '📱 Retry M-Pesa payment'}
          </button>
        )}
        <button onClick={onClose} className="btn-primary flex-1">
          {pending ? 'Continue to dashboard' : 'Close'}
        </button>
      </div>
    </Modal>
  );
}
