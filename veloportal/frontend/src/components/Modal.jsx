import React, { useEffect } from 'react';

export default function Modal({ open, onClose, children, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-rise" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`animate-pop max-h-[90vh] w-full overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl ${wide ? 'max-w-xl' : 'max-w-md'}`}
      >
        {children}
      </div>
    </div>
  );
}
