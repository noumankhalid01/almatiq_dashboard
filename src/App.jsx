import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import Overview from './pages/Overview.jsx';
import Bookings from './pages/Bookings.jsx';
import Leads from './pages/Leads.jsx';
import BillingHistory from './pages/BillingHistory.jsx';
import Signup from './pages/Signup.jsx';
import Login from './pages/Login.jsx';

const AppRoutes = () => {
  const location = useLocation();
  const isAuthRoute = location.pathname.startsWith('/signup') || location.pathname.startsWith('/login');
  const isAuthenticated = Boolean(localStorage.getItem('auth'));

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<Navigate to="/login?session_expired=1" replace />} />
      </Routes>
    );
  }

  if (isAuthRoute) {
    return (
      <Routes>
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/signup" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <div className="kaira-surface dashboard-font relative min-h-screen font-body text-white">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
      <div className="pointer-events-none absolute bottom-8 right-8 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
      <Sidebar />
      <div className="relative pl-64">
        <main className="mx-auto w-full max-w-[1400px] space-y-6 px-4 py-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/billing-history" element={<BillingHistory />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/signup" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;
