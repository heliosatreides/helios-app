import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const navGroups = [
  {
    label: 'Main',
    items: [
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/planner', label: 'Planner' },
      { to: '/goals', label: 'Goals' },
      { to: '/resume', label: 'Resume' },
    ],
  },
  {
    label: 'Personal',
    items: [
      { to: '/trips', label: 'Trips' },
      { to: '/finance', label: 'Finance' },
      { to: '/investments', label: 'Investments' },
      { to: '/sports', label: 'Sports' },
      { to: '/health', label: 'Health' },
      { to: '/meals', label: 'Meals' },
      { to: '/subscriptions', label: 'Subscriptions' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { to: '/chat', label: 'Chat' },
      { to: '/focus', label: 'Focus' },
      { to: '/knowledge', label: 'Knowledge' },
      { to: '/networking', label: 'Networking' },
      { to: '/news', label: 'News' },
      { to: '/flashcards', label: 'Flashcards' },
      { to: '/music', label: 'Music' },
      { to: '/splitter', label: 'Splitter' },
      { to: '/packing', label: 'Packing' },
    ],
  },
  {
    label: 'Developer',
    items: [
      { to: '/devtools', label: 'Dev Tools' },
      { to: '/converter', label: 'Converter' },
      { to: '/worldclock', label: 'World Clock' },
      { to: '/apiplayground', label: 'API Playground' },
      { to: '/colors', label: 'Colors' },
      { to: '/wiki', label: 'Wiki' },
      { to: '/regex', label: 'Regex' },
      { to: '/calculator', label: 'Calculator' },
    ],
  },
  {
    label: '',
    items: [
      { to: '/settings', label: 'Settings' },
    ],
  },
];

export function Sidebar({ onNavClick }) {
  const { user, logout } = useAuth();

  return (
    <aside className="w-56 bg-background border-r border-border flex flex-col h-full shrink-0 overflow-hidden">
      <div className="px-4 py-4 border-b border-border shrink-0">
        <span className="text-sm font-semibold tracking-tight text-foreground">Helios</span>
      </div>

      {/* Search trigger */}
      <div className="px-3 pt-3 pb-1 shrink-0">
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md border border-border text-muted-foreground text-xs hover:bg-secondary transition-colors"
        >
          <span className="flex-1 text-left">Search...</span>
          <kbd className="text-[10px] text-muted-foreground font-mono">⌘K</kbd>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-4 scrollbar-hide">
        {navGroups.map((group) => (
          <div key={group.label || 'bottom'}>
            {group.label && (
              <p className="text-muted-foreground text-[11px] font-medium px-3 mb-1">{group.label}</p>
            )}
            <div className="space-y-0.5">
              {group.items.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onNavClick}
                  className={({ isActive }) =>
                    `block px-3 py-1.5 rounded-md text-[13px] transition-colors ${
                      isActive
                        ? 'bg-secondary text-foreground font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {user && (
        <div className="px-3 py-3 border-t border-border shrink-0">
          <div className="flex items-center justify-between px-3 py-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-6 h-6 rounded-full bg-secondary text-foreground flex items-center justify-center text-[11px] font-medium shrink-0">
                {user.username[0].toUpperCase()}
              </span>
              <span className="text-muted-foreground text-xs truncate">{user.username}</span>
            </div>
            <button
              onClick={logout}
              className="text-muted-foreground hover:text-foreground text-xs transition-colors"
              title="Sign out"
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
