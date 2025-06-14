'use client';

import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { BudgetState, BudgetAction } from '../types';
import { budgetReducer, initialState } from '../reducers/budget-reducer';
import { soundManager } from '../sound/sounds';
import { useExchangeRates } from '@/hooks/budget/use-exchange-rates';
import { useBudgetActions } from '@/hooks/budget/use-budget-actions';
import { useStateHydration } from '@/hooks/budget/use-state-hydration';

interface BudgetContextType {
  state: BudgetState;
  dispatch: React.Dispatch<BudgetAction>;
  mintChip: (amount: number, currency: string, isNegative?: boolean) => void;
  dropChip: (chipId: string, bucketId: string) => void;
  removeChip: (chipId: string) => void;
  clearChips: () => void;
  resetBucket: (bucketId: string) => void;
  deleteTransaction: (transactionId: string) => void;
  updateTransaction: (transactionId: string, newAmount: number) => void;
  convertChipPolarity: (chipId: string, isNegative: boolean) => void;
  toggleSound: () => void;
  exportData: () => void;
  importData: (data: string) => void;
  resetState: () => void;
  refreshExchangeRates: () => Promise<boolean>;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export function BudgetProvider({ children }: { children: ReactNode }) {
  // Always start with the baked-in initial state for both server and first client render
  const [state, dispatch] = useReducer(budgetReducer, initialState);

  // Handle state hydration and auto-saving
  useStateHydration({ state, dispatch });

  // Initialize sound manager with current state
  useEffect(() => {
    soundManager.setEnabled(state.soundEnabled);
  }, [state.soundEnabled]);

  // Use exchange rates hook
  const { refreshExchangeRates } = useExchangeRates({ dispatch });

  // Use budget actions hook
  const {
    mintChip,
    dropChip,
    removeChip,
    clearChips,
    resetBucket,
    deleteTransaction,
    updateTransaction,
    convertChipPolarity,
    toggleSound,
    exportData,
    importData,
    resetState
  } = useBudgetActions({ state, dispatch });

  const contextValue: BudgetContextType = {
    state,
    dispatch,
    mintChip,
    dropChip,
    removeChip,
    clearChips,
    resetBucket,
    deleteTransaction,
    updateTransaction,
    convertChipPolarity,
    toggleSound,
    exportData,
    importData,
    resetState,
    refreshExchangeRates
  };

  return (
    <BudgetContext.Provider value={contextValue}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const context = useContext(BudgetContext);
  if (context === undefined) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
} 