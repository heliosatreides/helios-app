import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { krProgress, objectiveProgress } from './GoalsTab';
import { GoalsTab } from './GoalsTab';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../hooks/useGemini', () => ({
  useGemini: () => ({
    generate: vi.fn(),
    loading: false,
    error: null,
    hasKey: false,
  }),
}));

vi.mock('../../hooks/useIDB', () => ({
  useIDB: (key, initial) => {
    const { useState } = require('react');
    return useState(initial);
  },
}));

// ---- Pure function tests ----

describe('krProgress', () => {
  test('calculates percent metric correctly', () => {
    const kr = { metricType: '%', currentValue: 50, targetValue: 100 };
    expect(krProgress(kr)).toBe(50);
  });

  test('calculates number metric correctly', () => {
    const kr = { metricType: 'number', currentValue: 30, targetValue: 100 };
    expect(krProgress(kr)).toBe(30);
  });

  test('calculates boolean true as 100%', () => {
    const kr = { metricType: 'boolean', currentValue: true, targetValue: true };
    expect(krProgress(kr)).toBe(100);
  });

  test('calculates boolean false as 0%', () => {
    const kr = { metricType: 'boolean', currentValue: false, targetValue: true };
    expect(krProgress(kr)).toBe(0);
  });

  test('caps at 100%', () => {
    const kr = { metricType: 'number', currentValue: 150, targetValue: 100 };
    expect(krProgress(kr)).toBe(100);
  });

  test('returns 0 for zero target', () => {
    const kr = { metricType: 'number', currentValue: 10, targetValue: 0 };
    expect(krProgress(kr)).toBe(0);
  });
});

describe('objectiveProgress', () => {
  test('returns 0 for empty key results', () => {
    const obj = { keyResults: [] };
    expect(objectiveProgress(obj)).toBe(0);
  });

  test('averages KR progress', () => {
    const obj = {
      keyResults: [
        { metricType: 'number', currentValue: 50, targetValue: 100 },
        { metricType: 'number', currentValue: 100, targetValue: 100 },
      ],
    };
    expect(objectiveProgress(obj)).toBe(75);
  });

  test('handles mixed metric types', () => {
    const obj = {
      keyResults: [
        { metricType: 'boolean', currentValue: true, targetValue: true },
        { metricType: '%', currentValue: 0, targetValue: 100 },
      ],
    };
    expect(objectiveProgress(obj)).toBe(50);
  });
});

// ---- Component tests ----

function renderGoalsTab(props = {}) {
  return render(
    <MemoryRouter>
      <GoalsTab {...props} />
    </MemoryRouter>
  );
}

test('GoalsTab renders empty state', () => {
  renderGoalsTab();
  expect(screen.getByText(/no objectives yet/i)).toBeInTheDocument();
  expect(screen.getByText(/set your first objective/i)).toBeInTheDocument();
});

test('GoalsTab shows add objective button', () => {
  renderGoalsTab();
  expect(screen.getByTestId('add-objective-btn')).toBeInTheDocument();
});

test('GoalsTab opens add objective modal on button click', () => {
  renderGoalsTab();
  fireEvent.click(screen.getByTestId('add-objective-btn'));
  expect(screen.getByTestId('add-objective-modal')).toBeInTheDocument();
});

test('GoalsTab can add an objective', () => {
  renderGoalsTab();
  fireEvent.click(screen.getByTestId('add-objective-btn'));
  fireEvent.change(screen.getByTestId('objective-title-input'), {
    target: { value: 'Ship MVP' },
  });
  fireEvent.click(screen.getByText('Create Objective'));
  expect(screen.getByText('Ship MVP')).toBeInTheDocument();
});

test('GoalsTab can add a key result to an objective', () => {
  renderGoalsTab();
  // Add objective first
  fireEvent.click(screen.getByTestId('add-objective-btn'));
  fireEvent.change(screen.getByTestId('objective-title-input'), {
    target: { value: 'Launch Product' },
  });
  fireEvent.click(screen.getByText('Create Objective'));

  // Now add KR
  const objectiveId = screen.getAllByTestId(/^objective-card-/)[0].getAttribute('data-testid').replace('objective-card-', '');
  fireEvent.click(screen.getByTestId(`add-kr-btn-${objectiveId}`));
  expect(screen.getByTestId('add-kr-modal')).toBeInTheDocument();

  fireEvent.change(screen.getByTestId('kr-title-input'), {
    target: { value: '100 beta users' },
  });
  fireEvent.change(screen.getByTestId('kr-current-input'), {
    target: { value: '25' },
  });
  fireEvent.change(screen.getByTestId('kr-target-input'), {
    target: { value: '100' },
  });
  // Click submit button specifically (not the h2)
  fireEvent.click(screen.getByRole('button', { name: 'Add Key Result' }));

  expect(screen.getByText('100 beta users')).toBeInTheDocument();
  // Progress: 25/100 = 25% — may appear in both KR and objective
  expect(screen.getAllByText('25%').length).toBeGreaterThanOrEqual(1);
});

test('GoalsTab KR progress updates when current value changes (pure logic)', () => {
  const kr = { metricType: 'number', currentValue: 25, targetValue: 100 };
  expect(krProgress(kr)).toBe(25);

  const updatedKr = { ...kr, currentValue: 75 };
  expect(krProgress(updatedKr)).toBe(75);
});

test('GoalsTab modal can be closed', () => {
  renderGoalsTab();
  fireEvent.click(screen.getByTestId('add-objective-btn'));
  expect(screen.getByTestId('add-objective-modal')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Cancel'));
  expect(screen.queryByTestId('add-objective-modal')).not.toBeInTheDocument();
});
