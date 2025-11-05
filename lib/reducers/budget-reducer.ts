import { BudgetState, BudgetAction, Chip, DEFAULT_BUCKETS } from '../types';
import { handleDropChip } from '../handlers/drop-chip';
import { handleUpdateTransaction } from '../handlers/update-transaction';
import { handleDeleteTransaction } from '../handlers/delete-transaction';
import { generateId } from '../utils';


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
        id: generateId('chip'),
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

      return {
        ...state,
        buckets: state.buckets.map(b =>
          b.id === bucketId
            ? {
                ...b,
                current: 0,
                completedMilestones: [],
                holdings: b.type === 'fund' ? {} : undefined
              }
            : b
        ),
        // Remove transactions related to this bucket
        transactions: state.transactions.filter(t => t.bucketId !== bucketId)
      };
    }

    case 'ADD_BUCKET': {
      const { name, type, target, currency, creditLimit, milestones } = action.payload;

      const newBucket = {
        id: `bucket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name,
        type,
        current: 0,
        target,
        currency,
        creditLimit,
        milestones: milestones || [],
        completedMilestones: [],
        holdings: type === 'fund' ? {} : undefined
      };

      return {
        ...state,
        buckets: [...state.buckets, newBucket]
      };
    }

    case 'DELETE_BUCKET': {
      const { bucketId } = action.payload;

      return {
        ...state,
        buckets: state.buckets.filter(b => b.id !== bucketId),
        transactions: state.transactions.filter(t => t.bucketId !== bucketId)
      };
    }

    case 'RENAME_BUCKET': {
      const { bucketId, name } = action.payload;

      return {
        ...state,
        buckets: state.buckets.map(bucket =>
          bucket.id === bucketId
            ? { ...bucket, name }
            : bucket
        )
      };
    }

    case 'UPDATE_BUCKET_TARGET': {
      const { bucketId, target, creditLimit } = action.payload;

      return {
        ...state,
        buckets: state.buckets.map(bucket =>
          bucket.id === bucketId
            ? {
                ...bucket,
                target,
                ...(bucket.type === 'debt' && creditLimit !== undefined && { creditLimit })
              }
            : bucket
        )
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