import { BudgetState, Bucket, Chip, Transaction } from './types';

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