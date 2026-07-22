import React, { useEffect, useState } from 'react';
import Modal from './Modal';

/**
 * Listens for 'veloportal:permission-denied' events (dispatched by the API
 * client on 401/403 responses, and by ProtectedRoute on a role mismatch) and
 * shows a clear explanation instead of a silent redirect or console error.
 */
export default function PermissionModal() {
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const handler = (e) => setMessage(e.detail?.message || 'Access to that feature is restricted.');
    window.addEventListener('veloportal:permission-denied', handler);
    return () => window.removeEventListener('veloportal:permission-denied', handler);
  }, []);

  return (
    <Modal open={!!message} onClose={() => setMessage(null)}>
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber/20 text-2xl animate-pop">🔒</div>
        <h2 className="mt-4 font-display text-xl font-bold">Not available for your account</h2>
        <p className="mt-2 text-sm text-ink/60">{message}</p>
        <button onClick={() => setMessage(null)} className="btn-primary mt-6 w-full">Got it</button>
      </div>
    </Modal>
  );
}
