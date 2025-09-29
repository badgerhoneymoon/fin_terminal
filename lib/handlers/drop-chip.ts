import { BudgetState, Bucket, Chip, Transaction } from '../types';

export function handleDropChip(
  state: BudgetState,
  payload: { chipId: string; bucketId: string }
): BudgetState {
  const { chipId, bucketId } = payload;
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
            isNegative: true,
            note: chip.note
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
          isNegative: false,
          note: chip.note
        };
      } else {
        newCurrent = bucket.current - actualAmount;
      }
    }
  } else {
    // Fund buckets - handle both positive (deposits) and negative (withdrawals) chips
    if (chip.isNegative) {
      // Negative chip on fund = withdrawal = DECREASES fund
      transactionType = 'subtract';

      if (convertedAmount > bucket.current) {
        // Can only withdraw what's available
        actualAmount = bucket.current;
        newCurrent = 0;

        // Create remainder chip for the amount that couldn't be withdrawn
        const remainderInUSD = (convertedAmount - actualAmount) * bucketRate;
        const remainderInOriginalCurrency = remainderInUSD / chip.usdRate;

        if (remainderInOriginalCurrency > 0) {
          remainderChip = {
            id: `chip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            amount: remainderInOriginalCurrency,
            currency: chip.currency,
            usdRate: chip.usdRate,
            createdAt: new Date(),
            isNegative: true,
            note: chip.note
          };
        }
      } else {
        newCurrent = bucket.current - actualAmount;
      }
    } else {
      // Positive chip on fund = deposit = INCREASES fund
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
          isNegative: false,
          note: chip.note
        };
      } else {
        newCurrent = bucket.current + actualAmount;
      }
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
    usdRateAtTime: chip.usdRate,
    note: chip.note
  };

  // Update holdings for fund buckets
  let newHoldings = bucket.holdings;
  if (bucket.type === 'fund') {
    newHoldings = bucket.holdings ? { ...bucket.holdings } : {};

    if (chip.isNegative) {
      // For withdrawals, subtract from holdings proportionally
      // We need to figure out which currency to withdraw from
      if (newHoldings[chip.currency] && newHoldings[chip.currency] > 0) {
        // First try to withdraw from the same currency
        const withdrawAmount = Math.min(newHoldings[chip.currency], chip.amount);
        newHoldings[chip.currency] -= withdrawAmount;

        // Clean up holdings with zero or negative amounts
        if (newHoldings[chip.currency] <= 0) {
          delete newHoldings[chip.currency];
        }
      } else {
        // If the original currency is not available, we need to withdraw proportionally
        // from all holdings based on the converted amount
        const totalInBucketCurrency = bucket.current;
        if (totalInBucketCurrency > 0 && actualAmount > 0) {
          const withdrawalRatio = Math.min(actualAmount / totalInBucketCurrency, 1);

          // Reduce all holdings proportionally
          for (const currency in newHoldings) {
            newHoldings[currency] *= (1 - withdrawalRatio);
            if (newHoldings[currency] <= 0.01) {
              delete newHoldings[currency];
            }
          }
        }
      }
    } else {
      // For deposits, add to holdings
      if (newHoldings[chip.currency]) {
        newHoldings[chip.currency] += chip.amount;
      } else {
        newHoldings[chip.currency] = chip.amount;
      }
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