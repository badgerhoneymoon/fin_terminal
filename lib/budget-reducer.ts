import { BudgetState, BudgetAction, Bucket, Chip, Transaction, DEFAULT_BUCKETS } from './types';


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
      const { amount, currency, isNegative } = action.payload;
      const usdRate = state.exchangeRates.rates[currency] || 1;

      const newChip: Chip = {
        id: `chip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        amount,
        currency,
        usdRate,
        createdAt: new Date(),
        isNegative: isNegative || false
      };

      return {
        ...state,
        chips: [...state.chips, newChip]
      };
    }

    case 'DROP_CHIP': {
      const { chipId, bucketId } = action.payload;
      const chip = state.chips.find(c => c.id === chipId);
      const bucket = state.buckets.find(b => b.id === bucketId);

      if (!chip || !bucket) return state;

      // Convert chip amount to bucket currency
      const chipInUSD = chip.amount * chip.usdRate;
      const bucketRate = state.exchangeRates.rates[bucket.currency];
      const convertedAmount = chipInUSD / bucketRate;

      // Handle chip polarity and bucket type logic
      let actualAmount = convertedAmount;
      let remainderChip: Chip | null = null;
      let newCurrent: number;
      let transactionType: 'add' | 'subtract';

      if (bucket.type === 'debt') {
        if (chip.isNegative) {
          // Negative chip on debt = spending = INCREASES debt
          transactionType = 'add';
          newCurrent = bucket.current + actualAmount;
          
          // Check credit limit
          if (bucket.creditLimit && newCurrent > bucket.creditLimit) {
            actualAmount = bucket.creditLimit - bucket.current;
            newCurrent = bucket.creditLimit;
            
            // Create remainder chip for excess spending
            const remainderInUSD = (convertedAmount - actualAmount) * bucketRate;
            const remainderInOriginalCurrency = remainderInUSD / chip.usdRate;
            
            if (remainderInOriginalCurrency > 0) {
              remainderChip = {
                id: `chip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                amount: remainderInOriginalCurrency,
                currency: chip.currency,
                usdRate: chip.usdRate,
                createdAt: new Date(),
                isNegative: true
              };
            }
          }
        } else {
          // Positive chip on debt = payment = DECREASES debt
          transactionType = 'subtract';
          
          if (convertedAmount > bucket.current) {
            // Only use what's needed to pay off the debt
            actualAmount = bucket.current;
            newCurrent = 0;

            // Create remainder chip for overpayment
            const remainderInUSD = (convertedAmount - actualAmount) * bucketRate;
            const remainderInOriginalCurrency = remainderInUSD / chip.usdRate;

            remainderChip = {
              id: `chip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              amount: remainderInOriginalCurrency,
              currency: chip.currency,
              usdRate: chip.usdRate,
              createdAt: new Date(),
              isNegative: false
            };
          } else {
            newCurrent = bucket.current - actualAmount;
          }
        }
      } else {
        // Fund buckets - negative chips can't be dropped here (for now)
        if (chip.isNegative) return state;
        
        transactionType = 'add';
        
        if ((bucket.current + convertedAmount) > bucket.target) {
          // Only use what's needed to reach the target
          actualAmount = bucket.target - bucket.current;
          newCurrent = bucket.target;

          // Create remainder chip for excess
          const remainderInUSD = (convertedAmount - actualAmount) * bucketRate;
          const remainderInOriginalCurrency = remainderInUSD / chip.usdRate;

          remainderChip = {
            id: `chip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            amount: remainderInOriginalCurrency,
            currency: chip.currency,
            usdRate: chip.usdRate,
            createdAt: new Date(),
            isNegative: false
          };
        } else {
          newCurrent = bucket.current + actualAmount;
        }
      }

      const newTransaction: Transaction = {
        id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        chipId,
        bucketId,
        amount: actualAmount,
        timestamp: new Date(),
        type: transactionType,
        originalChipAmount: chip.amount,
        originalChipCurrency: chip.currency,
        usdRateAtTime: chip.usdRate
      };

      // Update holdings for fund buckets
      let newHoldings = bucket.holdings;
      if (bucket.type === 'fund' && !chip.isNegative) {
        newHoldings = bucket.holdings ? { ...bucket.holdings } : {};
        if (newHoldings[chip.currency]) {
          newHoldings[chip.currency] += chip.amount;
        } else {
          newHoldings[chip.currency] = chip.amount;
        }
      }

      const updatedBucket: Bucket = {
        ...bucket,
        current: newCurrent,
        holdings: newHoldings
      };

      // Check for milestone completion (for debt buckets)
      if (bucket.type === 'debt' && bucket.milestones && !chip.isNegative) {
        const newCompletedMilestones = bucket.milestones.filter(milestone =>
          bucket.current > milestone && updatedBucket.current <= milestone
        );
        if (newCompletedMilestones.length > 0) {
          updatedBucket.completedMilestones = [
            ...bucket.completedMilestones,
            ...newCompletedMilestones
          ];
        }
      }

      return {
        ...state,
        chips: [
          ...state.chips.filter(c => c.id !== chipId),
          ...(remainderChip ? [remainderChip] : [])
        ],
        buckets: state.buckets.map(b => b.id === bucketId ? updatedBucket : b),
        transactions: [...state.transactions, newTransaction]
      };
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

    case 'UNDO_TRANSACTION': {
      const { transactionId } = action.payload;
      const transaction = state.transactions.find(t => t.id === transactionId);

      if (!transaction) return state;

      const bucket = state.buckets.find(b => b.id === transaction.bucketId);
      if (!bucket) return state;

      // Create restored chip (simplified - would need more data in real app)
      const restoredChip: Chip = {
        id: `restored-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        amount: transaction.amount,
        currency: bucket.currency,
        usdRate: state.exchangeRates.rates[bucket.currency] || 1,
        createdAt: new Date()
      };

      // Reverse bucket changes
      const updatedBucket: Bucket = {
        ...bucket,
        current: transaction.type === 'add'
          ? bucket.current - transaction.amount
          : bucket.current + transaction.amount
      };

      return {
        ...state,
        chips: [...state.chips, restoredChip],
        buckets: state.buckets.map(b => b.id === bucket.id ? updatedBucket : b),
        transactions: state.transactions.filter(t => t.id !== transactionId)
      };
    }

    case 'DELETE_TRANSACTION': {
      const { transactionId } = action.payload;
      const transaction = state.transactions.find(t => t.id === transactionId);

      if (!transaction) return state;

      const bucket = state.buckets.find(b => b.id === transaction.bucketId);
      if (!bucket) return state;

      // Reverse bucket changes
      const updatedBucket: Bucket = {
        ...bucket,
        current: transaction.type === 'add'
          ? bucket.current - transaction.amount
          : bucket.current + transaction.amount
      };

      // Update holdings if bucket has them and this was a fund transaction
      if (bucket.holdings && bucket.type === 'fund' && transaction.originalChipCurrency && transaction.originalChipAmount) {
        const newHoldings = { ...bucket.holdings };
        
        // Reverse the holding amount for the original chip currency
        if (transaction.type === 'add') {
          // Transaction was adding to the fund, so subtract from holdings
          if (newHoldings[transaction.originalChipCurrency]) {
            newHoldings[transaction.originalChipCurrency] -= transaction.originalChipAmount;
            
            // If holding amount becomes 0 or negative, remove the currency
            if (newHoldings[transaction.originalChipCurrency] <= 0) {
              delete newHoldings[transaction.originalChipCurrency];
            }
          }
        } else {
          // Transaction was subtracting from the fund, so add back to holdings
          if (newHoldings[transaction.originalChipCurrency]) {
            newHoldings[transaction.originalChipCurrency] += transaction.originalChipAmount;
          } else {
            newHoldings[transaction.originalChipCurrency] = transaction.originalChipAmount;
          }
        }
        
        updatedBucket.holdings = newHoldings;
      }

      return {
        ...state,
        buckets: state.buckets.map(b => b.id === bucket.id ? updatedBucket : b),
        transactions: state.transactions.filter(t => t.id !== transactionId)
      };
    }

    case 'UPDATE_TRANSACTION': {
      const { transactionId, newAmount } = action.payload;
      const transaction = state.transactions.find(t => t.id === transactionId);

      if (!transaction) return state;

      const bucket = state.buckets.find(b => b.id === transaction.bucketId);
      if (!bucket) return state;

      // Calculate the difference between old and new amounts
      const amountDifference = newAmount - transaction.amount;

      // Update bucket current value based on transaction type
      const updatedBucket: Bucket = {
        ...bucket,
        current: transaction.type === 'add'
          ? bucket.current + amountDifference
          : bucket.current - amountDifference
      };

      // Update holdings if bucket has them and this was a fund transaction
      if (bucket.holdings && bucket.type === 'fund' && transaction.originalChipCurrency && transaction.originalChipAmount) {
        const newHoldings = { ...bucket.holdings };
        
        // Calculate the proportional change in holdings
        const holdingDifference = (transaction.originalChipAmount / transaction.amount) * amountDifference;
        
        if (transaction.type === 'add') {
          // Add the difference to holdings
          if (newHoldings[transaction.originalChipCurrency]) {
            newHoldings[transaction.originalChipCurrency] += holdingDifference;
          } else {
            newHoldings[transaction.originalChipCurrency] = holdingDifference;
          }
        } else {
          // Subtract the difference from holdings
          if (newHoldings[transaction.originalChipCurrency]) {
            newHoldings[transaction.originalChipCurrency] -= holdingDifference;
            
            // If holding amount becomes 0 or negative, remove the currency
            if (newHoldings[transaction.originalChipCurrency] <= 0) {
              delete newHoldings[transaction.originalChipCurrency];
            }
          }
        }
        
        updatedBucket.holdings = newHoldings;
      }

      // Update the transaction with the new amount
      const updatedTransaction: Transaction = {
        ...transaction,
        amount: newAmount,
        originalChipAmount: transaction.originalChipAmount 
          ? (transaction.originalChipAmount / transaction.amount) * newAmount
          : undefined
      };

      return {
        ...state,
        buckets: state.buckets.map(b => b.id === bucket.id ? updatedBucket : b),
        transactions: state.transactions.map(t => t.id === transactionId ? updatedTransaction : t)
      };
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