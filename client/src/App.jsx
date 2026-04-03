import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import GlassNav from './components/common/GlassNav';
import OfflineBanner from './components/common/OfflineBanner';
import SyncManager from './components/common/SyncManager';
import HomeView from './pages/Customer/HomeView';
import MenuView from './pages/Customer/MenuView';
import CartView from './pages/Customer/CartView';
import TrackView from './pages/Customer/TrackView';
import PaymentView from './pages/Customer/PaymentView';

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
  return (
    <SyncManager>
      {({ syncing, recentlySyncedCount }) => (
        <div className="min-h-screen bg-background text-textMain pb-24">
          <OfflineBanner syncing={syncing} recentlySyncedCount={recentlySyncedCount} />

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
          </Routes>

          <GlassNav />
        </div>
      )}
    </SyncManager>
  );
}

export default App;
