// Meal planner utility tests

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

function calcWeeklyCalories(plan) {
  return DAYS.reduce((acc, day) =>
    acc + SLOTS.reduce((a, slot) => a + (plan[day]?.[slot]?.calories || 0), 0), 0);
}

function buildGroceryList(plan) {
  const items = [];
  const seen = new Set();
  for (const day of DAYS) {
    for (const slot of SLOTS) {
      const meal = plan[day]?.[slot];
      if (meal?.ingredients) {
        for (const ing of meal.ingredients) {
          const key = ing.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            items.push(ing);
          }
        }
      }
    }
  }
  return items;
}

describe('Weekly grid structure', () => {
  test('emptyWeek creates correct structure', () => {
    const week = emptyWeek();
    expect(Object.keys(week)).toHaveLength(7);
    for (const day of DAYS) {
      expect(week[day]).toBeDefined();
      expect(Object.keys(week[day])).toHaveLength(3);
      for (const slot of SLOTS) {
        expect(week[day][slot]).toBeNull();
      }
    }
  });

  test('has all 7 days', () => {
    const week = emptyWeek();
    for (const day of DAYS) {
      expect(week).toHaveProperty(day);
    }
  });

  test('has all 3 slots per day', () => {
    const week = emptyWeek();
    for (const day of DAYS) {
      expect(week[day]).toHaveProperty('Breakfast');
      expect(week[day]).toHaveProperty('Lunch');
      expect(week[day]).toHaveProperty('Dinner');
    }
  });
});

describe('Weekly calorie total', () => {
  test('calculates total calories', () => {
    const plan = emptyWeek();
    plan['Monday']['Breakfast'] = { name: 'Oatmeal', calories: 300, ingredients: [] };
    plan['Monday']['Lunch'] = { name: 'Salad', calories: 400, ingredients: [] };
    expect(calcWeeklyCalories(plan)).toBe(700);
  });

  test('returns 0 for empty week', () => {
    expect(calcWeeklyCalories(emptyWeek())).toBe(0);
  });

  test('ignores null slots', () => {
    const plan = emptyWeek();
    plan['Tuesday']['Dinner'] = { name: 'Pasta', calories: 600, ingredients: [] };
    expect(calcWeeklyCalories(plan)).toBe(600);
  });
});

describe('Grocery list aggregation', () => {
  test('collects ingredients from all meals', () => {
    const plan = emptyWeek();
    plan['Monday']['Breakfast'] = { name: 'Smoothie', calories: 250, ingredients: ['banana', 'milk', 'spinach'] };
    plan['Monday']['Lunch'] = { name: 'Salad', calories: 300, ingredients: ['lettuce', 'tomato'] };
    const list = buildGroceryList(plan);
    expect(list).toContain('banana');
    expect(list).toContain('lettuce');
    expect(list).toHaveLength(5);
  });

  test('deduplicates ingredients', () => {
    const plan = emptyWeek();
    plan['Monday']['Breakfast'] = { name: 'Egg toast', calories: 300, ingredients: ['eggs', 'bread'] };
    plan['Tuesday']['Breakfast'] = { name: 'French toast', calories: 350, ingredients: ['eggs', 'milk'] };
    const list = buildGroceryList(plan);
    const eggCount = list.filter(i => i.toLowerCase() === 'eggs').length;
    expect(eggCount).toBe(1);
  });

  test('returns empty list for empty plan', () => {
    expect(buildGroceryList(emptyWeek())).toHaveLength(0);
  });
});
