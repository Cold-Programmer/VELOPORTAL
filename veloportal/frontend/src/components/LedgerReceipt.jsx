import React from 'react';

/**
 * Renders the official VeloPortal ledger-style receipt, matching the printed
 * format from the System Design Specification (Figure 8):
 *
 *   VELOPORTAL MICRO-STATION
 *   KCA Campus Operational Hub Ledger
 *   -------------------------------
 *   Rider Reference Name: ...
 *   University Reg ID: ...
 *   Tracked Vehicle Model: ...
 *   Aggregated Time Checked: ...
 *   -------------------------------
 *   Base Reservation Fee:      ... KES
 *   Late Return Penalty (Xhrs): ... KES
 *   -------------------------------
 *   TOTAL LEDGER PAID:          ... KES
 *
 * kind: 'rental' | 'order' | 'event'
 */
export default function LedgerReceipt({ kind, user, record }) {
  if (!record) return null;
  const isRental = kind === 'rental';
  const isEvent  = kind === 'event';
  const isCash   = kind === 'order' && record.paymentMethod === 'cash_on_delivery';

  const totalHours = isRental
    ? Math.max(1, Math.round((new Date(record.actualReturnDate || record.endDate) - new Date(record.startDate)) / 36e5))
    : null;

  const base = isRental ? Number(record.totalCost) || 0
    : isEvent ? Number(record.Event?.price) || 0
    : Number(record.totalAmount) || 0;
  const lateFee = isRental ? Number(record.lateFee || 0) : 0;
  const total = base + lateFee;

  const receiptNo = isRental || isEvent ? record.id?.slice(0, 8).toUpperCase() : record.orderNumber;
  const mpesaReceipt = record.Payment?.mpesaReceiptNumber || record.PenaltyPayment?.mpesaReceiptNumber;

  const subtitle = isRental ? 'KCA Campus Operational Hub Ledger'
    : isEvent ? 'Event Registration Ledger'
    : 'Order Ledger';

  return (
    <div className="ledger-receipt rounded-2xl border border-dashed border-ink/20 bg-white p-6 font-mono text-[13px] leading-relaxed text-ink">
      <p className="text-center text-base font-bold tracking-wide">VELOPORTAL MICRO-STATION</p>
      <p className="text-center text-xs text-ink/60">{subtitle}</p>
      <div className="my-3 border-t border-dashed border-ink/30" />

      <p>Receipt Ref: {receiptNo}</p>
      <p>Rider Reference Name: {user?.name || '—'}</p>
      <p>University Reg ID: {user?.regNumber || '—'}</p>

      {isRental && (
        <>
          <p>Tracked Vehicle Model: {record.Bicycle?.name || '—'}</p>
          <p>Aggregated Time Checked: {totalHours} Hour{totalHours === 1 ? '' : 's'} Total</p>
        </>
      )}

      {isEvent && (
        <>
          <p>Event: {record.Event?.title || '—'}</p>
          <p>Ticket Code: {record.ticketCode}</p>
          <p>Payment Method: {record.paymentMethod === 'cash' ? 'Cash at event' : record.paymentMethod === 'free' ? 'Free entry' : 'M-Pesa'}</p>
        </>
      )}

      {kind === 'order' && (
        <>
          <p>Order Number: {record.orderNumber}</p>
          <p>Payment Method: {isCash ? 'Cash on delivery' : 'M-Pesa'}</p>
          {record.OrderItems?.map((i) => (
            <p key={i.id} className="pl-2">- {i.Bicycle?.name} × {i.quantity}</p>
          ))}
        </>
      )}

      <div className="my-3 border-t border-dashed border-ink/30" />

      <div className="flex justify-between">
        <span>{isEvent ? 'Ticket Fee:' : 'Base Reservation Fee:'}</span><span>{base.toFixed(2)} KES</span>
      </div>
      {isRental && lateFee > 0 && (
        <div className="flex justify-between text-red-600">
          <span>Late Return Penalty ({Number(record.lateHours)} hrs):</span><span>{lateFee.toFixed(2)} KES</span>
        </div>
      )}

      <div className="my-3 border-t border-dashed border-ink/30" />

      <div className="flex justify-between text-base font-bold">
        <span>TOTAL LEDGER PAID:</span><span>{total.toFixed(2)} KES</span>
      </div>

      {mpesaReceipt && <p className="mt-3 text-xs text-ink/50">M-Pesa receipt: {mpesaReceipt}</p>}
      {isEvent && record.paymentMethod === 'cash' && (
        <p className="mt-3 text-xs text-amber-dark">💵 Pay this amount in cash at the event check-in desk.</p>
      )}
    </div>
  );
}
