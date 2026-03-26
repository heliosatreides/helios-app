import { HealthTab } from '../dashboard/HealthTab';
import { PageHeader } from '../../components/ui';

export function HealthPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Health" />
      <HealthTab />
    </div>
  );
}
