import { ExpenseState, ExpenseAction, Expense, DEFAULT_EXPENSE_CATEGORIES } from '../types';
import { generateId } from '../utils';

// Helper to get first day of current month
function getFirstOfMonth(date: Date = new Date()): Date {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  first.setHours(0, 0, 0, 0);
  return first;
}

export const initialExpenseState: ExpenseState = {
  categories: DEFAULT_EXPENSE_CATEGORIES,
  expenses: [],
  totalBudget: 2500,
  currentMonth: getFirstOfMonth()
};

export function expenseReducer(state: ExpenseState, action: ExpenseAction): ExpenseState {
  switch (action.type) {
    case 'ADD_EXPENSE': {
      const { categoryId, amount, currency, usdRate, description, date } = action.payload;

      const newExpense: Expense = {
        id: generateId('expense'),
        categoryId,
        amount,
        currency,
        usdRate,
        description,
        date: date ? new Date(date) : new Date(),
        createdAt: new Date()
      };

      return {
        ...state,
        expenses: [...state.expenses, newExpense]
      };
    }

    case 'DELETE_EXPENSE': {
      const { expenseId } = action.payload;

      return {
        ...state,
        expenses: state.expenses.filter(expense => expense.id !== expenseId)
      };
    }

    case 'SET_MONTH': {
      const { month } = action.payload;

      return {
        ...state,
        currentMonth: getFirstOfMonth(new Date(month))
      };
    }

    case 'IMPORT_DATA': {
      const importedState = action.payload;

      return {
        categories: Array.isArray(importedState.categories)
          ? importedState.categories
          : DEFAULT_EXPENSE_CATEGORIES,
        expenses: Array.isArray(importedState.expenses)
          ? importedState.expenses.map(expense => ({
              ...expense,
              date: new Date(expense.date),
              createdAt: new Date(expense.createdAt)
            }))
          : [],
        totalBudget: typeof importedState.totalBudget === 'number'
          ? importedState.totalBudget
          : 2500,
        currentMonth: importedState.currentMonth
          ? getFirstOfMonth(new Date(importedState.currentMonth))
          : getFirstOfMonth()
      };
    }

    case 'RESET_STATE': {
      return {
        ...initialExpenseState,
        currentMonth: getFirstOfMonth()
      };
    }

    default:
      return state;
  }
}

// Helper functions for expense calculations
export function getExpensesForMonth(expenses: Expense[], month: Date): Expense[] {
  const monthStart = getFirstOfMonth(month);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59, 999);

  return expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate >= monthStart && expenseDate <= monthEnd;
  });
}

export function getCategoryTotal(expenses: Expense[], categoryId: string): number {
  return expenses
    .filter(expense => expense.categoryId === categoryId)
    .reduce((total, expense) => total + (expense.amount * expense.usdRate), 0);
}

export function getTotalSpent(expenses: Expense[]): number {
  return expenses.reduce((total, expense) => total + (expense.amount * expense.usdRate), 0);
}

export function getDailyExtrapolation(expenses: Expense[], categoryId: string, currentMonth: Date): number {
  const monthExpenses = getExpensesForMonth(expenses, currentMonth);
  const categoryExpenses = monthExpenses.filter(e => e.categoryId === categoryId);
  const spent = categoryExpenses.reduce((total, e) => total + (e.amount * e.usdRate), 0);

  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  if (dayOfMonth === 0) return 0;

  return (spent / dayOfMonth) * daysInMonth;
}
