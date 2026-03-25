import { useState } from 'react';

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
    <div className="flex gap-1 border border-border p-1 w-fit mb-6">
      {tabs.map((tab) => {
        const label = typeof tab === 'string' ? tab : tab.label;
        const id = typeof tab === 'string' ? tab : tab.id;
        return (
          <button key={id} onClick={() => onChange(id)}
            className={`px-4 py-2 text-sm font-medium transition-all ${
              active === id ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
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

export function CollapsibleCard({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-background border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-secondary/30 transition-colors"
        data-testid="collapsible-toggle"
      >
        <span className="text-foreground font-semibold">{title}</span>
        <span className="text-muted-foreground text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
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
    ai: 'border border-border text-foreground hover:bg-secondary/50 hover:text-foreground',
  };
  return <button className={`px-3 py-1.5 min-h-[44px] text-sm font-medium transition-colors ${v[variant] || v.primary} ${className}`} {...props}>{children}</button>;
}
