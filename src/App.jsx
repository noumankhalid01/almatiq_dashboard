import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import Overview from './pages/Overview.jsx';
import Bookings from './pages/Bookings.jsx';
import Leads from './pages/Leads.jsx';
import LeadsFitness from './pages/LeadsFitness.jsx';
import Complaints from './pages/Complaints.jsx';
import Services from './pages/Services.jsx';
import AddOns from './pages/AddOns.jsx';
import BillingHistory from './pages/BillingHistory.jsx';
import MyAccount from './pages/MyAccount.jsx';
import Integrations from './pages/Integrations.jsx';
import Kaira from './pages/Kaira.jsx';
import Signup from './pages/Signup.jsx';
import Login from './pages/Login.jsx';
import AiConfigModal from './components/AiConfigModal.jsx';
import { useAuth } from './context/AuthContext.jsx';

const AppRoutes = () => {
  const location = useLocation();
  const { auth, login, logoutReason } = useAuth();
  const isAuthRoute = location.pathname.startsWith('/signup') || location.pathname.startsWith('/login');
  const isAuthenticated = Boolean(auth);

  if (!isAuthenticated) {
    const redirectTarget =
      logoutReason === 'logout' ? '/login' : '/login?session_expired=1';

    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<Navigate to={redirectTarget} replace />} />
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
    <>
      <div className="kaira-surface dashboard-font relative min-h-screen font-body text-white">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute bottom-8 right-8 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        <Sidebar />
        <div className="relative pl-64">
          <main className="mx-auto w-full max-w-[1400px] space-y-6 px-4 py-6 lg:px-8">
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/bookings" element={<Bookings />} />
              <Route
                path="/leads"
                element={auth?.industry === 'Wellness' ? <Leads /> : <Navigate to="/" replace />}
              />
              <Route
                path="/leads-fitness"
                element={auth?.industry === 'Fitness' ? <LeadsFitness /> : <Navigate to="/" replace />}
              />
              <Route
                path="/complaints"
                element={auth?.industry === 'Fitness' ? <Complaints /> : <Navigate to="/" replace />}
              />
              <Route path="/services" element={<Services />} />
              <Route path="/add-ons" element={<AddOns />} />
              <Route path="/billing-history" element={<BillingHistory />} />
              <Route path="/settings/my-account" element={<MyAccount />} />
              <Route path="/settings/integrations" element={<Integrations />} />
              <Route path="/settings/kaira" element={<Kaira />} />
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="/signup" element={<Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>

      {auth?.requires_ai_setup ? (
        <AiConfigModal
          open
          onClose={() => login({ ...auth, requires_ai_setup: false })}
          initialValues={{
            tone: '',
            business_context: '',
            instructions: ''
          }}
          onToast={() => {}}
          onComplete={() => login({ ...auth, requires_ai_setup: false, onboarding_step: 3 })}
        />
      ) : null}
    </>
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
