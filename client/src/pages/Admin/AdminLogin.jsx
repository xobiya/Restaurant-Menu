import { Loader2, Shield, Soup } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { getStoredStaffToken, getStoredStaffUser, saveStaffSession } from '../../lib/staffSession';

const getErrorMessage = (error, fallback) => error?.response?.data?.error || fallback;

const redirectForRole = (role, fallbackPath = '/admin') =>
  role === 'KITCHEN' ? '/kitchen' : fallbackPath;

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const fallbackPath = location.state?.from || '/admin';

  const [identifier, setIdentifier] = useState('admin@restaurant.local');
  const [password, setPassword] = useState('admin123');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (getStoredStaffToken()) {
      const user = getStoredStaffUser();
      navigate(redirectForRole(user?.role, fallbackPath), { replace: true });
    }
  }, [fallbackPath, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await api.post('/auth/login', {
        identifier,
        password,
      });

      saveStaffSession({
        token: response.data.token,
        user: response.data.user,
      });

      navigate(redirectForRole(response.data.user?.role, fallbackPath), { replace: true });
    } catch (loginError) {
      setError(getErrorMessage(loginError, 'Login failed. Check your credentials.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="glass-panel w-full max-w-lg rounded-[2rem] border border-white/10 p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Shield size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-textMuted">
              Staff Access
            </p>
            <h1 className="mt-1 text-3xl">Restaurant control room</h1>
          </div>
        </div>

        <p className="mt-4 text-sm text-textMuted">
          Sign in as an admin or kitchen user to manage orders, menu updates, and service flow.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-textMuted">
              Email or phone
            </label>
            <input
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              className="premium-input"
              placeholder="admin@restaurant.local"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-textMuted">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="premium-input"
              placeholder="********"
            />
          </div>

          {error ? <p className="text-sm text-red-300">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-4 text-sm font-semibold text-black transition hover:bg-primaryDark disabled:cursor-not-allowed disabled:bg-primary/60"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
            <span>{submitting ? 'Signing in...' : 'Sign in'}</span>
          </button>
        </form>

        <div className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-surfaceSoft p-4 text-sm text-textMuted sm:grid-cols-2">
          <div>
            <div className="flex items-center gap-2 text-textMain">
              <Shield size={16} />
              <span className="font-semibold">Admin demo</span>
            </div>
            <p className="mt-2">`admin@restaurant.local`</p>
            <p>`admin123`</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-textMain">
              <Soup size={16} />
              <span className="font-semibold">Kitchen demo</span>
            </div>
            <p className="mt-2">`kitchen@restaurant.local`</p>
            <p>`kitchen123`</p>
          </div>
        </div>
      </div>
    </div>
  );
}
