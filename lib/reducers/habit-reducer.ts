import { HabitState, HabitAction, Habit } from '../types';

// Helper function to get Monday of current week
function getMondayOfWeek(date: Date = new Date()): Date {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export const initialHabitState: HabitState = {
  habits: [],
  currentWeekStart: getMondayOfWeek(),
  soundEnabled: false
};

export function habitReducer(state: HabitState, action: HabitAction): HabitState {
  switch (action.type) {
    case 'CREATE_HABIT': {
      const { name, description, target = 6 } = action.payload;
      
      const newHabit: Habit = {
        id: `habit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name,
        description,
        weekStart: state.currentWeekStart,
        completions: new Array(7).fill(false), // Initialize 7 days as false
        target,
        createdAt: new Date()
      };

      return {
        ...state,
        habits: [...state.habits, newHabit]
      };
    }

    case 'TOGGLE_COMPLETION': {
      const { habitId, dayIndex } = action.payload;
      
      if (dayIndex < 0 || dayIndex > 6) {
        return state; // Invalid day index
      }

      return {
        ...state,
        habits: state.habits.map(habit => {
          if (habit.id === habitId) {
            const newCompletions = [...habit.completions];
            newCompletions[dayIndex] = !newCompletions[dayIndex];
            return {
              ...habit,
              completions: newCompletions
            };
          }
          return habit;
        })
      };
    }

    case 'DELETE_HABIT': {
      const { habitId } = action.payload;
      
      return {
        ...state,
        habits: state.habits.filter(habit => habit.id !== habitId)
      };
    }

    case 'SET_WEEK': {
      const { weekStart } = action.payload;
      
      return {
        ...state,
        currentWeekStart: weekStart
      };
    }

    case 'TOGGLE_SOUND': {
      return {
        ...state,
        soundEnabled: !state.soundEnabled
      };
    }

    case 'IMPORT_DATA': {
      const importedState = action.payload;
      
      // Validate and sanitize imported data
      return {
        habits: Array.isArray(importedState.habits) ? importedState.habits.map(habit => ({
          ...habit,
          weekStart: new Date(habit.weekStart),
          createdAt: new Date(habit.createdAt),
          completions: Array.isArray(habit.completions) && habit.completions.length === 7 
            ? habit.completions 
            : new Array(7).fill(false)
        })) : [],
        currentWeekStart: importedState.currentWeekStart 
          ? new Date(importedState.currentWeekStart) 
          : getMondayOfWeek(),
        soundEnabled: Boolean(importedState.soundEnabled)
      };
    }

    case 'RESET_STATE': {
      return initialHabitState;
    }

    default:
      return state;
  }
}