import { GoalsTab } from '../dashboard/GoalsTab';
import { useIDB } from '../../hooks/useIDB';

export function GoalsPage() {
  const [tasks] = useIDB('planner-tasks', []);

  return (
    <div className="space-y-6">
      <GoalsTab tasks={tasks || []} />
    </div>
  );
}
