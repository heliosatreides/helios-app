import { useState, useCallback, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useCommandPalette } from './CommandPaletteContext';

const STORAGE_KEY = 'helios-sidebar-collapsed';
const DEFAULT_COLLAPSED = ['Developer'];

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
      { to: '/ai', label: 'AI Chat' },
      { to: '/chat', label: 'P2P Chat' },
      { to: '/focus', label: 'Focus' },
      { to: '/knowledge', label: 'Knowledge' },
      { to: '/networking', label: 'Networking' },
      { to: '/news', label: 'News' },
      { to: '/flashcards', label: 'Flashcards' },
      { to: '/music', label: 'Music' },
      { to: '/splitter', label: 'Splitter' },
      { to: '/packing', label: 'Packing' },
      { to: '/password', label: 'Passwords' },
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

function ChevronIcon({ expanded }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
    >
      <path d="M4.5 2.5L8 6L4.5 9.5" />
    </svg>
  );
}

function loadCollapsedState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [...DEFAULT_COLLAPSED];
}

function saveCollapsedState(collapsed) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collapsed));
  } catch {}
}

export function Sidebar({ onNavClick }) {
  const { user, logout } = useAuth();
  const { canInstall, install, isIOS, isInstalled } = usePWAInstall();
  const { openCommandPalette } = useCommandPalette();
  const location = useLocation();

  const [collapsedGroups, setCollapsedGroups] = useState(() => loadCollapsedState());

  // Auto-expand group containing active route
  useEffect(() => {
    const currentPath = location.pathname;
    for (const group of navGroups) {
      if (!group.label) continue;
      const hasActiveRoute = group.items.some(item => currentPath.startsWith(item.to));
      if (hasActiveRoute && collapsedGroups.includes(group.label)) {
        setCollapsedGroups(prev => {
          const next = prev.filter(g => g !== group.label);
          saveCollapsedState(next);
          return next;
        });
        break;
      }
    }
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleGroup = useCallback((label) => {
    setCollapsedGroups(prev => {
      const next = prev.includes(label)
        ? prev.filter(g => g !== label)
        : [...prev, label];
      saveCollapsedState(next);
      return next;
    });
  }, []);

  return (
    <aside className="w-56 bg-background border-r border-border flex flex-col h-full shrink-0 overflow-hidden">
      <div className="px-4 py-4 border-b border-border shrink-0">
        <span className="text-sm font-semibold tracking-tight text-foreground">Helios</span>
      </div>

      {/* Search trigger */}
      <div className="px-3 pt-3 pb-1 shrink-0">
        <button
          onClick={openCommandPalette}
          className="w-full flex items-center gap-2 px-3 py-2 md:py-1.5 min-h-[44px] md:min-h-0 rounded-md border border-border text-muted-foreground text-xs hover:bg-secondary transition-colors"
        >
          <span className="flex-1 text-left">Search...</span>
          <kbd className="text-[10px] text-muted-foreground font-mono">⌘K</kbd>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-4 scrollbar-hide">
        {navGroups.map((group) => {
          const isCollapsible = !!group.label;
          const isCollapsed = isCollapsible && collapsedGroups.includes(group.label);

          return (
            <div key={group.label || 'bottom'}>
              {isCollapsible ? (
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="w-full flex items-center justify-between px-3 min-h-[44px] md:min-h-0 md:h-auto mb-1 text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <span className="text-[11px] font-medium">{group.label}</span>
                  <ChevronIcon expanded={!isCollapsed} />
                </button>
              ) : null}
              {!isCollapsed && (
                <div className="space-y-0.5">
                  {group.items.map(({ to, label }) => (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={onNavClick}
                      className={({ isActive }) =>
                        `block px-3 py-2 md:py-1.5 rounded-md text-[13px] transition-colors ${
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
              )}
            </div>
          );
        })}
      </nav>

      {/* Install PWA prompt */}
      {!isInstalled && (canInstall || isIOS) && (
        <div className="px-3 pb-1 shrink-0">
          {canInstall ? (
            <button
              onClick={install}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground border border-border hover:bg-secondary/50 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Install App
            </button>
          ) : isIOS ? (
            <div className="px-3 py-2 text-[11px] text-muted-foreground/60 leading-relaxed">
              Tap the share button, then "Add to Home Screen" to install.
            </div>
          ) : null}
        </div>
      )}

      {user && (
        <div className="px-3 py-3 border-t border-border shrink-0">
          <div className="flex items-center justify-between px-3 py-2 md:py-1.5">
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
