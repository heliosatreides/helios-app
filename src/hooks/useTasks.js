import { useIDB } from './useIDB';
import { useCallback } from 'react';

const TASKS_KEY = 'planner-tasks';

/**
 * Group tasks into: overdue, today, upcoming, noDate, completed
 */
export function groupTasks(tasks, today = getTodayStr()) {
  const overdue = [];
  const todayTasks = [];
  const upcoming = [];
  const noDate = [];
  const completed = [];

  for (const task of tasks) {
    if (task.completed) {
      completed.push(task);
      continue;
    }
    if (!task.dueDate) {
      noDate.push(task);
    } else if (task.dueDate < today) {
      overdue.push(task);
    } else if (task.dueDate === today) {
      todayTasks.push(task);
    } else {
      upcoming.push(task);
    }
  }

  return { overdue, today: todayTasks, upcoming, noDate, completed };
}

export function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Handle carry-forward: tasks from yesterday that are incomplete should appear for today.
 * This mutates (returns new array) with updated lastActiveDate.
 */
export function applyCarryForward(tasks, today = getTodayStr()) {
  const yesterday = getYesterdayStr(today);
  return tasks.map((task) => {
    if (!task.completed && task.dueDate === yesterday) {
      // Carry forward to today
      return { ...task, dueDate: today };
    }
    return task;
  });
}

export function getYesterdayStr(today = getTodayStr()) {
  const d = new Date(today + 'T00:00:00');
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function useTasks() {
  const [tasks, setTasks] = useIDB(TASKS_KEY, []);

  const addTask = useCallback(
    (task) => {
      const newTask = {
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        title: '',
        priority: 'Medium',
        dueDate: null,
        notes: '',
        completed: false,
        recurring: 'None',
        parentId: null,
        createdAt: new Date().toISOString(),
        ...task,
      };
      setTasks((prev) => [...(prev || []), newTask]);
      return newTask;
    },
    [setTasks]
  );

  const toggleComplete = useCallback(
    (taskId) => {
      setTasks((prev) => {
        const today = getTodayStr();
        const newTasks = (prev || []).map((t) => {
          if (t.id !== taskId) return t;
          const nowCompleted = !t.completed;
          // If marking complete and recurring, create a new task
          return { ...t, completed: nowCompleted, completedAt: nowCompleted ? new Date().toISOString() : null };
        });

        // Handle recurring: if completing, create a new instance
        const task = (prev || []).find((t) => t.id === taskId);
        if (task && !task.completed && task.recurring !== 'None') {
          const nextDue = getNextDueDate(task.dueDate || today, task.recurring);
          const recurringTask = {
            ...task,
            id: Date.now().toString() + Math.random().toString(36).slice(2),
            completed: false,
            completedAt: null,
            dueDate: nextDue,
            createdAt: new Date().toISOString(),
          };
          return [...newTasks, recurringTask];
        }
        return newTasks;
      });
    },
    [setTasks]
  );

  const deleteTask = useCallback(
    (taskId) => {
      setTasks((prev) => (prev || []).filter((t) => t.id !== taskId));
    },
    [setTasks]
  );

  const updateTask = useCallback(
    (taskId, updates) => {
      setTasks((prev) =>
        (prev || []).map((t) => (t.id === taskId ? { ...t, ...updates } : t))
      );
    },
    [setTasks]
  );

  const reorderTasks = useCallback(
    (orderedIds) => {
      setTasks((prev) => {
        const map = Object.fromEntries((prev || []).map((t) => [t.id, t]));
        const reordered = orderedIds.map((id) => map[id]).filter(Boolean);
        const rest = (prev || []).filter((t) => !orderedIds.includes(t.id));
        return [...reordered, ...rest];
      });
    },
    [setTasks]
  );

  return { tasks: tasks || [], addTask, toggleComplete, deleteTask, updateTask, reorderTasks };
}

export function getNextDueDate(currentDue, recurring) {
  if (!currentDue || recurring === 'None') return null;
  const d = new Date(currentDue + 'T00:00:00');
  if (recurring === 'Daily') {
    d.setDate(d.getDate() + 1);
  } else if (recurring === 'Weekly') {
    d.setDate(d.getDate() + 7);
  }
  return d.toISOString().slice(0, 10);
}
