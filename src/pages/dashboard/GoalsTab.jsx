import { useState } from 'react';
import { useIDB } from '../../hooks/useIDB';
import { useGemini } from '../../hooks/useGemini';
import { AiSuggestion } from '../../components/AiSuggestion';

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const TIMEFRAMES = ['Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026', 'This Year', 'Ongoing'];
const COLOR_TAGS = [
  { label: 'Amber', value: 'amber', cls: 'bg-amber-500' },
  { label: 'Blue', value: 'blue', cls: 'bg-blue-500' },
  { label: 'Green', value: 'green', cls: 'bg-green-500' },
  { label: 'Purple', value: 'purple', cls: 'bg-purple-500' },
  { label: 'Red', value: 'red', cls: 'bg-red-500' },
];
const METRIC_TYPES = ['%', 'number', 'boolean'];

/** Calculate progress 0-100 for a single KR */
export function krProgress(kr) {
  if (kr.metricType === 'boolean') {
    return kr.currentValue ? 100 : 0;
  }
  const current = parseFloat(kr.currentValue) || 0;
  const target = parseFloat(kr.targetValue);
  if (!target || target === 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

/** Calculate average progress across all KRs */
export function objectiveProgress(objective) {
  if (!objective.keyResults || objective.keyResults.length === 0) return 0;
  const total = objective.keyResults.reduce((sum, kr) => sum + krProgress(kr), 0);
  return Math.round(total / objective.keyResults.length);
}

function progressColor(pct) {
  if (pct >= 70) return 'bg-green-500';
  if (pct >= 40) return 'bg-amber-500';
  return 'bg-red-500';
}

function progressTextColor(pct) {
  if (pct >= 70) return 'text-green-400';
  if (pct >= 40) return 'text-amber-400';
  return 'text-red-400';
}

function AddObjectiveForm({ onSave, onClose }) {
  const [title, setTitle] = useState('');
  const [timeframe, setTimeframe] = useState(TIMEFRAMES[0]);
  const [color, setColor] = useState('amber');

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), timeframe, color, keyResults: [] });
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" data-testid="add-objective-modal">
      <div className="bg-background border border-border p-6 w-full max-w-md">
        <h2 className="text-lg font-bold text-foreground mb-4">New Objective</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-muted-foreground text-sm mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Launch MVP product"
              className="w-full bg-background border border-border px-3 py-2 text-foreground text-sm focus:outline-none focus:border-[#f59e0b]"
              data-testid="objective-title-input"
            />
          </div>
          <div>
            <label className="block text-muted-foreground text-sm mb-1">Timeframe</label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="w-full bg-background border border-border px-3 py-2 text-foreground text-sm focus:outline-none focus:border-[#f59e0b]"
            >
              {TIMEFRAMES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-muted-foreground text-sm mb-1">Color Tag</label>
            <div className="flex gap-2">
              {COLOR_TAGS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-7 h-7 rounded-full ${c.cls} ${color === c.value ? 'ring-2 ring-white ring-offset-1 ring-offset-[#0a0a0b]' : ''}`}
                  title={c.label}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 bg-foreground hover:bg-foreground/90 text-black font-semibold py-2 text-sm transition-colors">
              Create Objective
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-secondary text-foreground font-semibold py-2 text-sm hover:bg-[#3f3f46] transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddKRForm({ onSave, onClose }) {
  const [title, setTitle] = useState('');
  const [metricType, setMetricType] = useState('%');
  const [currentValue, setCurrentValue] = useState('0');
  const [targetValue, setTargetValue] = useState('100');

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    const kr = {
      id: generateId(),
      title: title.trim(),
      metricType,
      currentValue: metricType === 'boolean' ? false : parseFloat(currentValue) || 0,
      targetValue: metricType === 'boolean' ? true : parseFloat(targetValue) || 100,
    };
    onSave(kr);
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" data-testid="add-kr-modal">
      <div className="bg-background border border-border p-6 w-full max-w-md">
        <h2 className="text-lg font-bold text-foreground mb-4">Add Key Result</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-muted-foreground text-sm mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Acquire 100 beta users"
              className="w-full bg-background border border-border px-3 py-2 text-foreground text-sm focus:outline-none focus:border-[#f59e0b]"
              data-testid="kr-title-input"
            />
          </div>
          <div>
            <label className="block text-muted-foreground text-sm mb-1">Metric Type</label>
            <select
              value={metricType}
              onChange={(e) => setMetricType(e.target.value)}
              className="w-full bg-background border border-border px-3 py-2 text-foreground text-sm focus:outline-none focus:border-[#f59e0b]"
              data-testid="kr-metric-select"
            >
              {METRIC_TYPES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          {metricType !== 'boolean' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-muted-foreground text-sm mb-1">Current</label>
                <input
                  type="number"
                  value={currentValue}
                  onChange={(e) => setCurrentValue(e.target.value)}
                  className="w-full bg-background border border-border px-3 py-2 text-foreground text-sm focus:outline-none focus:border-[#f59e0b]"
                  data-testid="kr-current-input"
                />
              </div>
              <div>
                <label className="block text-muted-foreground text-sm mb-1">Target</label>
                <input
                  type="number"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="w-full bg-background border border-border px-3 py-2 text-foreground text-sm focus:outline-none focus:border-[#f59e0b]"
                  data-testid="kr-target-input"
                />
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 bg-foreground hover:bg-foreground/90 text-black font-semibold py-2 text-sm transition-colors">
              Add Key Result
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-secondary text-foreground font-semibold py-2 text-sm hover:bg-[#3f3f46] transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function KRItem({ kr, onUpdateCurrent, objectiveId }) {
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(String(kr.currentValue));
  const pct = krProgress(kr);

  function handleSave() {
    if (kr.metricType === 'boolean') {
      onUpdateCurrent(kr.id, !kr.currentValue);
    } else {
      onUpdateCurrent(kr.id, parseFloat(editVal) || 0);
    }
    setEditing(false);
  }

  return (
    <div className="flex items-center gap-3 py-2" data-testid={`kr-item-${kr.id}`}>
      <div className="flex-1 min-w-0">
        <p className="text-muted-foreground text-sm truncate">{kr.title}</p>
        <p className="text-muted-foreground/80 text-xs mt-0.5">
          {kr.metricType === 'boolean' ? (kr.currentValue ? '✅ Done' : '⬜ Not done') : `${kr.currentValue} / ${kr.targetValue}${kr.metricType === '%' ? '%' : ''}`}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-sm font-bold ${progressTextColor(pct)}`}>{pct}%</span>
        {editing ? (
          <div className="flex gap-1">
            {kr.metricType === 'boolean' ? (
              <button
                type="button"
                onClick={handleSave}
                className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded"
                data-testid={`kr-toggle-${kr.id}`}
              >
                Toggle
              </button>
            ) : (
              <input
                type="number"
                value={editVal}
                onChange={(e) => setEditVal(e.target.value)}
                className="w-16 bg-secondary border border-[#f59e0b] rounded px-2 py-1 text-foreground text-xs"
                data-testid={`kr-edit-input-${kr.id}`}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
              />
            )}
            <button type="button" onClick={handleSave} className="text-xs text-green-400 px-1">✓</button>
            <button type="button" onClick={() => setEditing(false)} className="text-xs text-muted-foreground/80 px-1">✕</button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => { setEditVal(String(kr.currentValue)); setEditing(true); }}
            className="text-xs text-muted-foreground/80 hover:text-amber-400 px-1"
            data-testid={`kr-edit-btn-${kr.id}`}
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
}

function ObjectiveCard({ objective, onAddKR, onUpdateKRCurrent, onDelete, trips, budgets }) {
  const [expanded, setExpanded] = useState(true);
  const [showAddKR, setShowAddKR] = useState(false);
  const [showSuggestKR, setShowSuggestKR] = useState(false);
  const [suggestResult, setSuggestResult] = useState(null);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState(null);
  const { generate, hasKey } = useGemini();

  const pct = objectiveProgress(objective);
  const colorDot = COLOR_TAGS.find((c) => c.value === objective.color)?.cls || 'bg-amber-500';

  // Cross-app suggestions
  const upcomingTripsWithBudget = (trips || []).filter((t) => t.status === 'Upcoming' && t.budget > 0);
  const hasBudgets = (budgets || []).length > 0;

  async function handleSuggestKRs() {
    setSuggestLoading(true);
    setSuggestError(null);
    setSuggestResult(null);
    try {
      const prompt = `For the objective "${objective.title}" (timeframe: ${objective.timeframe}), suggest exactly 3 measurable, ambitious Key Results in OKR format. Return only a numbered list, one per line, with specific metrics (numbers, percentages, or clear binary outcomes). Be concise.`;
      const text = await generate(prompt);
      setSuggestResult(text);
    } catch (err) {
      setSuggestError(err.message);
    } finally {
      setSuggestLoading(false);
    }
  }

  return (
    <div className="bg-background border border-border p-5" data-testid={`objective-card-${objective.id}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className={`w-3 h-3 rounded-full shrink-0 ${colorDot}`} />
          <div className="min-w-0">
            <h3 className="text-foreground font-semibold truncate">{objective.title}</h3>
            <p className="text-muted-foreground/80 text-xs mt-0.5">{objective.timeframe}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-sm font-bold ${progressTextColor(pct)}`} data-testid={`objective-progress-${objective.id}`}>{pct}%</span>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-muted-foreground/80 hover:text-foreground px-1"
          >
            {expanded ? '▲' : '▼'}
          </button>
          <button
            type="button"
            onClick={() => onDelete(objective.id)}
            className="text-muted-foreground/80 hover:text-red-400 px-1 text-sm"
            data-testid={`delete-objective-${objective.id}`}
          >
            ×
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-secondary rounded-full overflow-hidden mb-4">
        <div
          className={`h-full rounded-full transition-all ${progressColor(pct)}`}
          style={{ width: `${pct}%` }}
          data-testid={`objective-progress-bar-${objective.id}`}
        />
      </div>

      {expanded && (
        <div>
          {/* Key Results */}
          <div className="divide-y divide-[#27272a]">
            {objective.keyResults.length === 0 ? (
              <p className="text-muted-foreground/80 text-sm py-2">No key results yet. Add some below.</p>
            ) : (
              objective.keyResults.map((kr) => (
                <KRItem
                  key={kr.id}
                  kr={kr}
                  onUpdateCurrent={(krId, val) => onUpdateKRCurrent(objective.id, krId, val)}
                  objectiveId={objective.id}
                />
              ))
            )}
          </div>

          {/* Cross-app suggestions */}
          {upcomingTripsWithBudget.length > 0 && (
            <div className="mt-3 space-y-1">
              <p className="text-muted-foreground/80 text-xs uppercase tracking-wider">Trip suggestions</p>
              {upcomingTripsWithBudget.map((trip) => (
                <p key={trip.id} className="text-muted-foreground text-xs">
                  💡 Travel to {trip.destination} — Budget goal: ${trip.budget.toLocaleString()}
                </p>
              ))}
            </div>
          )}
          {hasBudgets && (
            <p className="text-muted-foreground text-xs mt-2">💡 Monthly budget available — link it as a finance KR</p>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 mt-4">
            {(objective.keyResults.length < 5) && (
              <button
                type="button"
                onClick={() => setShowAddKR(true)}
                className="text-sm text-foreground hover:underline border border-amber-500/30 px-3 py-1.5 transition-colors"
                data-testid={`add-kr-btn-${objective.id}`}
              >
                + Add Key Result
              </button>
            )}
            {hasKey && (
              <button
                type="button"
                onClick={handleSuggestKRs}
                disabled={suggestLoading}
                className="text-sm text-foreground hover:underline border border-amber-500/30 px-3 py-1.5 transition-colors disabled:opacity-50"
              >
                {suggestLoading ? '⏳ Suggesting…' : '✨ Suggest key results'}
              </button>
            )}
          </div>
          <AiSuggestion loading={suggestLoading} result={suggestResult} error={suggestError} />
        </div>
      )}

      {showAddKR && (
        <AddKRForm
          onSave={(kr) => { onAddKR(objective.id, kr); setShowAddKR(false); }}
          onClose={() => setShowAddKR(false)}
        />
      )}
    </div>
  );
}

export function GoalsTab({ trips = [], budgets = [] }) {
  const [objectives, setObjectives] = useIDB('goals-objectives', []);
  const [showAddObjective, setShowAddObjective] = useState(false);
  const [rateResult, setRateResult] = useState(null);
  const [rateLoading, setRateLoading] = useState(false);
  const [rateError, setRateError] = useState(null);
  const { generate, hasKey } = useGemini();

  function handleAddObjective(data) {
    setObjectives((prev) => [...prev, { ...data, id: generateId() }]);
    setShowAddObjective(false);
  }

  function handleAddKR(objectiveId, kr) {
    setObjectives((prev) =>
      prev.map((o) =>
        o.id === objectiveId
          ? { ...o, keyResults: [...o.keyResults, kr] }
          : o
      )
    );
  }

  function handleUpdateKRCurrent(objectiveId, krId, value) {
    setObjectives((prev) =>
      prev.map((o) =>
        o.id === objectiveId
          ? {
              ...o,
              keyResults: o.keyResults.map((kr) =>
                kr.id === krId ? { ...kr, currentValue: value } : kr
              ),
            }
          : o
      )
    );
  }

  function handleDeleteObjective(id) {
    setObjectives((prev) => prev.filter((o) => o.id !== id));
  }

  async function handleRateProgress() {
    setRateLoading(true);
    setRateError(null);
    setRateResult(null);
    try {
      const summary = (objectives || [])
        .map((o) => {
          const pct = objectiveProgress(o);
          const krs = (o.keyResults || []).map((kr) => `  - ${kr.title}: ${krProgress(kr)}%`).join('\n');
          return `${o.title} (${o.timeframe}): ${pct}% overall\n${krs}`;
        })
        .join('\n\n');

      const prompt = `Review my OKR progress and give brief encouragement (2-3 sentences) plus exactly 1 specific, actionable suggestion to improve. Here's my progress:\n\n${summary || 'No objectives yet.'}`;
      const text = await generate(prompt);
      setRateResult(text);
    } catch (err) {
      setRateError(err.message);
    } finally {
      setRateLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Goals & OKRs</h1>
          <p className="text-muted-foreground text-sm mt-1">Track your objectives and key results</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddObjective(true)}
          className="px-4 py-2 bg-foreground hover:bg-foreground/90 text-black font-semibold transition-all text-sm shadow-sm shadow-amber-500/10"
          data-testid="add-objective-btn"
        >
          + New Objective
        </button>
      </div>

      {/* AI Rate Progress */}
      {hasKey && (
        <div>
          <button
            type="button"
            onClick={handleRateProgress}
            disabled={rateLoading}
            className="flex items-center gap-2 text-sm text-foreground hover:underline disabled:opacity-40 border border-amber-500/30 px-4 py-2 transition-colors"
            data-testid="rate-progress-btn"
          >
            {rateLoading ? '⏳ Analyzing…' : '✨ Rate my progress'}
          </button>
          <AiSuggestion loading={rateLoading} result={rateResult} error={rateError} />
        </div>
      )}

      {/* Objectives list */}
      {(!objectives || objectives.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-16 text-center" data-testid="goals-empty-state">
          <div className="text-5xl mb-4">🎯</div>
          <h3 className="text-foreground text-lg font-semibold mb-2">No objectives yet</h3>
          <p className="text-muted-foreground text-sm mb-4">Set your first objective to start tracking progress with OKRs</p>
          <button
            type="button"
            onClick={() => setShowAddObjective(true)}
            className="px-4 py-2 bg-foreground hover:bg-foreground/90 text-black font-semibold transition-all text-sm shadow-sm shadow-amber-500/10"
          >
            + New Objective
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {objectives.map((objective) => (
            <ObjectiveCard
              key={objective.id}
              objective={objective}
              onAddKR={handleAddKR}
              onUpdateKRCurrent={handleUpdateKRCurrent}
              onDelete={handleDeleteObjective}
              trips={trips}
              budgets={budgets}
            />
          ))}
        </div>
      )}

      {showAddObjective && (
        <AddObjectiveForm
          onSave={handleAddObjective}
          onClose={() => setShowAddObjective(false)}
        />
      )}
    </div>
  );
}
