export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

export function Card({ children, className = '', ...props }) {
  return <div className={`border border-border ${className}`} {...props}>{children}</div>;
}

export function TabBar({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 border-b border-border mb-6">
      {tabs.map((tab) => {
        const label = typeof tab === 'string' ? tab : tab.label;
        const id = typeof tab === 'string' ? tab : tab.id;
        return (
          <button key={id} onClick={() => onChange(id)}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              active === id ? 'text-foreground border-b-2 border-foreground -mb-px' : 'text-muted-foreground hover:text-foreground'
            }`}>{label}</button>
        );
      })}
    </div>
  );
}

export function Badge({ children, variant = 'default', className = '' }) {
  const v = {
    default: 'bg-secondary text-muted-foreground',
    green: 'bg-green-950 text-green-400',
    red: 'bg-red-950 text-red-400',
    amber: 'bg-secondary text-foreground',
  };
  return <span className={`text-xs px-2 py-0.5 font-medium ${v[variant] || v.default} ${className}`}>{children}</span>;
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="border border-dashed border-border p-10 text-center">
      {title && <h3 className="text-foreground font-medium mb-2">{title}</h3>}
      {description && <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">{description}</p>}
      {action}
    </div>
  );
}

export function ActionButton({ children, variant = 'primary', className = '', ...props }) {
  const v = {
    primary: 'bg-foreground text-background hover:bg-foreground/90',
    secondary: 'border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50',
    ghost: 'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
    danger: 'border border-red-800 text-red-400 hover:bg-red-950',
  };
  return <button className={`px-3 py-1.5 text-sm font-medium transition-colors ${v[variant] || v.primary} ${className}`} {...props}>{children}</button>;
}
