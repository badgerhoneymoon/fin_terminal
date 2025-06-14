import { BudgetState, Bucket } from '../types';
import { CURRENCY_THRESHOLDS } from '../constants';

export function handleDeleteTransaction(
  state: BudgetState,
  payload: { transactionId: string }
): BudgetState {
  const { transactionId } = payload;
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
        
        // If holding amount becomes very small (using currency-specific threshold), remove the currency
        const threshold = CURRENCY_THRESHOLDS[transaction.originalChipCurrency] || 0.01;
        if (Math.abs(newHoldings[transaction.originalChipCurrency]) <= threshold) {
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