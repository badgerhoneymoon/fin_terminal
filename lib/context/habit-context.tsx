'use client';

import { createContext, useContext, useReducer, ReactNode, useEffect, useState } from 'react';
import { HabitState, HabitAction, Habit } from '../types';
import { habitReducer, initialHabitState } from '../reducers/habit-reducer';
import { habitStorage } from '../services/habit-storage';

interface HabitContextType {
  state: HabitState;
  dispatch: React.Dispatch<HabitAction>;
  createHabit: (name: string, description?: string, target?: number) => void;
  toggleCompletion: (habitId: string, dayIndex: number) => void;
  deleteHabit: (habitId: string) => void;
  setWeek: (weekStart: Date) => void;
  toggleSound: () => void;
  exportData: () => void;
  importData: (data: string) => void;
  resetState: () => void;
  getCurrentWeekHabits: () => Habit[];
  getWeekProgress: (habitId: string) => { completed: number; target: number; success: boolean };
}

const HabitContext = createContext<HabitContextType | undefined>(undefined);


// Helper function to format date for comparison
function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function HabitProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(habitReducer, initialHabitState);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedState = habitStorage.load();
    if (savedState) {
      dispatch({ type: 'IMPORT_DATA', payload: savedState });
    }
    setIsInitialized(true);
  }, []);

  // Auto-save to localStorage when state changes (but not on initial load)
  useEffect(() => {
    if (isInitialized) {
      habitStorage.save(state);
    }
  }, [state, isInitialized]);

  // Action functions
  const createHabit = (name: string, description?: string, target: number = 6) => {
    dispatch({ 
      type: 'CREATE_HABIT', 
      payload: { name, description, target } 
    });
  };

  const toggleCompletion = (habitId: string, dayIndex: number) => {
    dispatch({ 
      type: 'TOGGLE_COMPLETION', 
      payload: { habitId, dayIndex } 
    });
  };

  const deleteHabit = (habitId: string) => {
    dispatch({ 
      type: 'DELETE_HABIT', 
      payload: { habitId } 
    });
  };

  const setWeek = (weekStart: Date) => {
    dispatch({ 
      type: 'SET_WEEK', 
      payload: { weekStart } 
    });
  };

  const toggleSound = () => {
    dispatch({ type: 'TOGGLE_SOUND' });
  };

  const exportData = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `habit-terminal-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importData = (dataStr: string) => {
    try {
      const data = JSON.parse(dataStr);
      dispatch({ type: 'IMPORT_DATA', payload: data });
    } catch (error) {
      console.error('Failed to import habit data:', error);
      throw new Error('Invalid habit data format');
    }
  };

  const resetState = () => {
    dispatch({ type: 'RESET_STATE' });
  };

  const getCurrentWeekHabits = () => {
    const currentWeekKey = formatDateKey(state.currentWeekStart);
    return state.habits.filter(habit => 
      formatDateKey(habit.weekStart) === currentWeekKey
    );
  };

  const getWeekProgress = (habitId: string) => {
    const habit = state.habits.find(h => h.id === habitId);
    if (!habit) return { completed: 0, target: 6, success: false };
    
    const completed = habit.completions.filter(Boolean).length;
    return {
      completed,
      target: habit.target,
      success: completed >= habit.target
    };
  };

  const value: HabitContextType = {
    state,
    dispatch,
    createHabit,
    toggleCompletion,
    deleteHabit,
    setWeek,
    toggleSound,
    exportData,
    importData,
    resetState,
    getCurrentWeekHabits,
    getWeekProgress,
  };

  return (
    <HabitContext.Provider value={value}>
      {children}
    </HabitContext.Provider>
  );
}

export function useHabit() {
  const context = useContext(HabitContext);
  if (context === undefined) {
    throw new Error('useHabit must be used within a HabitProvider');
  }
  return context;
}