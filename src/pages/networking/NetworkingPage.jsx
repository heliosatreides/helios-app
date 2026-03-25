import { NetworkingTab } from '../dashboard/NetworkingTab';

export function NetworkingPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-foreground">Networking</h1>
      <NetworkingTab />
    </div>
  );
}
