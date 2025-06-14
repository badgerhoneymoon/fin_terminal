import { BudgetState, Bucket, Transaction } from '../types';
import { CURRENCY_THRESHOLDS } from '../constants';

export function handleUpdateTransaction(
  state: BudgetState,
  payload: { transactionId: string; newAmount: number }
): BudgetState {
  const { transactionId, newAmount } = payload;
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
        
        // If holding amount becomes very small (using currency-specific threshold), remove the currency
        const threshold = CURRENCY_THRESHOLDS[transaction.originalChipCurrency] || 0.01;
        if (Math.abs(newHoldings[transaction.originalChipCurrency]) <= threshold) {
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