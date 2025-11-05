import { HabitState } from '../types';
import { getMondayOfWeek } from '../utils';

const STORAGE_KEY = 'habitterminal.v1';

// Helper function to migrate old habit state to new structure
const migrateHabitState = (state: HabitState): HabitState => {
  // Ensure all dates are properly formatted and habits have required fields
  const migratedHabits = state.habits.map(habit => ({
    ...habit,
    weekStart: new Date(habit.weekStart),
    createdAt: new Date(habit.createdAt),
    completions: Array.isArray(habit.completions) && habit.completions.length === 7 
      ? habit.completions 
      : new Array(7).fill(false),
    target: typeof habit.target === 'number' ? habit.target : 6
  }));

  return {
    habits: migratedHabits,
    currentWeekStart: state.currentWeekStart 
      ? new Date(state.currentWeekStart) 
      : getMondayOfWeek(),
    soundEnabled: Boolean(state.soundEnabled)
  };
};

// Helper function to load habit state from localStorage
const loadFromStorage = (): HabitState | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    
    const parsed = JSON.parse(saved);
    return migrateHabitState(parsed);
  } catch (error) {
    console.error('Failed to load habit data from localStorage:', error);
    return null;
  }
};

// Helper function to save habit state to localStorage
const saveToStorage = (state: HabitState): void => {
  if (typeof window === 'undefined') return;
  
  try {
    // Create a serializable version of the state
    const serializable = {
      ...state,
      habits: state.habits.map(habit => ({
        ...habit,
        weekStart: habit.weekStart.toISOString(),
        createdAt: habit.createdAt.toISOString()
      })),
      currentWeekStart: state.currentWeekStart.toISOString()
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  } catch (error) {
    console.error('Failed to save habit data to localStorage:', error);
  }
};

// Storage service interface
export const habitStorage = {
  load: loadFromStorage,
  save: saveToStorage,
  key: STORAGE_KEY
};