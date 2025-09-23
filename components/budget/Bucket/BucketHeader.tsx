'use client';

import { Bucket as BucketType, CURRENCIES } from '@/lib/types';
import { formatSmartAmount, calculateCurrentFromHoldings } from '@/lib/utils';
import { BarChart3, Pencil, Check, X } from 'lucide-react';
import { useState } from 'react';
import { useBudget } from '@/lib/context/budget-context';

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
  const { dispatch } = useBudget();
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [editedTarget, setEditedTarget] = useState(0);

  const handleSave = () => {
    if (bucket.type === 'debt') {
      dispatch({
        type: 'UPDATE_BUCKET_TARGET',
        payload: {
          bucketId: bucket.id,
          target: bucket.target,
          creditLimit: editedTarget
        }
      });
    } else {
      dispatch({
        type: 'UPDATE_BUCKET_TARGET',
        payload: {
          bucketId: bucket.id,
          target: editedTarget
        }
      });
    }
    setIsEditingTarget(false);
  };

  const handleCancel = () => {
    setIsEditingTarget(false);
  };

  const startEditing = () => {
    setEditedTarget(bucket.type === 'debt' ? bucket.creditLimit || bucket.current : bucket.target);
    setIsEditingTarget(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };
  
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
              {isEditingTarget ? (
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-[var(--text-primary)]">{currency.symbol}</span>
                  <input
                    type="number"
                    value={editedTarget}
                    onChange={(e) => setEditedTarget(Number(e.target.value))}
                    onKeyDown={handleKeyDown}
                    className="bg-black/60 text-white px-2 py-1 border border-[var(--text-primary)] rounded text-sm w-32"
                    autoFocus
                  />
                  <button
                    onClick={handleSave}
                    className="text-green-500 hover:text-green-400"
                    title="Save (Enter)"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={handleCancel}
                    className="text-red-500 hover:text-red-400"
                    title="Cancel (Esc)"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={startEditing}
                  className="flex items-center gap-2 text-[var(--text-primary)] ml-2 hover:text-[var(--text-accent)] transition-colors group"
                >
                  <span>{currency.symbol}{formatSmartAmount(bucket.creditLimit || bucket.current, bucket.currency)} limit</span>
                  <Pencil size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}
            </>
          ) : (
            <>
              <span className="text-xl font-bold text-white">
                {currency.symbol}{formatSmartAmount(actualCurrent, bucket.currency)}
              </span>
              {isEditingTarget ? (
                <div className="flex items-center gap-2">
                  <span className="text-[var(--text-primary)]">/</span>
                  <span className="text-[var(--text-primary)]">{currency.symbol}</span>
                  <input
                    type="number"
                    value={editedTarget}
                    onChange={(e) => setEditedTarget(Number(e.target.value))}
                    onKeyDown={handleKeyDown}
                    className="bg-black/60 text-white px-2 py-1 border border-[var(--text-primary)] rounded text-sm w-32"
                    autoFocus
                  />
                  <button
                    onClick={handleSave}
                    className="text-green-500 hover:text-green-400"
                    title="Save (Enter)"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={handleCancel}
                    className="text-red-500 hover:text-red-400"
                    title="Cancel (Esc)"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={startEditing}
                  className="flex items-center gap-1 text-[var(--text-primary)] hover:text-[var(--text-accent)] transition-colors group"
                >
                  <span>/ {currency.symbol}{formatSmartAmount(bucket.target, bucket.currency)}</span>
                  <Pencil size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}
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