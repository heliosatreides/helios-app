/**
 * Shared UI primitives for consistent styling across Helios.
 * These are lightweight wrappers — not a full component library.
 */

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-[#e4e4e7]">{title}</h1>
        {subtitle && <p className="text-[#52525b] text-sm mt-0.5">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

export function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div
      className={`bg-[#0c0c0e] border border-[#1c1c20] rounded-2xl ${hover ? 'hover:border-[#27272a] transition-colors' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function TabBar({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 border-b border-[#1c1c20] mb-6">
      {tabs.map((tab) => {
        const label = typeof tab === 'string' ? tab : tab.label;
        const id = typeof tab === 'string' ? tab : tab.id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-xl transition-all ${
              active === id
                ? 'text-amber-400 border-b-2 border-amber-400 -mb-px'
                : 'text-[#52525b] hover:text-[#a1a1aa]'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-[#1c1c20] text-[#52525b]',
    amber: 'bg-amber-500/10 text-amber-400',
    green: 'bg-emerald-500/10 text-emerald-400',
    red: 'bg-red-500/10 text-red-400',
    violet: 'bg-violet-500/10 text-violet-400',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="bg-[#0c0c0e] border border-[#1c1c20] border-dashed rounded-2xl p-10 text-center">
      {icon && <span className="text-4xl mb-4 block">{icon}</span>}
      {title && <h3 className="text-[#e4e4e7] font-semibold mb-2">{title}</h3>}
      {description && <p className="text-[#52525b] text-sm max-w-md mx-auto mb-6">{description}</p>}
      {action}
    </div>
  );
}

export function ActionButton({ children, variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-black font-semibold shadow-lg shadow-amber-500/10',
    secondary: 'bg-[#111113] border border-[#1c1c20] text-[#a1a1aa] hover:text-[#e4e4e7] hover:border-[#27272a]',
    ghost: 'text-[#52525b] hover:text-[#a1a1aa] hover:bg-[#111113]',
    danger: 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/15',
    ai: 'bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 text-amber-400',
  };
  return (
    <button
      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
