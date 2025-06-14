'use client';

import { Transaction, Bucket, CURRENCIES } from '@/lib/types';
import { formatSmartAmount } from '@/lib/utils';

interface TransactionSummaryProps {
  transactions: Transaction[];
  bucket: Bucket;
}

export function TransactionSummary({ 
  transactions, 
  bucket 
}: TransactionSummaryProps) {
  const currency = CURRENCIES[bucket.currency];
  const calculatePercentageChange = () => {
    if (transactions.length < 2) return null;
    
    const latest = transactions[0];
    const previous = transactions[1];
    
    // Only show percentage when comparing the same transaction types
    // Comparing spending vs payment doesn't make sense
    if (latest.type !== previous.type) {
      return null; // Don't show percentage for different transaction types
    }
    
    // Calculate raw percentage change
    const rawChange = ((latest.amount - previous.amount) / previous.amount) * 100;
    
    // For credit cards (debt), both transactions are now the same type
    if (bucket.type === 'debt') {
      if (latest.type === 'add') {
        // Both are spending transactions - higher amount = worse
        return rawChange;
      } else {
        // Both are payment transactions - higher amount = better
        return -rawChange; // Invert for payments (higher payment = better)
      }
    }
    
    // For fund buckets, higher is always better
    return rawChange;
  };

  const percentChange = calculatePercentageChange();

  return (
    <div className="flex items-center gap-6 p-4 bg-black/40 border border-[var(--text-primary)] border-opacity-30">
      <div>
        <div className="text-xs text-[var(--text-primary)] opacity-70 uppercase">Total Transactions</div>
        <div className="text-lg font-bold text-white">{transactions.length}</div>
      </div>
      {transactions.length > 0 && (
        <div>
          <div className="text-xs text-[var(--text-primary)] opacity-70 uppercase">Most Recent</div>
          <div className="text-lg font-bold text-white">
            {currency.symbol}{formatSmartAmount(transactions[0].amount, bucket.currency)}
            {percentChange && (
              <span className={`ml-2 text-sm ${
                bucket.type === 'debt' 
                  ? (percentChange > 0 ? 'text-red-400' : 'text-green-400')
                  : (percentChange > 0 ? 'text-green-400' : 'text-red-400')
              }`}>
                {percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}%
                {bucket.type === 'debt' && (
                  <span className="ml-1 text-xs opacity-70">
                    {percentChange > 0 ? '↗' : '↘'}
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 