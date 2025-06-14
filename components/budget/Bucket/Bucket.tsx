'use client';

import { motion } from 'framer-motion';
import { useDroppable } from '@dnd-kit/core';
import { Bucket as BucketType, Transaction, Chip } from '@/lib/types';
import { useBudget } from '@/lib/context/budget-context';
import { useState, useEffect } from 'react';
import { TransactionHistoryModal } from '../../transaction/TransactionHistoryModal';
import { BucketProgressBar } from './BucketProgressBar';
import { BucketHoldings } from './BucketHoldings';
import { BucketMenu } from './BucketMenu';
import { BucketHeader } from './BucketHeader';

interface BucketProps {
  bucket: BucketType;
  activeChip?: Chip | null;
}

export function Bucket({ bucket, activeChip }: BucketProps) {
  const { state, resetBucket } = useBudget();
  const [isShaking, setIsShaking] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  
  // Check if the current drag is valid for this bucket
  const isValidDropTarget = !activeChip || 
    (activeChip.isNegative ? bucket.type === 'debt' : true);
  
  const {
    isOver,
    setNodeRef,
  } = useDroppable({
    id: bucket.id,
    data: {
      type: 'bucket',
      bucket,
    },
    disabled: !isValidDropTarget,
  });

  // Calculate progress percentage
  const progress = bucket.type === 'fund' 
    ? (bucket.current / bucket.target) * 100
    : (() => {
        // For credit cards, show payoff progress (100% - utilization)
        const creditLimit = bucket.creditLimit || bucket.current;
        const utilization = (bucket.current / creditLimit) * 100;
        return 100 - utilization; // 0% owed = 100% progress
      })();



  // Get recent transactions for this bucket (last 20)
  useEffect(() => {
    const bucketTransactions = state.transactions
      .filter((t: Transaction) => t.bucketId === bucket.id)
      .sort((a: Transaction, b: Transaction) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);
    setRecentTransactions(bucketTransactions);
  }, [state.transactions, bucket.id]);

  // Trigger animations based on new milestones
  useEffect(() => {
    if (bucket.completedMilestones.length > 0) {
      setIsFlashing(true);
      setTimeout(() => {
        setIsFlashing(false);
      }, 1000);
    }
  }, [bucket.completedMilestones]);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 200);
  };

  return (
    <motion.div
      ref={setNodeRef}
      className={`
        w-full p-4 glass-panel relative
        border-2 transition-all duration-200
        drop-zone focusable
        ${
          activeChip 
            ? (isValidDropTarget 
                ? (isOver ? 'drag-over border-green-400 bg-green-400/20' : 'border-green-500/50')
                : 'border-red-500/50 opacity-50')
            : (isOver ? 'drag-over' : 'border-[var(--text-primary)]')
        }
        ${isShaking ? 'bucket-shake' : ''}
        ${isFlashing ? 'milestone-flash' : ''}
      `}

      onAnimationComplete={() => {
        if (isOver) triggerShake();
      }}
      role="region"
      aria-label={`${bucket.name} ${bucket.type}`}
      tabIndex={0}
    >
      {/* Compact Header with Name and Amounts */}
      <BucketHeader 
        bucket={bucket}
        recentTransactions={recentTransactions}
        progress={progress}
        onShowTransactionHistory={() => setShowTransactionHistory(true)}
      >
        <BucketMenu bucketId={bucket.id} onReset={resetBucket} />
      </BucketHeader>

      {/* Holdings Breakdown - only show if bucket has holdings */}
      <BucketHoldings 
        holdings={bucket.holdings} 
        exchangeRates={state.exchangeRates.rates} 
      />

      <BucketProgressBar bucket={bucket} />

      {/* Transaction History Modal */}
      <TransactionHistoryModal 
        isOpen={showTransactionHistory}
        onClose={() => setShowTransactionHistory(false)}
        bucket={bucket}
        transactions={recentTransactions}
      />

    </motion.div>
  );
} 