import { GoalsTab } from '../dashboard/GoalsTab';
import { PageHeader } from '../../components/ui';

export function GoalsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Goals & OKRs" />
      <GoalsTab />
    </div>
  );
}
