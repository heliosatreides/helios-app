import { GoalsTab } from '../dashboard/GoalsTab';
import { PageHeader } from '../../components/ui';
import { useIDB } from '../../hooks/useIDB';

export function GoalsPage() {
  const [tasks] = useIDB('planner-tasks', []);

  return (
    <div className="space-y-6">
      <PageHeader title="Goals & OKRs" />
      <GoalsTab tasks={tasks || []} />
    </div>
  );
}
