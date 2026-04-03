import { Loader2, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

const getErrorMessage = (error, fallback) => error?.response?.data?.error || fallback;

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (localStorage.getItem('admin_token')) {
      navigate('/admin/orders', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await api.post('/auth/login', {
        username,
        password,
      });

      localStorage.setItem('admin_token', response.data.token);
      navigate('/admin/orders', { replace: true });
    } catch (loginError) {
      setError(getErrorMessage(loginError, 'Login failed. Check your credentials.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="glass-panel w-full max-w-md rounded-[2rem] border border-white/10 p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Shield size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-textMuted">
              Admin
            </p>
            <h1 className="mt-1 text-3xl">Restaurant control room</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-textMuted">
              Username
            </label>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="premium-input"
              placeholder="admin"
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
      </div>
    </div>
  );
}
