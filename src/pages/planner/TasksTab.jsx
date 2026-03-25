import { useState } from 'react';
import { useTasks, groupTasks, getTodayStr } from '../../hooks/useTasks';
import { useGemini } from '../../hooks/useGemini';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { buildPrioritizePrompt, parsePrioritizeResponse, buildBreakDownPrompt, parseBreakDownResponse } from './geminiUtils';

const PRIORITY_COLORS = {
  High: 'text-red-400',
  Medium: 'text-amber-400',
  Low: 'text-zinc-400',
};

const PRIORITY_BG = {
  High: 'bg-red-900/20 border-red-800/30',
  Medium: 'bg-amber-900/20 border-amber-800/30',
  Low: 'bg-zinc-800/30 border-zinc-700/30',
};

const RECURRING_OPTIONS = ['None', 'Daily', 'Weekly'];

function TaskItem({ task, onToggle, onDelete, onUpdate, onBreakDown, hasKey }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`border px-3 py-2.5 ${task.completed ? 'bg-background border-[#1a1a1c]' : 'bg-secondary border-border'}`}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(task.id)}
          className={`mt-0.5 w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors ${
            task.completed
              ? 'bg-foreground border-[#f59e0b] text-black'
              : 'border-[#3f3f46] hover:border-[#f59e0b]'
          }`}
          aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
        >
          {task.completed && <span className="text-[10px] font-bold">✓</span>}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-medium ${task.completed ? 'text-muted-foreground/80 line-through' : 'text-foreground'}`}>
              {task.title}
            </span>
            <span className={`text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>
              {task.priority}
            </span>
            {task.recurring !== 'None' && (
              <span className="text-xs text-muted-foreground/80 bg-secondary px-1.5 py-0.5 rounded">
                🔄 {task.recurring}
              </span>
            )}
            {task.parentId && (
              <span className="text-xs text-muted-foreground/80">↳ subtask</span>
            )}
          </div>
          {task.dueDate && (
            <p className="text-xs text-muted-foreground/80 mt-0.5">Due: {task.dueDate}</p>
          )}
          {task.notes && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.notes}</p>
          )}
        </div>

        {/* Actions */}
        {!task.completed && (
          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-muted-foreground/60 hover:text-muted-foreground text-xs px-1"
              title="Edit"
            >
              ✎
            </button>
            {hasKey && (
              <button
                onClick={() => onBreakDown(task)}
                className="text-muted-foreground/60 hover:text-amber-400 text-xs px-1"
                title="Break down with AI"
              >
                ✨
              </button>
            )}
            <button
              onClick={() => onDelete(task.id)}
              className="text-muted-foreground/60 hover:text-red-400 text-xs px-1"
              title="Delete"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Inline edit */}
      {expanded && (
        <div className="mt-2 pt-2 border-t border-border space-y-2">
          <input
            type="text"
            value={task.title}
            onChange={(e) => onUpdate(task.id, { title: e.target.value })}
            className="w-full bg-background border border-border px-2 py-1.5 text-sm text-foreground focus:outline-none focus:border-[#f59e0b]"
          />
          <div className="flex gap-2 flex-wrap">
            <select
              value={task.priority}
              onChange={(e) => onUpdate(task.id, { priority: e.target.value })}
              className="bg-background border border-border px-2 py-1 text-xs text-foreground focus:outline-none"
            >
              {['High', 'Medium', 'Low'].map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <input
              type="date"
              value={task.dueDate || ''}
              onChange={(e) => onUpdate(task.id, { dueDate: e.target.value || null })}
              className="bg-background border border-border px-2 py-1 text-xs text-foreground focus:outline-none"
            />
            <select
              value={task.recurring}
              onChange={(e) => onUpdate(task.id, { recurring: e.target.value })}
              className="bg-background border border-border px-2 py-1 text-xs text-foreground focus:outline-none"
            >
              {RECURRING_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <textarea
            value={task.notes || ''}
            onChange={(e) => onUpdate(task.id, { notes: e.target.value })}
            placeholder="Notes…"
            rows={2}
            className="w-full bg-background border border-border px-2 py-1.5 text-xs text-foreground placeholder-[#52525b] focus:outline-none resize-none"
          />
          <button
            onClick={() => setExpanded(false)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}

function TaskGroup({ title, tasks, onToggle, onDelete, onUpdate, onBreakDown, hasKey, accent = '' }) {
  if (tasks.length === 0) return null;
  return (
    <div>
      <h4 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${accent || 'text-muted-foreground'}`}>
        {title} ({tasks.length})
      </h4>
      <div className="space-y-2">
        {tasks.map((t) => (
          <TaskItem key={t.id} task={t} onToggle={onToggle} onDelete={onDelete} onUpdate={onUpdate} onBreakDown={onBreakDown} hasKey={hasKey} />
        ))}
      </div>
    </div>
  );
}

export function TasksTab() {
  const { tasks, addTask, toggleComplete, deleteTask, updateTask, reorderTasks } = useTasks();
  const { generate, generateStructured, loading: aiLoading, hasKey } = useGemini();
  const today = getTodayStr();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', priority: 'Medium', dueDate: '', notes: '', recurring: 'None' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [aiPrioritySuggestion, setAiPrioritySuggestion] = useState(null);
  const [breakDownLoading, setBreakDownLoading] = useState(null);

  const grouped = groupTasks(tasks, today);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    addTask({ ...newTask, dueDate: newTask.dueDate || null });
    setNewTask({ title: '', priority: 'Medium', dueDate: '', notes: '', recurring: 'None' });
    setShowAddForm(false);
  };

  const handlePrioritize = async () => {
    const incompleteTasks = tasks.filter((t) => !t.completed);
    try {
      const prompt = buildPrioritizePrompt(incompleteTasks);
      const result = await generateStructured({
        system: 'You are a productivity assistant. Prioritize tasks by urgency, deadlines, and impact.',
        prompt,
        schema: {
          type: 'OBJECT',
          properties: {
            order: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Task IDs in priority order' },
            reasoning: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Brief explanation for top 3 tasks' },
          },
          required: ['order', 'reasoning'],
        },
      });
      setAiPrioritySuggestion(result);
    } catch {}
  };

  const handleApplyPriority = () => {
    if (aiPrioritySuggestion?.order?.length) {
      reorderTasks(aiPrioritySuggestion.order);
    }
    setAiPrioritySuggestion(null);
  };

  const handleBreakDown = async (task) => {
    setBreakDownLoading(task.id);
    try {
      const subtasks = await generateStructured({
        system: 'You break down tasks into concrete, actionable sub-tasks. Each should be completable in one sitting.',
        prompt: `Break down this task into 3-5 sub-tasks:\n\nTask: "${task.title}"\nNotes: "${task.notes || 'none'}"`,
        schema: {
          type: 'ARRAY',
          items: { type: 'STRING' },
        },
      });
      if (Array.isArray(subtasks)) {
        for (const st of subtasks) {
          addTask({ title: st, priority: task.priority, parentId: task.id, dueDate: task.dueDate });
        }
      }
    } catch {}
    setBreakDownLoading(null);
  };

  const handleDeleteTask = (id) => {
    setDeleteTarget(id);
  };
  const confirmDeleteTask = () => {
    deleteTask(deleteTarget);
    setDeleteTarget(null);
  };

  const commonProps = {
    onToggle: toggleComplete,
    onDelete: handleDeleteTask,
    onUpdate: updateTask,
    onBreakDown: handleBreakDown,
    hasKey,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-foreground font-semibold">Tasks</h3>
        <div className="flex gap-2">
          {hasKey && (
            <button
              onClick={handlePrioritize}
              disabled={aiLoading}
              className="text-sm px-3 py-1.5 bg-secondary text-foreground hover:bg-amber-500/20 transition-colors disabled:opacity-40"
            >
              {aiLoading ? '⏳' : '✨ Prioritize for Me'}
            </button>
          )}
        </div>
      </div>

      {/* Add form */}
      {showAddForm && (
        <form onSubmit={handleAdd} className="bg-background border border-border p-4 space-y-3">
          <input
            type="text"
            placeholder="Task title…"
            value={newTask.title}
            onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))}
            autoFocus
            className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground placeholder-[#52525b] focus:outline-none focus:border-[#f59e0b]"
          />
          <div className="flex gap-2 flex-wrap">
            <select
              value={newTask.priority}
              onChange={(e) => setNewTask((p) => ({ ...p, priority: e.target.value }))}
              className="bg-background border border-border px-2 py-1.5 text-xs text-foreground focus:outline-none"
            >
              {['High', 'Medium', 'Low'].map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <input
              type="date"
              value={newTask.dueDate}
              onChange={(e) => setNewTask((p) => ({ ...p, dueDate: e.target.value }))}
              className="bg-background border border-border px-2 py-1.5 text-xs text-foreground focus:outline-none"
            />
            <select
              value={newTask.recurring}
              onChange={(e) => setNewTask((p) => ({ ...p, recurring: e.target.value }))}
              className="bg-background border border-border px-2 py-1.5 text-xs text-foreground focus:outline-none"
            >
              {RECURRING_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <textarea
            placeholder="Notes (optional)…"
            value={newTask.notes}
            onChange={(e) => setNewTask((p) => ({ ...p, notes: e.target.value }))}
            rows={2}
            className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground placeholder-[#52525b] focus:outline-none resize-none"
          />
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-1.5 text-sm bg-foreground hover:bg-[#d97706] text-black font-semibold">
              Add Task
            </button>
            <button type="button" onClick={() => setShowAddForm(false)} className="px-3 py-1.5 text-sm bg-secondary hover:bg-[#3f3f46] text-muted-foreground">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* AI Priority Suggestion */}
      {aiPrioritySuggestion && (
        <div className="bg-secondary border border-amber-500/30 p-4 space-y-2">
          <p className="text-foreground text-sm font-medium">✨ AI Suggested Priority Order</p>
          {aiPrioritySuggestion.reasoning?.map((r, i) => (
            <p key={i} className="text-xs text-muted-foreground">• {r}</p>
          ))}
          <div className="flex gap-2">
            <button onClick={handleApplyPriority} className="px-3 py-1.5 text-sm bg-amber-500 hover:bg-amber-600 text-black font-semibold">
              Apply Order
            </button>
            <button onClick={() => setAiPrioritySuggestion(null)} className="px-3 py-1.5 text-sm bg-secondary hover:bg-[#3f3f46] text-muted-foreground">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Task groups */}
      {tasks.length === 0 ? (
        <p className="text-muted-foreground/80 text-sm text-center py-8">No tasks yet. Tap + to add one.</p>
      ) : (
        <div className="space-y-6">
          <TaskGroup title="🔴 Overdue" tasks={grouped.overdue} accent="text-red-400" {...commonProps} />
          <TaskGroup title="📅 Due Today" tasks={grouped.today} accent="text-amber-400" {...commonProps} />
          <TaskGroup title="📆 Upcoming" tasks={grouped.upcoming} accent="text-blue-400" {...commonProps} />
          <TaskGroup title="🗂️ No Due Date" tasks={grouped.noDate} {...commonProps} />
          {grouped.completed.length > 0 && (
            <details>
              <summary className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 cursor-pointer hover:text-muted-foreground/80">
                ✅ Completed ({grouped.completed.length})
              </summary>
              <div className="mt-2 space-y-2">
                {grouped.completed.map((t) => (
                  <TaskItem key={t.id} task={t} {...commonProps} />
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* FAB — floating add button */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          data-testid="tasks-fab"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-foreground hover:bg-[#d97706] text-black text-2xl font-bold shadow-lg shadow-amber-500/30 transition-colors flex items-center justify-center"
          aria-label="Add Task"
        >
          +
        </button>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteTask}
        title="Delete task?"
        message="This will permanently delete this task."
      />
    </div>
  );
}
