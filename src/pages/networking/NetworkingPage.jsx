import { NetworkingTab } from '../dashboard/NetworkingTab';
import { PageHeader } from '../../components/ui';

export function NetworkingPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Networking" />
      <NetworkingTab />
    </div>
  );
}
