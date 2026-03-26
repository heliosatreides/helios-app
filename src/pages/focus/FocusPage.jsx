import { FocusTab } from '../dashboard/FocusTab';
import { PageHeader } from '../../components/ui';

export function FocusPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Focus" />
      <FocusTab />
    </div>
  );
}
