/**
 * Gemini prompt builders and response parsers for the planner module.
 */

/**
 * Extracts JSON from raw text that may contain markdown code blocks.
 */
function extractJSON(raw) {
  if (!raw) return raw;
  // Try to extract from ```json ... ``` or ``` ... ```
  const blockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (blockMatch) return blockMatch[1].trim();
  return raw.trim();
}

/**
 * Build prompt for "Plan My Day" feature.
 * @param {Array} tasks - list of tasks for today
 * @param {Array} schedule - existing schedule blocks
 */
export function buildPlanMyDayPrompt(tasks, schedule) {
  const taskList = tasks
    .filter((t) => !t.completed)
    .map((t) => `- ${t.title} (Priority: ${t.priority}${t.dueDate ? `, Due: ${t.dueDate}` : ''})`)
    .join('\n') || '(no tasks)';

  const scheduleList = schedule
    .map((s) => `- ${s.slotTime}: ${s.title} (${s.duration}min)`)
    .join('\n') || '(no existing blocks)';

  return `You are a productivity assistant. Create a time-blocked daily schedule.

Today's tasks:
${taskList}

Existing schedule blocks:
${scheduleList}

Create a realistic schedule from 6:00 AM to 11:00 PM in 30-minute slots.
Return ONLY a JSON array with no extra text. Each item should have:
- slotTime: "HH:MM" (24-hour format)
- title: string
- duration: 30, 60, or 120 (minutes)
- color: "amber", "blue", "green", or "red"

Example: [{"slotTime":"09:00","title":"Deep work","duration":60,"color":"blue"}]`;
}

/**
 * Build prompt for "Prioritize for Me" feature.
 * @param {Array} tasks - all incomplete tasks
 */
export function buildPrioritizePrompt(tasks) {
  const taskList = tasks
    .filter((t) => !t.completed)
    .map((t, i) => `${i + 1}. ID="${t.id}" | "${t.title}" | Priority: ${t.priority}${t.dueDate ? ` | Due: ${t.dueDate}` : ''}`)
    .join('\n');

  return `You are a productivity assistant. Analyze these tasks and suggest the best order to tackle them today.

Tasks:
${taskList}

Return ONLY a JSON object with:
- "order": array of task IDs in suggested priority order
- "reasoning": array of brief explanations (one per task, max 3 entries for top tasks)

Example: {"order":["id1","id2"],"reasoning":["id1 is urgent because...","id2 has an upcoming deadline"]}`;
}

/**
 * Build prompt for "Break Down Task" feature.
 * @param {string} title - task title
 * @param {string} notes - task notes
 */
export function buildBreakDownPrompt(title, notes) {
  return `Break down this task into 3-5 concrete, actionable sub-tasks.

Task: "${title}"
Notes: "${notes || 'none'}"

Return ONLY a JSON array of sub-task title strings. Each should be specific and completable in one sitting.
Example: ["Research options","Draft outline","Review with team"]

Provide exactly 3-5 sub-tasks.`;
}

/**
 * Parse Gemini response for schedule.
 * @param {string} raw
 * @returns {Array} array of event objects
 */
export function parseScheduleResponse(raw) {
  try {
    const json = extractJSON(raw);
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e) => e && typeof e.slotTime === 'string' && typeof e.title === 'string'
    );
  } catch {
    return [];
  }
}

/**
 * Parse Gemini response for task prioritization.
 * @param {string} raw
 * @returns {{ order: string[], reasoning: string[] }}
 */
export function parsePrioritizeResponse(raw) {
  try {
    const json = extractJSON(raw);
    const parsed = JSON.parse(json);
    return {
      order: Array.isArray(parsed.order) ? parsed.order : [],
      reasoning: Array.isArray(parsed.reasoning) ? parsed.reasoning : [],
    };
  } catch {
    return { order: [], reasoning: [] };
  }
}

/**
 * Parse Gemini response for task breakdown.
 * @param {string} raw
 * @returns {string[]} array of sub-task titles
 */
export function parseBreakDownResponse(raw) {
  try {
    const json = extractJSON(raw);
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((s) => typeof s === 'string');
  } catch {
    return [];
  }
}
