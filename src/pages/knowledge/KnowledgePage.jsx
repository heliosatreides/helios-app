import { KnowledgeTab } from '../dashboard/KnowledgeTab';
import { PageHeader } from '../../components/ui';

export function KnowledgePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Knowledge" subtitle="Track what you read, watch, and learn" />
      <KnowledgeTab />
    </div>
  );
}
