import { useState } from 'react';
import { useIDB } from '../../hooks/useIDB';
import { useGemini } from '../../hooks/useGemini';
import { PageHeader } from '../../components/ui';
import { Modal } from '../../components/Modal';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SLOTS = ['Breakfast', 'Lunch', 'Dinner'];

function emptyWeek() {
  const week = {};
  for (const day of DAYS) {
    week[day] = {};
    for (const slot of SLOTS) {
      week[day][slot] = null;
    }
  }
  return week;
}

export function MealsPage() {
  const [plan, setPlan] = useIDB('meal-plan', emptyWeek());
  const [tab, setTab] = useState('planner'); // 'planner' | 'grocery' | 'ai'
  const [editCell, setEditCell] = useState(null); // {day, slot}
  const [form, setForm] = useState({ name: '', calories: '', prepTime: '', recipeUrl: '', ingredients: '' });
  const [dietPrefs, setDietPrefs] = useState(localStorage.getItem('helios-diet-prefs') || '');
  const [availableIngredients, setAvailableIngredients] = useState('');
  const [aiPlan, setAiPlan] = useState('');
  const [aiMeals, setAiMeals] = useState('');
  const { generate, loading, error } = useGemini();

  function saveCell() {
    if (!form.name.trim() || !editCell) return;
    const meal = {
      name: form.name.trim(),
      calories: form.calories ? parseInt(form.calories) : null,
      prepTime: form.prepTime ? parseInt(form.prepTime) : null,
      recipeUrl: form.recipeUrl.trim() || null,
      ingredients: form.ingredients.split(',').map(i => i.trim()).filter(Boolean),
    };
    setPlan(prev => ({
      ...prev,
      [editCell.day]: { ...prev[editCell.day], [editCell.slot]: meal }
    }));
    setEditCell(null);
    setForm({ name: '', calories: '', prepTime: '', recipeUrl: '', ingredients: '' });
  }

  function clearCell(day, slot) {
    setPlan(prev => ({ ...prev, [day]: { ...prev[day], [slot]: null } }));
  }

  function openCell(day, slot) {
    const existing = plan[day]?.[slot];
    setEditCell({ day, slot });
    setForm(existing ? {
      name: existing.name,
      calories: existing.calories?.toString() || '',
      prepTime: existing.prepTime?.toString() || '',
      recipeUrl: existing.recipeUrl || '',
      ingredients: existing.ingredients?.join(', ') || '',
    } : { name: '', calories: '', prepTime: '', recipeUrl: '', ingredients: '' });
  }

  const totalCalories = DAYS.reduce((acc, day) =>
    acc + SLOTS.reduce((a, slot) => a + (plan[day]?.[slot]?.calories || 0), 0), 0);

  const groceryList = [];
  const seen = new Set();
  for (const day of DAYS) {
    for (const slot of SLOTS) {
      const meal = plan[day]?.[slot];
      if (meal?.ingredients) {
        for (const ing of meal.ingredients) {
          if (!seen.has(ing.toLowerCase())) {
            seen.add(ing.toLowerCase());
            groceryList.push(ing);
          }
        }
      }
    }
  }

  async function planMyWeek() {
    localStorage.setItem('helios-diet-prefs', dietPrefs);
    const resp = await generate(`You are a meal planning expert. Create a 7-day meal plan (Mon-Sun) with breakfast, lunch, and dinner for each day.\nDietary preferences: ${dietPrefs || 'none specified'}\n\nFormat as:\nMonday:\n  Breakfast: [meal name] (~[calories] cal)\n  Lunch: [meal name] (~[calories] cal)\n  Dinner: [meal name] (~[calories] cal)\n...and so on for all 7 days. Keep descriptions brief.`);
    setAiPlan(resp);
  }

  async function suggestMeals() {
    const resp = await generate(`Based on these available ingredients: ${availableIngredients}\n\nSuggest exactly 3 meals I can make. For each meal provide:\n- Name\n- Brief description\n- Why it works with these ingredients\n\nBe concise and practical.`);
    setAiMeals(resp);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Meal Planner">
        <div className="text-sm text-muted-foreground">~{totalCalories.toLocaleString()} cal/week</div>
      </PageHeader>

      <div className="flex gap-2">
        {['planner', 'grocery', 'ai'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium ${tab === t ? 'bg-amber-500 text-black' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
            {t === 'planner' ? '📅 Planner' : t === 'grocery' ? '🛒 Grocery List' : '✨ AI Help'}
          </button>
        ))}
      </div>

      {tab === 'planner' && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: '700px' }}>
            <thead>
              <tr>
                <th className="text-left text-xs text-muted-foreground/80 font-semibold pb-2 w-24">Day</th>
                {SLOTS.map(s => <th key={s} className="text-left text-xs text-muted-foreground/80 font-semibold pb-2 px-2">{s}</th>)}
              </tr>
            </thead>
            <tbody className="space-y-2">
              {DAYS.map(day => (
                <tr key={day}>
                  <td className="text-sm font-medium text-muted-foreground py-2 pr-4">{day.slice(0,3)}</td>
                  {SLOTS.map(slot => {
                    const meal = plan[day]?.[slot];
                    return (
                      <td key={slot} className="px-2 py-1">
                        <div
                          onClick={() => openCell(day, slot)}
                          className="bg-background border border-border p-2 min-h-[60px] cursor-pointer hover:border-amber-500/50 transition-colors relative group"
                        >
                          {meal ? (
                            <>
                              <div className="text-xs font-medium text-foreground">{meal.name}</div>
                              {meal.calories && <div className="text-xs text-muted-foreground">{meal.calories} cal</div>}
                              {meal.prepTime && <div className="text-xs text-muted-foreground/80">{meal.prepTime}m prep</div>}
                              <button onClick={e => { e.stopPropagation(); clearCell(day, slot); }} className="absolute top-1 right-1 text-muted-foreground/80 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100">✕</button>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground/60">+ Add meal</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'grocery' && (
        <div className="bg-background border border-border p-5">
          <h2 className="text-sm font-semibold text-muted-foreground mb-4">Auto-generated Grocery List</h2>
          {groceryList.length === 0 ? (
            <p className="text-muted-foreground/80 text-sm">Add meals with ingredients in the Planner tab to generate a grocery list.</p>
          ) : (
            <ul className="space-y-2">
              {groceryList.map((ing, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-foreground">
                  <span className="w-4 h-4 border border-border rounded" />
                  {ing}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'ai' && (
        <div className="space-y-6">
          <div className="bg-background border border-border p-5 space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground">✨ Plan My Week</h2>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Dietary Preferences (e.g., vegetarian, high-protein, low-carb)</label>
              <input value={dietPrefs} onChange={e => setDietPrefs(e.target.value)} placeholder="e.g., vegetarian, gluten-free, high protein" className="w-full bg-secondary border border-border px-3 py-2 text-foreground text-sm outline-none focus:border-amber-500" />
            </div>
            <button onClick={planMyWeek} disabled={loading} className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold hover:bg-purple-500 disabled:opacity-50">
              {loading ? 'Planning...' : '✨ Plan My Week'}
            </button>
            {aiPlan && <pre className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap bg-secondary p-4">{aiPlan}</pre>}
          </div>

          <div className="bg-background border border-border p-5 space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground">✨ What Can I Make?</h2>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Paste your available ingredients</label>
              <textarea value={availableIngredients} onChange={e => setAvailableIngredients(e.target.value)} placeholder="chicken, rice, onions, garlic, tomatoes..." rows={3} className="w-full bg-secondary border border-border px-3 py-2 text-foreground text-sm outline-none focus:border-amber-500 resize-none" />
            </div>
            <button onClick={suggestMeals} disabled={loading || !availableIngredients.trim()} className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold hover:bg-purple-500 disabled:opacity-50">
              {loading ? 'Thinking...' : '✨ Suggest Meals'}
            </button>
            {aiMeals && <pre className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap bg-secondary p-4">{aiMeals}</pre>}
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
      )}

      {/* Edit modal */}
      <Modal open={!!editCell} onClose={() => setEditCell(null)}>
        {editCell && (
          <div className="space-y-4">
            <h2 className="font-semibold text-foreground">{editCell.day} – {editCell.slot}</h2>
            {[
              { label: 'Meal Name', key: 'name', placeholder: 'e.g., Oatmeal with Berries' },
              { label: 'Calories (optional)', key: 'calories', placeholder: '350', type: 'number' },
              { label: 'Prep Time in minutes (optional)', key: 'prepTime', placeholder: '15', type: 'number' },
              { label: 'Recipe URL (optional)', key: 'recipeUrl', placeholder: 'https://...' },
              { label: 'Ingredients (comma-separated)', key: 'ingredients', placeholder: 'oats, berries, honey' },
            ].map(({ label, key, placeholder, type }) => (
              <div key={key}>
                <label className="block text-xs text-muted-foreground mb-1">{label}</label>
                <input type={type || 'text'} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} className="w-full bg-secondary border border-border px-3 py-2 text-foreground text-sm outline-none focus:border-amber-500" />
              </div>
            ))}
            <div className="flex gap-3">
              <button onClick={saveCell} className="flex-1 py-2 bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400">Save</button>
              <button onClick={() => setEditCell(null)} className="flex-1 py-2 bg-secondary text-muted-foreground text-sm hover:bg-[#3f3f46]">Cancel</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
