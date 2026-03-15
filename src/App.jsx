import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import Overview from './pages/Overview.jsx';
import Bookings from './pages/Bookings.jsx';
import Leads from './pages/Leads.jsx';

const App = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Sidebar />
        <div className="pl-64">
          <main className="mx-auto w-full max-w-[1400px] space-y-6 px-4 py-6 lg:px-8">
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/bookings" element={<Bookings />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;
