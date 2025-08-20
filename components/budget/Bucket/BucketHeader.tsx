'use client';

import { Bucket as BucketType, CURRENCIES } from '@/lib/types';
import { formatSmartAmount, calculateCurrentFromHoldings } from '@/lib/utils';
import { BarChart3 } from 'lucide-react';

interface BucketHeaderProps {
  bucket: BucketType;
  recentTransactions: { amount: number }[];
  progress: number;
  onShowTransactionHistory: () => void;
  onShowTransactionChart: () => void;
  children?: React.ReactNode; // for menu injection
  exchangeRates: { [key: string]: number };
}

export function BucketHeader({ 
  bucket, 
  recentTransactions, 
  progress, 
  onShowTransactionHistory,
  onShowTransactionChart,
  children,
  exchangeRates
}: BucketHeaderProps) {
  const currency = CURRENCIES[bucket.currency];
  
  // For fund buckets, calculate current from holdings; for debt buckets, use bucket.current
  const actualCurrent = bucket.type === 'fund' 
    ? calculateCurrentFromHoldings(bucket.holdings, exchangeRates) / (exchangeRates[bucket.currency] || 1)
    : bucket.current;

  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3 flex-1">
        <span className="text-white font-bold text-lg uppercase">
          ▌ {bucket.name}
        </span>
        <span className="text-[var(--text-primary)] opacity-50">•</span>
        <div className="flex items-center gap-2">
          {bucket.type === 'debt' ? (
            <>
              <span className="text-xl font-bold text-white">
                {currency.symbol}{formatSmartAmount(actualCurrent, bucket.currency)}
              </span>
              <span className="text-[var(--text-primary)] mx-2">owed</span>
              <span className="text-[var(--text-primary)] opacity-50">•</span>
              <span className="text-[var(--text-primary)] ml-2">
                {currency.symbol}{formatSmartAmount(bucket.creditLimit || bucket.current, bucket.currency)} limit
              </span>
            </>
          ) : (
            <>
              <span className="text-xl font-bold text-white">
                {currency.symbol}{formatSmartAmount(actualCurrent, bucket.currency)}
              </span>
              <span className="text-[var(--text-primary)]">
                / {currency.symbol}{formatSmartAmount(bucket.target, bucket.currency)}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Chart button */}
        <button
          onClick={onShowTransactionChart}
          className="p-2 text-[var(--text-primary)] opacity-50 hover:opacity-80 hover:text-[var(--text-accent)] transition-all duration-200 hover:scale-110"
          title="View transaction chart"
        >
          <BarChart3 size={18} />
        </button>

        {/* Recent transaction */}
        {recentTransactions.length > 0 && (
          <button
            onClick={onShowTransactionHistory}
            className="text-xs text-[var(--text-primary)] opacity-50 hover:opacity-80 hover:text-[var(--text-accent)] transition-colors cursor-pointer"
            title="Click to view transaction history"
          >
            Recent: {currency.symbol}{Math.round(recentTransactions[0].amount).toLocaleString()}
          </button>
        )}

        {/* Progress percentage */}
        {progress > 0 && progress < 100 && (
          <span className="text-sm text-[var(--text-primary)] opacity-80">
            {progress.toFixed(1)}%
          </span>
        )}

        {/* Slot for menu */}
        {children}
      </div>
    </div>
  );
} 