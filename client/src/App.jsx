import { Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import GlassNav from './components/common/GlassNav';
import MenuView from './pages/Customer/MenuView';
import CartView from './pages/Customer/CartView';
import TrackView from './pages/Customer/TrackView';
import AdminDashboard from './pages/Admin/AdminDashboard';

function TableRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    // In a real app, extract table number from URL params and set in Context/Zustand
    // Currently redirecting directly to Menu
    const path = window.location.pathname;
    if (path.startsWith('/table/')) {
        const tableNum = path.split('/')[2];
        localStorage.setItem('table_number', tableNum);
        navigate('/');
    }
  }, [navigate]);
  return <div>Loading Table Context...</div>;
}

function App() {
  return (
    <div className="min-h-screen bg-background text-textMain pb-24">
      <Routes>
        <Route path="/table/:tableNum" element={<TableRedirect />} />
        <Route path="/" element={<MenuView />} />
        <Route path="/cart" element={<CartView />} />
        <Route path="/track" element={<TrackView />} />
        <Route path="/track/:orderId" element={<TrackView />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
      </Routes>
      
      {/* Hide GlassNav on Admin routes */}
      {!window.location.pathname.startsWith('/admin') && <GlassNav />}
    </div>
  );
}

export default App;
