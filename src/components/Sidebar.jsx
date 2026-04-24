import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import kosLogo from '../assets/KOS.png';
import { parseAuth } from '../utils/tokenUtils.js';

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
  },
  {
    label: 'Billing History',
    to: '/billing-history',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M7 9h10M7 13h6" />
      </svg>
    )
  }
];

const settingsItems = [
  { label: 'My Account', to: '/settings/my-account' },
  { label: 'Integrations', to: '/settings/integrations' },
  { label: 'Kaira', to: '/settings/kaira' }
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const isSettingsRoute = location.pathname.startsWith('/settings');
  const auth = parseAuth() || {};
  const onboardingStep = Number(auth?.onboarding_step || 0);
  const showKairaPendingDot = onboardingStep < 3;
  const showSquareSetup = Number(auth?.current_plan?.plan_id || 0) !== 1;
  const showIntegrationsSetup = Boolean(
    !auth?.twilio_status || !auth?.instagram_status || (showSquareSetup && !auth?.square_status)
  );

  useEffect(() => {
    if (isSettingsRoute) {
      setSettingsOpen(true);
    }
  }, [isSettingsRoute]);

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

          <div className="space-y-2 sm:col-span-3 lg:col-span-1">
            <button
              type="button"
              onClick={() => setSettingsOpen((prev) => !prev)}
              className={[
                'flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition',
                isSettingsRoute
                  ? 'bg-white text-black shadow-soft'
                  : 'text-gray-400 hover:bg-white/10 hover:text-white'
              ].join(' ')}
            >
              <span className="flex items-center gap-3">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                  <circle cx="9" cy="6" r="2" fill="currentColor" stroke="none" />
                  <circle cx="15" cy="12" r="2" fill="currentColor" stroke="none" />
                  <circle cx="11" cy="18" r="2" fill="currentColor" stroke="none" />
                </svg>
                <span className="inline-flex items-center gap-2">
                  <span>Settings</span>
                  {showKairaPendingDot || showIntegrationsSetup ? (
                    <span className="rounded-full border border-amber-300/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-amber-300">
                      Setup
                    </span>
                  ) : null}
                </span>
              </span>
              <svg
                className={`h-4 w-4 transition ${settingsOpen ? 'rotate-180' : ''}`}
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {settingsOpen ? (
              <div className="space-y-1 pl-5">
                {settingsItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      [
                        'block rounded-lg px-3 py-2 text-xs font-medium transition',
                        isActive ? 'bg-white/20 text-white' : 'text-gray-400 hover:bg-white/10 hover:text-white'
                      ].join(' ')
                    }
                  >
                    <span className="inline-flex items-center gap-2">
                      <span>{item.label}</span>
                      {(item.label === 'Kaira' && showKairaPendingDot) || (item.label === 'Integrations' && showIntegrationsSetup) ? (
                        <span className="rounded-full border border-amber-300/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-amber-300">
                          Setup
                        </span>
                      ) : null}
                    </span>
                  </NavLink>
                ))}
              </div>
            ) : null}
          </div>
        </nav>

        <div className="mt-auto space-y-4">
          <button
            type="button"
            onClick={handleLogout}
            className="group flex w-full items-center rounded-md border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10 text-white transition group-hover:bg-white/15 group-hover:text-white">
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
