import { ExpenseState, DEFAULT_EXPENSE_CATEGORIES } from '../types';

const STORAGE_KEY = 'expensetracker.v1';

// Helper to get first day of current month
function getFirstOfMonth(date: Date = new Date()): Date {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  first.setHours(0, 0, 0, 0);
  return first;
}

// Helper function to migrate expense state
const migrateExpenseState = (state: ExpenseState): ExpenseState => {
  const migratedExpenses = state.expenses.map(expense => ({
    ...expense,
    date: new Date(expense.date),
    createdAt: new Date(expense.createdAt)
  }));

  return {
    categories: Array.isArray(state.categories) && state.categories.length > 0
      ? state.categories
      : DEFAULT_EXPENSE_CATEGORIES,
    expenses: migratedExpenses,
    totalBudget: typeof state.totalBudget === 'number' ? state.totalBudget : 2500,
    currentMonth: state.currentMonth
      ? new Date(state.currentMonth)
      : getFirstOfMonth()
  };
};

// Load expense state from localStorage
const loadFromStorage = (): ExpenseState | null => {
  if (typeof window === 'undefined') return null;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved);
    return migrateExpenseState(parsed);
  } catch (error) {
    console.error('Failed to load expense data from localStorage:', error);
    return null;
  }
};

// Save expense state to localStorage
const saveToStorage = (state: ExpenseState): void => {
  if (typeof window === 'undefined') return;

  try {
    const serializable = {
      ...state,
      expenses: state.expenses.map(expense => ({
        ...expense,
        date: expense.date.toISOString(),
        createdAt: expense.createdAt.toISOString()
      })),
      currentMonth: state.currentMonth.toISOString()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  } catch (error) {
    console.error('Failed to save expense data to localStorage:', error);
  }
};

export const expenseStorage = {
  load: loadFromStorage,
  save: saveToStorage,
  key: STORAGE_KEY
};
