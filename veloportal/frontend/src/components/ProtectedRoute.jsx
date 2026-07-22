import React, { useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * roles: optional array of allowed roles (e.g. ['admin'], ['staff','admin']).
 * If omitted, any authenticated user may enter — VeloPortal requires an
 * account for all data pages, so this is the default gate almost everywhere.
 */
export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const notified = useRef(false);

  useEffect(() => {
    if (!loading && user && roles && !roles.includes(user.role) && !notified.current) {
      notified.current = true;
      window.dispatchEvent(new CustomEvent('veloportal:permission-denied', {
        detail: { message: `This section requires the ${roles.join(' or ')} role. Your account is a "${user.role}".` },
      }));
    }
  }, [loading, user, roles]);

  if (loading) return <div className="section text-center text-ink/50">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}
