import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import api from '../../lib/api';
import {
  clearStaffSession,
  getStoredStaffToken,
  getStoredStaffUser,
  hasStaffRole,
  saveStaffSession,
} from '../../lib/staffSession';

export default function RequireStaffRoute({ allowRoles, children }) {
  const location = useLocation();
  const [status, setStatus] = useState(() => (getStoredStaffToken() ? 'checking' : 'unauthorized'));
  const [user, setUser] = useState(() => getStoredStaffUser());

  useEffect(() => {
    let ignore = false;

    const verifySession = async () => {
      const token = getStoredStaffToken();
      if (!token) {
        if (!ignore) {
          setStatus('unauthorized');
        }
        return;
      }

      try {
        const response = await api.get('/auth/me');
        if (ignore) return;

        const nextUser = response.data.user;
        saveStaffSession({
          token,
          user: nextUser,
        });
        setUser(nextUser);
        setStatus(hasStaffRole(nextUser, allowRoles) ? 'ready' : 'forbidden');
      } catch {
        clearStaffSession();
        if (!ignore) {
          setUser(null);
          setStatus('unauthorized');
        }
      }
    };

    verifySession();

    return () => {
      ignore = true;
    };
  }, [allowRoles]);

  if (status === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 text-textMuted">
        <Loader2 className="animate-spin" />
        <span>Checking staff session...</span>
      </div>
    );
  }

  if (status === 'unauthorized') {
    return <Navigate to="/staff/login" replace state={{ from: location.pathname }} />;
  }

  if (status === 'forbidden') {
    return <Navigate to={user?.role === 'KITCHEN' ? '/kitchen' : '/admin'} replace />;
  }

  return children;
}
