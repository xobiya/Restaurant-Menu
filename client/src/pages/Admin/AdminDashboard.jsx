import { NavLink, Routes, Route, Link } from 'react-router-dom';
import { LayoutDashboard, Utensils, Settings, LogOut, QrCode } from 'lucide-react';
import AdminOrderFeed from './AdminOrderFeed';
import AdminMenuManager from './AdminMenuManager';
import AdminQRGenerator from './AdminQRGenerator';

const AdminSidebarItem = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
        isActive ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-textMuted hover:bg-white/5 hover:text-white'
      }`
    }
  >
    <Icon size={20} strokeWidth={1.5} />
    <span className="font-medium">{label}</span>
  </NavLink>
);

export default function AdminDashboard() {
  return (
    <div className="flex h-screen bg-[#0a0a0a]">
      {/* Admin Sidebar */}
      <aside className="w-64 border-r border-white/5 p-6 flex flex-col justify-between">
        <div className="space-y-8">
          <div className="flex items-center space-x-2 px-4">
             <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-lg text-white">R</div>
             <span className="font-bold text-xl tracking-tight text-white">Admin PRO</span>
          </div>

          <nav className="space-y-2">
            <AdminSidebarItem to="/admin/orders" icon={LayoutDashboard} label="Live Feed" />
            <AdminSidebarItem to="/admin/menu" icon={Utensils} label="Menu Manager" />
            <AdminSidebarItem to="/admin/qr" icon={QrCode} label="QR Generator" />
            <AdminSidebarItem to="/admin/settings" icon={Settings} label="Settings" />
          </nav>
        </div>

        <Link to="/" className="flex items-center space-x-3 px-4 py-3 text-red-400 hover:text-red-300 transition-colors">
          <LogOut size={20} />
          <span className="font-medium text-sm">Exit Admin</span>
        </Link>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-background/50 backdrop-blur-3xl">
        <header className="h-16 border-b border-white/5 px-8 flex items-center justify-between">
            <h1 className="text-sm font-semibold text-textMuted uppercase tracking-widest">
                Kitchen Management System
            </h1>
            <div className="flex items-center space-x-4">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" title="System Online"></span>
                <span className="text-xs text-textMuted">Live Connection</span>
            </div>
        </header>

        <div className="p-8">
          <Routes>
            <Route path="orders" element={<AdminOrderFeed />} />
            <Route path="menu" element={<AdminMenuManager />} />
            <Route path="qr" element={<AdminQRGenerator />} />
            <Route path="/" element={<AdminOrderFeed />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
