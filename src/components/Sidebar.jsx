import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const navGroups = [
  {
    label: 'Main',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: '⚡' },
      { to: '/planner', label: 'Planner', icon: '🗓️' },
      { to: '/goals', label: 'Goals', icon: '🎯' },
      { to: '/resume', label: 'Resume', icon: '📄' },
    ],
  },
  {
    label: 'Personal',
    items: [
      { to: '/trips', label: 'Trips', icon: '✈️' },
      { to: '/finance', label: 'Finance', icon: '💰' },
      { to: '/investments', label: 'Investments', icon: '📈' },
      { to: '/sports', label: 'Sports', icon: '🏆' },
      { to: '/health', label: 'Health', icon: '🏥' },
      { to: '/meals', label: 'Meals', icon: '🍽️' },
      { to: '/subscriptions', label: 'Subscriptions', icon: '📋' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { to: '/chat', label: 'P2P Chat', icon: '💬' },
      { to: '/focus', label: 'Focus', icon: '🔥' },
      { to: '/knowledge', label: 'Knowledge', icon: '📚' },
      { to: '/networking', label: 'Networking', icon: '🤝' },
      { to: '/news', label: 'News', icon: '📰' },
      { to: '/flashcards', label: 'Flashcards', icon: '🃏' },
      { to: '/music', label: 'Music', icon: '🎵' },
      { to: '/splitter', label: 'Splitter', icon: '💸' },
      { to: '/packing', label: 'Packing', icon: '🧳' },
    ],
  },
  {
    label: 'Developer',
    items: [
      { to: '/devtools', label: 'Dev Tools', icon: '💻' },
      { to: '/converter', label: 'Converter', icon: '🔄' },
      { to: '/worldclock', label: 'World Clock', icon: '🕐' },
      { to: '/apiplayground', label: 'API Playground', icon: '🔌' },
      { to: '/colors', label: 'Colors', icon: '🎨' },
      { to: '/wiki', label: 'Wiki', icon: '📝' },
      { to: '/regex', label: 'Regex', icon: '🔤' },
      { to: '/calculator', label: 'Calculator', icon: '🧮' },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/settings', label: 'Settings', icon: '⚙️' },
    ],
  },
];

export function Sidebar({ onNavClick }) {
  const { user, logout } = useAuth();

  return (
    <aside className="w-60 bg-[#0c0c0e] border-r border-[#1c1c20] flex flex-col h-full shrink-0 overflow-hidden">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#1c1c20] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-sm font-bold text-black">
            H
          </div>
          <span className="text-lg font-bold text-[#e4e4e7]">Helios</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5 scrollbar-hide">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="text-[#3f3f46] text-[10px] font-semibold uppercase tracking-[0.12em] px-3 mb-1.5">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ to, label, icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onNavClick}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'text-[#71717a] hover:text-[#e4e4e7] hover:bg-[#18181b]'
                    }`
                  }
                >
                  <span className="shrink-0 text-base w-5 text-center">{icon}</span>
                  <span className="truncate">{label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User section */}
      {user && (
        <div className="px-3 py-3 border-t border-[#1c1c20] shrink-0">
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#111113]">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-black flex items-center justify-center text-xs font-bold shrink-0">
                {user.username[0].toUpperCase()}
              </span>
              <span className="text-[#a1a1aa] text-xs font-medium truncate">{user.username}</span>
            </div>
            <button
              onClick={logout}
              className="text-[#3f3f46] hover:text-red-400 text-xs ml-2 transition-colors shrink-0 p-1 rounded-lg hover:bg-red-950/20"
              title="Sign out"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16,17 21,12 16,7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
