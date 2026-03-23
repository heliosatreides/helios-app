import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '⚡', exact: true },
  { to: '/trips', label: 'Trips', icon: '✈️' },
  { to: '/finance', label: 'Finance', icon: '💰' },
  { to: '/investments', label: 'Investments', icon: '📈' },
];

export function Sidebar({ onNavClick }) {
  return (
    <aside className="w-56 bg-[#111113] border-r border-[#27272a] flex flex-col h-full shrink-0">
      <div className="p-5 border-b border-[#27272a]">
        <h1 className="text-xl font-bold text-[#e4e4e7]">Helios <span className="text-amber-400">☀️</span></h1>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ to, label, icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            onClick={onNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative ${
                isActive
                  ? 'bg-amber-500/10 text-[#f59e0b] border-l-2 border-amber-500 pl-[10px]'
                  : 'text-[#71717a] hover:text-[#e4e4e7] hover:bg-[#27272a] border-l-2 border-transparent pl-[10px]'
              }`
            }
          >
            <span>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
