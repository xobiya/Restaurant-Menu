import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import GlassNav from './components/common/GlassNav';
import MenuView from './pages/Customer/MenuView';
import CartView from './pages/Customer/CartView';
import TrackView from './pages/Customer/TrackView';
import PaymentView from './pages/Customer/PaymentView';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminLogin from './pages/Admin/AdminLogin';

function TableRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/table/')) {
      const tableNum = path.split('/')[2];
      if (tableNum) {
        localStorage.setItem('table_number', tableNum);
      }
      navigate('/menu');
    }
  }, [navigate]);
  return <div>Loading Table Context...</div>;
}

function RequireAdmin({ children }) {
  const token = localStorage.getItem('admin_token');
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-background text-textMain pb-24">
      <Routes>
        <Route path="/table/:tableNum" element={<TableRedirect />} />
        <Route path="/" element={<Navigate to="/menu" replace />} />
        <Route path="/menu" element={<MenuView />} />
        <Route path="/order" element={<CartView />} />
        <Route path="/cart" element={<Navigate to="/order" replace />} />
        <Route path="/track" element={<TrackView />} />
        <Route path="/track/:orderId" element={<TrackView />} />
        <Route path="/payment/:txRef" element={<PaymentView />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/*"
          element={
            <RequireAdmin>
              <AdminDashboard />
            </RequireAdmin>
          }
        />
      </Routes>

      {/* Hide GlassNav on Admin routes */}
      {!isAdminRoute && <GlassNav />}
    </div>
  );
}

export default App;
