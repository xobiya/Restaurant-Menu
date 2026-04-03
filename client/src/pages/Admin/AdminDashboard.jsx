import { LayoutDashboard, LogOut, QrCode, ReceiptText, Shield, Soup, WalletCards } from 'lucide-react';
import { Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import MenuManager from '../../components/admin/MenuManager';
import OrdersPanel from '../../components/admin/OrdersPanel';
import OverviewPanel from '../../components/admin/OverviewPanel';
import PaymentsPanel from '../../components/admin/PaymentsPanel';
import QrGenerator from '../../components/admin/QrGenerator';
import { clearStaffSession, getStoredStaffUser } from '../../lib/staffSession';

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/orders', label: 'Orders', icon: ReceiptText },
  { to: '/admin/menu', label: 'Menu', icon: Soup },
  { to: '/admin/payments', label: 'Payments', icon: WalletCards },
  { to: '/admin/qr', label: 'QR Codes', icon: QrCode },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = getStoredStaffUser();

  const handleLogout = () => {
    clearStaffSession();
    navigate('/staff/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background md:flex">
      <aside className="border-b border-white/5 bg-[#0b0d0f] md:flex md:min-h-screen md:w-80 md:flex-col md:justify-between md:border-b-0 md:border-r">
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

          <div className="rounded-[1.75rem] border border-white/10 bg-surfaceSoft p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-textMuted">Signed in as</p>
            <p className="mt-2 text-lg font-bold">{user?.name || 'Admin User'}</p>
            <p className="mt-1 text-sm text-textMuted">{user?.email || user?.phone || 'Admin access'}</p>
          </div>

          <nav className="no-scrollbar flex gap-2 overflow-x-auto md:flex-col">
            {adminLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      isActive
                        ? 'bg-primary text-black'
                        : 'border border-white/10 text-textMuted hover:text-textMain'
                    }`
                  }
                >
                  <Icon size={16} />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
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
            Ethiopian restaurant operations
          </p>
          <h2 className="mt-2">Manage the menu, kitchen queue, payments, and QR table flow from one place.</h2>
        </header>

        <div className="p-6">
          <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<OverviewPanel />} />
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
