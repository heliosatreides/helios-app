import { HealthTab } from '../dashboard/HealthTab';

export function HealthPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-foreground">Health</h1>
      <HealthTab />
    </div>
  );
}
