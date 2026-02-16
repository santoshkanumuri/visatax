import { STORAGE_KEYS } from '../constants';
import { SavedScenario } from '../types';

const MAX_SCENARIOS = 8;

export const loadScenarios = (): SavedScenario[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SCENARIOS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item.id === 'string' && typeof item.name === 'string' && item.input)
      .slice(0, MAX_SCENARIOS) as SavedScenario[];
  } catch (error) {
    console.error('Could not load saved scenarios.', error);
    return [];
  }
};

export const persistScenarios = (scenarios: SavedScenario[]): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEYS.SCENARIOS, JSON.stringify(scenarios.slice(0, MAX_SCENARIOS)));
  } catch (error) {
    console.error('Could not persist scenarios.', error);
  }
};

export const createScenario = (name: string, input: SavedScenario['input']): SavedScenario => {
  return {
    id: `${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    name: name.trim() || 'Untitled Scenario',
    createdAt: new Date().toISOString(),
    input,
  };
};
