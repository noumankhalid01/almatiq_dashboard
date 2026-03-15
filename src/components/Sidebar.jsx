import { NavLink } from 'react-router-dom';
import almatiqLogo from '../assets/almatiq_logo2.jpg';
import poweredByLogo from '../assets/powered_by.png';
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
  return (
    <aside className="fixed left-0 top-0 z-20 h-screen w-64">
      <div className="flex h-full flex-col gap-6 border-r border-white/10 bg-black p-6 text-white shadow-card">
        <div className="flex flex-col items-start gap-2">
          <img src={almatiqLogo} alt="Almatiq" className="h-9 w-auto object-contain" />
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

        <div className="mt-auto flex items-center gap-2">
          <img src={poweredByLogo} alt="Powered by" className="h-2 w-auto object-contain opacity-80" />
          <img src={kosLogo} alt="KOS" className="h-3 w-auto object-contain" />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
