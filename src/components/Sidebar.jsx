import { NavLink, useNavigate } from 'react-router-dom';
import kosLogo from '../assets/KOS.png';

const navItems = [
  {
    label: 'Overview',
    to: '/',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M3 12h8V3H3v9ZM13 21h8v-6h-8v6ZM13 3h8v8h-8V3ZM3 21h8v-6H3v6Z" />
      </svg>
    )
  },
  {
    label: 'Bookings',
    to: '/bookings',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M7 3v4M17 3v4M3 9h18M6 13h4M6 17h8" />
        <rect x="3" y="5" width="18" height="16" rx="2" />
      </svg>
    )
  },
  {
    label: 'Leads',
    to: '/leads',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M4 6h16M4 12h16M4 18h10" />
        <circle cx="19" cy="18" r="3" />
      </svg>
    )
  }
];

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="fixed left-0 top-0 z-20 h-screen w-64">
      <div className="flex h-full flex-col gap-6 border-r border-white/10 bg-black p-6 text-white shadow-card">
        <div className="flex flex-col items-start gap-2">
          <img src={kosLogo} alt="KairaOS" className="h-9 w-auto object-contain" />
          <p className="text-xs text-gray-400">Operations Dashboard</p>
        </div>

        <nav className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                [
                  'relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition',
                  isActive
                    ? "bg-white text-black shadow-soft before:absolute before:inset-0 before:-z-10 before:rounded-xl before:bg-white/20 before:blur-[18px] before:content-['']"
                    : 'text-gray-400 hover:bg-white/10 hover:text-white'
                ].join(' ')
              }
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-4">
          <button
            type="button"
            onClick={handleLogout}
            className="group flex w-full items-center rounded-xl border border-red-400/35 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-100 transition hover:border-red-300/60 hover:bg-red-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/40"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-red-500/20 text-red-200 transition group-hover:bg-red-500/30 group-hover:text-red-100">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <path d="M16 17l5-5-5-5" />
                  <path d="M21 12H9" />
                </svg>
              </span>
              <span>Logout</span>
            </span>
          </button>

        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
