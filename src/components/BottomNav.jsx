import { NavLink, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  {
    to: '/dashboard',
    label: 'Home',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    to: '/planner',
    label: 'Planner',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="0" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    to: '/finance',
    label: 'Finance',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    to: '/ai',
    label: 'AI Chat',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

const MORE_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

export function BottomNav({ onOpenSidebar }) {
  const location = useLocation();

  // Check if current route is NOT one of the 4 main nav items
  const isMoreActive = !NAV_ITEMS.some(({ to }) =>
    to === '/ai'
      ? location.pathname === '/ai'
      : location.pathname.startsWith(to)
  );

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      data-testid="bottom-nav"
    >
      <div className="flex items-center justify-around h-14">
        {NAV_ITEMS.map(({ to, label, icon }) => {
          const isActive = to === '/ai'
            ? location.pathname === '/ai'
            : location.pathname.startsWith(to);

          return (
            <NavLink
              key={to}
              to={to}
              className={`relative flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] px-2 py-1 transition-colors ${
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              }`}
              aria-label={label}
            >
              {isActive && (
                <span className="absolute top-0 left-2 right-2 h-0.5 bg-foreground" />
              )}
              <span className={isActive ? 'text-foreground' : 'text-muted-foreground/70'}>{icon}</span>
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </NavLink>
          );
        })}
        <button
          type="button"
          onClick={onOpenSidebar}
          className={`relative flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[44px] px-2 py-1 transition-colors ${
            isMoreActive
              ? 'text-foreground'
              : 'text-muted-foreground'
          }`}
          aria-label="More"
          data-testid="bottom-nav-more"
        >
          {isMoreActive && (
            <span className="absolute top-0 left-2 right-2 h-0.5 bg-foreground" />
          )}
          <span className={isMoreActive ? 'text-foreground' : 'text-muted-foreground/70'}>{MORE_ICON}</span>
          <span className="text-[10px] font-medium leading-none">More</span>
        </button>
      </div>
    </nav>
  );
}
