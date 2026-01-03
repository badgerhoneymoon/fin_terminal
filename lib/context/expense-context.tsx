'use client';

import { createContext, useContext, useReducer, ReactNode, useEffect, useState } from 'react';
import { ExpenseState, ExpenseAction, Expense, Currency } from '../types';
import { expenseReducer, initialExpenseState, getExpensesForMonth, getCategoryTotal, getTotalSpent, getDailyExtrapolation } from '../reducers/expense-reducer';
import { expenseStorage } from '../services/expense-storage';
import { CurrencyService } from '../services/currency';
import { getAllExpensesAction, createExpenseAction, deleteExpenseAction } from '@/actions/expense-actions';

interface ExpenseContextType {
  state: ExpenseState;
  dispatch: React.Dispatch<ExpenseAction>;
  exchangeRates: { [key: string]: number };
  ratesLoading: boolean;
  addExpense: (categoryId: string, amount: number, currency: Currency, description?: string, date?: Date) => void;
  deleteExpense: (expenseId: string) => void;
  setMonth: (month: Date) => void;
  exportData: () => void;
  importData: (data: string) => void;
  resetState: () => void;
  // Computed helpers
  getCurrentMonthExpenses: () => Expense[];
  getCategorySpent: (categoryId: string) => number;
  getTotalMonthSpent: () => number;
  getCategoryExtrapolation: (categoryId: string) => number;
  getProgressColor: (spent: number, limit: number) => 'green' | 'yellow' | 'red';
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(expenseReducer, initialExpenseState);
  const [isInitialized, setIsInitialized] = useState(false);
  const [exchangeRates, setExchangeRates] = useState<{ [key: string]: number }>({ USD: 1 });
  const [ratesLoading, setRatesLoading] = useState(true);

  // Load from Supabase on mount, fallback to localStorage
  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await getAllExpensesAction();
        if (result.isSuccess && result.data && result.data.length > 0) {
          // Convert DB format to app format
          const expenses: Expense[] = result.data.map(e => ({
            id: e.id,
            categoryId: e.categoryId,
            amount: e.amount,
            currency: e.currency as Currency,
            usdRate: e.usdRate,
            description: e.description || undefined,
            date: new Date(e.date),
            createdAt: new Date(e.createdAt)
          }));
          dispatch({ type: 'IMPORT_DATA', payload: { ...initialExpenseState, expenses } });
        } else {
          // Fallback to localStorage
          const savedState = expenseStorage.load();
          if (savedState) {
            dispatch({ type: 'IMPORT_DATA', payload: savedState });
          }
        }
      } catch (error) {
        console.error('Failed to load from Supabase, using localStorage:', error);
        const savedState = expenseStorage.load();
        if (savedState) {
          dispatch({ type: 'IMPORT_DATA', payload: savedState });
        }
      }
      setIsInitialized(true);
    };
    loadData();
  }, []);

  // Fetch exchange rates on mount
  useEffect(() => {
    const fetchRates = async () => {
      try {
        setRatesLoading(true);
        const response = await CurrencyService.fetchExchangeRates();
        setExchangeRates(response.rates);
      } catch (error) {
        console.error('Failed to fetch exchange rates:', error);
        // Fallback rates
        setExchangeRates({
          USD: 1,
          VND: 0.00004,
          RUB: 0.011
        });
      } finally {
        setRatesLoading(false);
      }
    };

    fetchRates();
  }, []);

  // Auto-save to localStorage when state changes
  useEffect(() => {
    if (isInitialized) {
      expenseStorage.save(state);
    }
  }, [state, isInitialized]);

  // Action functions
  const addExpense = async (categoryId: string, amount: number, currency: Currency, description?: string, date?: Date) => {
    const usdRate = exchangeRates[currency] || 1;
    const expenseDate = date || new Date();

    // Add to local state first for instant feedback
    dispatch({
      type: 'ADD_EXPENSE',
      payload: { categoryId, amount, currency, usdRate, description, date }
    });

    // Sync to Supabase
    try {
      await createExpenseAction({
        categoryId,
        amount,
        currency,
        usdRate,
        description: description || null,
        date: expenseDate
      });
    } catch (error) {
      console.error('Failed to sync expense to Supabase:', error);
    }
  };

  const deleteExpense = async (expenseId: string) => {
    dispatch({ type: 'DELETE_EXPENSE', payload: { expenseId } });

    // Sync to Supabase
    try {
      await deleteExpenseAction(expenseId);
    } catch (error) {
      console.error('Failed to delete expense from Supabase:', error);
    }
  };

  const setMonth = (month: Date) => {
    dispatch({ type: 'SET_MONTH', payload: { month } });
  };

  const exportData = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expense-tracker-${new Date().toISOString().split('T')[0]}.json`;
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
      console.error('Failed to import expense data:', error);
      throw new Error('Invalid expense data format');
    }
  };

  const resetState = () => {
    dispatch({ type: 'RESET_STATE' });
  };

  // Computed helpers
  const getCurrentMonthExpenses = () => {
    return getExpensesForMonth(state.expenses, state.currentMonth);
  };

  const getCategorySpent = (categoryId: string) => {
    const monthExpenses = getCurrentMonthExpenses();
    return getCategoryTotal(monthExpenses, categoryId);
  };

  const getTotalMonthSpent = () => {
    const monthExpenses = getCurrentMonthExpenses();
    return getTotalSpent(monthExpenses);
  };

  const getCategoryExtrapolation = (categoryId: string) => {
    return getDailyExtrapolation(state.expenses, categoryId, state.currentMonth);
  };

  const getProgressColor = (spent: number, limit: number): 'green' | 'yellow' | 'red' => {
    if (limit === 0) return 'green';
    const percentage = (spent / limit) * 100;
    if (percentage >= 90) return 'red';
    if (percentage >= 70) return 'yellow';
    return 'green';
  };

  const value: ExpenseContextType = {
    state,
    dispatch,
    exchangeRates,
    ratesLoading,
    addExpense,
    deleteExpense,
    setMonth,
    exportData,
    importData,
    resetState,
    getCurrentMonthExpenses,
    getCategorySpent,
    getTotalMonthSpent,
    getCategoryExtrapolation,
    getProgressColor,
  };

  return (
    <ExpenseContext.Provider value={value}>
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpense() {
  const context = useContext(ExpenseContext);
  if (context === undefined) {
    throw new Error('useExpense must be used within an ExpenseProvider');
  }
  return context;
}
