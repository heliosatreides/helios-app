import { GoalsTab } from '../dashboard/GoalsTab';

export function GoalsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-foreground">Goals & OKRs</h1>
      <GoalsTab />
    </div>
  );
}
