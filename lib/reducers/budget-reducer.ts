import { BudgetState, BudgetAction, Chip, DEFAULT_BUCKETS } from '../types';
import { handleDropChip } from '../handlers/drop-chip';
import { handleUpdateTransaction } from '../handlers/update-transaction';
import { handleDeleteTransaction } from '../handlers/delete-transaction';


/**
 * Central reducer and default state for the budget context.
 *
 * Splitting this into its own module keeps the context provider focused on
 * side-effects (persistence, API calls, sound) while the pure state logic lives
 * in a standalone file that is easy to test and maintain.
 */

export const initialState: BudgetState = {
  buckets: DEFAULT_BUCKETS,
  chips: [],
  transactions: [],
  exchangeRates: {
    rates: {
      USD: 1 // Only USD as default, API will populate others
    },
    lastUpdated: new Date(),
    status: 'loading'
  },
  soundEnabled: false
};

export function budgetReducer(state: BudgetState, action: BudgetAction): BudgetState {
  switch (action.type) {
    case 'MINT_CHIP': {
      const { amount, currency, isNegative, note } = action.payload;
      const usdRate = state.exchangeRates.rates[currency] || 1;

      const newChip: Chip = {
        id: `chip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        amount,
        currency,
        usdRate,
        createdAt: new Date(),
        isNegative: isNegative || false,
        note
      };

      return {
        ...state,
        chips: [...state.chips, newChip]
      };
    }

    case 'DROP_CHIP': {
      return handleDropChip(state, action.payload);
    }

    case 'REMOVE_CHIP': {
      const { chipId } = action.payload;
      return {
        ...state,
        chips: state.chips.filter(c => c.id !== chipId)
      };
    }

    case 'CLEAR_CHIPS': {
      return {
        ...state,
        chips: []
      };
    }

    case 'RESET_BUCKET': {
      const { bucketId } = action.payload;
      const defaultBucket = DEFAULT_BUCKETS.find(b => b.id === bucketId);

      if (!defaultBucket) return state;

      return {
        ...state,
        buckets: state.buckets.map(b =>
          b.id === bucketId ? { ...defaultBucket } : b
        ),
        // Remove transactions related to this bucket
        transactions: state.transactions.filter(t => t.bucketId !== bucketId)
      };
    }

    case 'DELETE_TRANSACTION': {
      return handleDeleteTransaction(state, action.payload);
    }

    case 'UPDATE_TRANSACTION': {
      return handleUpdateTransaction(state, action.payload);
    }

    case 'CONVERT_CHIP_POLARITY': {
      const { chipId, isNegative } = action.payload;
      
      return {
        ...state,
        chips: state.chips.map(chip => 
          chip.id === chipId 
            ? { ...chip, isNegative }
            : chip
        )
      };
    }

    case 'TOGGLE_SOUND': {
      return {
        ...state,
        soundEnabled: !state.soundEnabled
      };
    }

    case 'IMPORT_DATA': {
      return {
        ...action.payload
      };
    }

    case 'RESET_STATE': {
      return initialState;
    }

    case 'UPDATE_EXCHANGE_RATES': {
      return {
        ...state,
        exchangeRates: {
          rates: action.payload.rates,
          lastUpdated: action.payload.lastUpdated,
          status: 'success' as const
        }
      };
    }

    case 'UPDATE_EXCHANGE_RATES_CACHED': {
      return {
        ...state,
        exchangeRates: {
          rates: action.payload.rates,
          lastUpdated: action.payload.lastUpdated,
          status: 'cached' as const
        }
      };
    }

    case 'SET_EXCHANGE_RATES_LOADING': {
      return {
        ...state,
        exchangeRates: {
          ...state.exchangeRates,
          status: 'loading'
        }
      };
    }

    case 'SET_EXCHANGE_RATES_ERROR': {
      return {
        ...state,
        exchangeRates: {
          ...state.exchangeRates,
          status: 'error'
        }
      };
    }

    default:
      return state;
  }
} 