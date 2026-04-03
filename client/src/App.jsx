import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import RequireStaffRoute from './components/admin/RequireStaffRoute';
import GlassNav from './components/common/GlassNav';
import OfflineBanner from './components/common/OfflineBanner';
import SyncManager from './components/common/SyncManager';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminLogin from './pages/Admin/AdminLogin';
import KitchenDashboard from './pages/Admin/KitchenDashboard';
import CartView from './pages/Customer/CartView';
import HomeView from './pages/Customer/HomeView';
import MenuView from './pages/Customer/MenuView';
import PaymentView from './pages/Customer/PaymentView';
import TrackView from './pages/Customer/TrackView';

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

function App() {
  const location = useLocation();
  const isStaffRoute =
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/staff') ||
    location.pathname.startsWith('/kitchen');

  return (
    <SyncManager>
      {({ syncing, recentlySyncedCount }) => (
        <div className={`min-h-screen bg-background text-textMain ${isStaffRoute ? '' : 'pb-24'}`}>
          {!isStaffRoute ? (
            <OfflineBanner syncing={syncing} recentlySyncedCount={recentlySyncedCount} />
          ) : null}

          <Routes>
            <Route path="/table/:tableNum" element={<TableRedirect />} />
            <Route path="/" element={<HomeView />} />
            <Route path="/menu" element={<MenuView />} />
            <Route path="/order" element={<CartView />} />
            <Route path="/cart" element={<Navigate to="/order" replace />} />
            <Route path="/orders" element={<TrackView />} />
            <Route path="/orders/:orderId" element={<TrackView />} />
            <Route path="/track" element={<Navigate to="/orders" replace />} />
            <Route path="/track/:orderId" element={<TrackView />} />
            <Route path="/payment/:txRef" element={<PaymentView />} />

            <Route path="/staff/login" element={<AdminLogin />} />
            <Route path="/admin/login" element={<Navigate to="/staff/login" replace />} />
            <Route
              path="/admin/*"
              element={
                <RequireStaffRoute allowRoles={['ADMIN']}>
                  <AdminDashboard />
                </RequireStaffRoute>
              }
            />
            <Route
              path="/kitchen"
              element={
                <RequireStaffRoute allowRoles={['ADMIN', 'KITCHEN']}>
                  <KitchenDashboard />
                </RequireStaffRoute>
              }
            />
          </Routes>

          {!isStaffRoute ? <GlassNav /> : null}
        </div>
      )}
    </SyncManager>
  );
}

export default App;
