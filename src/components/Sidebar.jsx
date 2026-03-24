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
    ],
  },
  {
    label: 'Tools',
    items: [
      { to: '/devtools', label: 'Dev Tools', icon: '💻' },
      { to: '/focus', label: 'Focus', icon: '🔥' },
      { to: '/health', label: 'Health', icon: '🏥' },
      { to: '/knowledge', label: 'Knowledge', icon: '📚' },
      { to: '/networking', label: 'Networking', icon: '🤝' },
      { to: '/news', label: 'News', icon: '📰' },
      { to: '/converter', label: 'Converter', icon: '🔄' },
      { to: '/worldclock', label: 'World Clock', icon: '🕐' },
      { to: '/flashcards', label: 'Flashcards', icon: '🃏' },
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
    <aside className="w-56 bg-[#111113] border-r border-[#27272a] flex flex-col h-full shrink-0 overflow-y-auto">
      <div className="p-5 border-b border-[#27272a] shrink-0">
        <h1 className="text-xl font-bold text-[#e4e4e7]">Helios <span className="text-amber-400">☀️</span></h1>
      </div>
      <nav className="flex-1 p-3 space-y-4">
        {navGroups.map((group, gi) => (
          <div key={group.label}>
            {gi > 0 && <div className="border-t border-[#27272a]/60 mb-3" />}
            <p className="text-[#3f3f46] text-[10px] font-semibold uppercase tracking-widest px-3 mb-1">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ to, label, icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onNavClick}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative ${
                      isActive
                        ? 'bg-amber-500/10 text-[#f59e0b] border-l-2 border-amber-500 pl-[10px]'
                        : 'text-[#71717a] hover:text-[#e4e4e7] hover:bg-[#27272a] border-l-2 border-transparent pl-[10px]'
                    }`
                  }
                >
                  <span className="shrink-0">{icon}</span>
                  <span className="truncate">{label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      {user && (
        <div className="p-3 border-t border-[#27272a] shrink-0">
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold shrink-0">
                {user.username[0].toUpperCase()}
              </span>
              <span className="text-[#a1a1aa] text-xs truncate">{user.username}</span>
            </div>
            <button
              onClick={logout}
              className="text-[#52525b] hover:text-red-400 text-xs ml-2 transition-colors shrink-0"
              title="Sign out"
            >
              ⏏
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
