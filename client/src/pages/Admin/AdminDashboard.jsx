import { Loader2, LogOut, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import MenuManager from '../../components/admin/MenuManager';
import OrdersPanel from '../../components/admin/OrdersPanel';
import PaymentsPanel from '../../components/admin/PaymentsPanel';
import QrGenerator from '../../components/admin/QrGenerator';
import api from '../../lib/api';

const adminLinks = [
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/menu', label: 'Menu' },
  { to: '/admin/payments', label: 'Payments' },
  { to: '/admin/qr', label: 'QR Codes' },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let ignore = false;

    const verifySession = async () => {
      try {
        await api.get('/auth/me');
        if (!ignore) {
          setCheckingAuth(false);
        }
      } catch {
        localStorage.removeItem('admin_token');
        if (!ignore) {
          navigate('/admin/login', { replace: true });
        }
      }
    };

    verifySession();
    return () => {
      ignore = true;
    };
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login', { replace: true });
  };

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 text-textMuted">
        <Loader2 className="animate-spin" />
        <span>Checking admin session...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background md:flex">
      <aside className="border-b border-white/5 bg-[#0b0d0f] md:flex md:min-h-screen md:w-72 md:flex-col md:justify-between md:border-b-0 md:border-r">
        <div className="space-y-6 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Shield size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-textMuted">
                Admin
              </p>
              <h1 className="mt-1 text-2xl">Restaurant HQ</h1>
            </div>
          </div>

          <nav className="no-scrollbar flex gap-2 overflow-x-auto md:flex-col">
            {adminLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-primary text-black'
                      : 'border border-white/10 text-textMuted hover:text-textMain'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="p-6 pt-0">
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-textMuted transition hover:text-textMain"
          >
            <LogOut size={16} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="border-b border-white/5 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-textMuted">
            Kitchen management system
          </p>
          <h2 className="mt-2">Run the floor, kitchen, and payment queue from one place.</h2>
        </header>

        <div className="p-6">
          <Routes>
            <Route index element={<Navigate to="orders" replace />} />
            <Route path="orders" element={<OrdersPanel />} />
            <Route path="menu" element={<MenuManager />} />
            <Route path="payments" element={<PaymentsPanel />} />
            <Route path="qr" element={<QrGenerator />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
