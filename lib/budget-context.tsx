'use client';

import { createContext, useContext, useReducer, ReactNode, useEffect, useRef } from 'react';
import { BudgetState, BudgetAction, Currency, DEFAULT_BUCKETS } from './types';
import { budgetReducer, initialState } from './budget-reducer';
import { soundManager } from './sounds';
import { CurrencyService } from './services/currency-service';

const STORAGE_KEY = 'budgetdrop.v1';

// Helper function to migrate old state to new structure
const migrateState = (state: BudgetState): BudgetState => {
  const migratedBuckets = state.buckets.map(bucket => {
    // Add credit limits to existing debt buckets if they don't have them
    if (bucket.type === 'debt' && !bucket.creditLimit) {
      const defaultBucket = DEFAULT_BUCKETS.find((db: typeof DEFAULT_BUCKETS[0]) => db.id === bucket.id);
      if (defaultBucket?.creditLimit) {
        return { ...bucket, creditLimit: defaultBucket.creditLimit };
      }
    }
    return bucket;
  });

  return { ...state, buckets: migratedBuckets };
};

// Helper function to load state from localStorage
const loadFromStorage = (): BudgetState | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved);
    
    // Revive Date objects
    if (parsed.chips) {
      parsed.chips = parsed.chips.map((chip: { createdAt: string; [key: string]: unknown }) => ({
        ...chip,
        createdAt: new Date(chip.createdAt),
      }));
    }
    
    if (parsed.transactions) {
      parsed.transactions = parsed.transactions.map((txn: { timestamp: string; [key: string]: unknown }) => ({
        ...txn,
        timestamp: new Date(txn.timestamp),
      }));
    }
    
    if (parsed.exchangeRates?.lastUpdated) {
      parsed.exchangeRates.lastUpdated = new Date(parsed.exchangeRates.lastUpdated);
    }

    // Migrate old state to new structure
    return migrateState(parsed);
  } catch (error) {
    console.error('Failed to load saved budget data:', error);
    return null;
  }
};

// Helper function to save state to localStorage
const saveToStorage = (state: BudgetState) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    console.log('Saved to localStorage:', {
      buckets: state.buckets.length,
      chips: state.chips.length,
      transactions: state.transactions.length,
      soundEnabled: state.soundEnabled,
      exchangeRatesStatus: state.exchangeRates.status
    });
  } catch (error) {
    console.error('Failed to save budget data:', error);
  }
};

interface BudgetContextType {
  state: BudgetState;
  dispatch: React.Dispatch<BudgetAction>;
  mintChip: (amount: number, currency: string, isNegative?: boolean) => void;
  dropChip: (chipId: string, bucketId: string) => void;
  removeChip: (chipId: string) => void;
  clearChips: () => void;
  resetBucket: (bucketId: string) => void;
  undoTransaction: (transactionId: string) => void;
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

  /*
   * After the component mounts on the client we can safely hydrate the state
   * from localStorage. Doing it here – instead of in the lazy initialiser –
   * guarantees that the very first client render matches the HTML already
   * in the DOM, so React has nothing to complain about.
   */
  useEffect(() => {
    const loadedState = loadFromStorage();
    if (loadedState) {
      console.log('Loading saved data from localStorage:', {
        buckets: loadedState.buckets.length,
        chips: loadedState.chips.length,
        transactions: loadedState.transactions.length,
        soundEnabled: loadedState.soundEnabled
      });
      dispatch({ type: 'IMPORT_DATA', payload: loadedState });
    } else {
      console.log('No saved data found in localStorage, using defaults');
    }
    // We want this effect to run only once after mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ref to skip first save (avoids clobbering existing storage before hydration)
  const isFirstRender = useRef(true);

  // Save to localStorage on state changes (but skip the very first render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    saveToStorage(state);
  }, [state]);

  // Initialize sound manager with current state
  useEffect(() => {
    soundManager.setEnabled(state.soundEnabled);
  }, [state.soundEnabled]);

  // Fetch exchange rates on mount and periodically
  useEffect(() => {
    const fetchRates = async () => {
      dispatch({ type: 'SET_EXCHANGE_RATES_LOADING' });
      try {
        console.log('Fetching exchange rates from API...');
        const currencyData = await CurrencyService.fetchExchangeRates();
        
        if (currencyData.fromCache) {
          dispatch({ 
            type: 'UPDATE_EXCHANGE_RATES_CACHED', 
            payload: {
              rates: currencyData.rates,
              lastUpdated: currencyData.lastUpdated
            }
          });
          console.log('Exchange rates loaded from cache:', currencyData.rates);
        } else {
          dispatch({ 
            type: 'UPDATE_EXCHANGE_RATES', 
            payload: {
              rates: currencyData.rates,
              lastUpdated: currencyData.lastUpdated
            }
          });
          console.log('Exchange rates updated from API:', currencyData.rates);
        }
      } catch (error) {
        console.error('Failed to fetch exchange rates:', error);
        dispatch({ type: 'SET_EXCHANGE_RATES_ERROR' });
      }
    };

    // Small delay to let localStorage data load first
    const timer = setTimeout(fetchRates, 100);

    // Fetch every hour
    const interval = setInterval(fetchRates, 60 * 60 * 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const mintChip = (amount: number, currency: string, isNegative?: boolean) => {
    dispatch({ type: 'MINT_CHIP', payload: { amount, currency: currency as Currency, isNegative } });
    if (state.soundEnabled) {
      soundManager.playMint();
    }
  };

  const dropChip = (chipId: string, bucketId: string) => {
    const chip = state.chips.find(c => c.id === chipId);
    const bucket = state.buckets.find(b => b.id === bucketId);
    
    // Check if this will complete milestones before dispatching
    let willCompleteMilestones = false;
    if (chip && bucket && bucket.type === 'debt' && bucket.milestones) {
      const chipInUSD = chip.currency === 'USD' ? chip.amount : chip.amount / chip.usdRate;
      const bucketRate = bucket.currency === 'USD' ? 1 : state.exchangeRates.rates[bucket.currency];
      const convertedAmount = bucket.currency === 'USD' ? chipInUSD : chipInUSD * bucketRate;
      const newCurrent = Math.max(0, bucket.current - convertedAmount);
      
      willCompleteMilestones = bucket.milestones.some(milestone => 
        bucket.current > milestone && newCurrent <= milestone
      );
    }
    
    dispatch({ type: 'DROP_CHIP', payload: { chipId, bucketId } });
    
    if (state.soundEnabled) {
      if (willCompleteMilestones) {
        setTimeout(() => soundManager.playMilestone(), 100);
      } else {
        soundManager.playDrop();
      }
    }
  };

  const removeChip = (chipId: string) => {
    dispatch({ type: 'REMOVE_CHIP', payload: { chipId } });
  };

  const clearChips = () => {
    dispatch({ type: 'CLEAR_CHIPS' });
  };

  const resetBucket = (bucketId: string) => {
    dispatch({ type: 'RESET_BUCKET', payload: { bucketId } });
  };

  const undoTransaction = (transactionId: string) => {
    dispatch({ type: 'UNDO_TRANSACTION', payload: { transactionId } });
  };

  const deleteTransaction = (transactionId: string) => {
    dispatch({ type: 'DELETE_TRANSACTION', payload: { transactionId } });
  };

  const updateTransaction = (transactionId: string, newAmount: number) => {
    dispatch({ type: 'UPDATE_TRANSACTION', payload: { transactionId, newAmount } });
  };

  const convertChipPolarity = (chipId: string, isNegative: boolean) => {
    dispatch({ type: 'CONVERT_CHIP_POLARITY', payload: { chipId, isNegative } });
  };

  const toggleSound = () => {
    const newSoundEnabled = !state.soundEnabled;
    dispatch({ type: 'TOGGLE_SOUND' });
    soundManager.setEnabled(newSoundEnabled);
  };

  const exportData = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `budget-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importData = (data: string) => {
    try {
      const parsed = JSON.parse(data);
      // For manual imports, keep current exchange rates from API
      // But preserve the original rates structure if it exists
      if (parsed.exchangeRates && state.exchangeRates.status === 'success') {
        parsed.exchangeRates = {
          ...parsed.exchangeRates,
          rates: state.exchangeRates.rates,
          lastUpdated: state.exchangeRates.lastUpdated,
          status: state.exchangeRates.status
        };
      } else if (!parsed.exchangeRates) {
        parsed.exchangeRates = state.exchangeRates;
      }
      dispatch({ type: 'IMPORT_DATA', payload: parsed });
    } catch (error) {
      console.error('Failed to import data:', error);
      throw new Error('Invalid JSON data');
    }
  };

  const resetState = () => {
    dispatch({ type: 'RESET_STATE' });
    // Also clear localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem('budgetdrop.hasUsed');
        console.log('LocalStorage cleared - state reset to defaults');
      } catch (error) {
        console.error('Failed to clear localStorage:', error);
      }
    }
  };

  const refreshExchangeRates = async () => {
    try {
      console.log('Manually refreshing exchange rates...');
      const currencyData = await CurrencyService.fetchExchangeRates();
      
      if (currencyData.fromCache) {
        dispatch({ 
          type: 'UPDATE_EXCHANGE_RATES_CACHED', 
          payload: {
            rates: currencyData.rates,
            lastUpdated: currencyData.lastUpdated
          }
        });
        console.log('Exchange rates refreshed from cache:', currencyData.rates);
      } else {
        dispatch({ 
          type: 'UPDATE_EXCHANGE_RATES', 
          payload: {
            rates: currencyData.rates,
            lastUpdated: currencyData.lastUpdated
          }
        });
        console.log('Exchange rates refreshed from API:', currencyData.rates);
      }
      return true;
    } catch (error) {
      console.error('Failed to refresh exchange rates:', error);
      throw error;
    }
  };

  const contextValue: BudgetContextType = {
    state,
    dispatch,
    mintChip,
    dropChip,
    removeChip,
    clearChips,
    resetBucket,
    undoTransaction,
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