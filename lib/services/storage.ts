import { BudgetState, DEFAULT_BUCKETS } from '../types';

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
    
    // Migrate UK GLOBAL VISA to VISA FEES with new target and currency
    if (bucket.id === 'uk-global-visa' && bucket.name === 'UK GLOBAL VISA') {
      return { 
        ...bucket, 
        name: 'VISA FEES',
        target: 7000,
        currency: 'USD',
        milestones: [3500, 5250]
      };
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

// Helper function to clear storage
const clearStorage = () => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('budgetdrop.hasUsed');
    console.log('LocalStorage cleared - state reset to defaults');
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }
};

export const StorageService = {
  loadFromStorage,
  saveToStorage,
  clearStorage
}; 