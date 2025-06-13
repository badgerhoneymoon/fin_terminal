'use client';

import { motion } from 'framer-motion';
import { useDroppable } from '@dnd-kit/core';
import { useState, useEffect } from 'react';
import { Bucket as BucketType, CURRENCIES, Chip, Transaction } from '@/lib/types';
import { useBudget } from '@/lib/budget-context';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TransactionHistoryModal } from '@/components/TransactionHistoryModal';
import { formatSmartAmount } from '@/lib/utils';

// Separate component for each mini progress circle
function MiniCircularProgress({ bucket, index, activeChip, onCircleClick }: { 
  bucket: BucketType; 
  index: number; 
  activeChip?: Chip | null;
  onCircleClick: (bucket: BucketType) => void;
}) {
  // Check if the current drag is valid for this bucket
  const isValidDropTarget = !activeChip || 
    (activeChip.isNegative ? bucket.type === 'debt' : true);

  const {
    isOver,
    setNodeRef,
  } = useDroppable({
    id: `compact-${bucket.id}`,
    data: {
      type: 'bucket',
      bucket,
    },
    disabled: !isValidDropTarget,
  });
  const size = 150;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const currency = CURRENCIES[bucket.currency];

  // Calculate progress percentage
  const progress = bucket.type === 'fund' 
    ? (bucket.current / bucket.target) * 100
    : (() => {
        // For credit cards, show payoff progress (100% - utilization)
        const creditLimit = bucket.creditLimit || bucket.current;
        const utilization = (bucket.current / creditLimit) * 100;
        return 100 - utilization; // 0% owed = 100% progress
      })();

  // Color based on progress (same logic for both funds and credit cards now)
  let strokeColor;
  if (progress < 25) {
    strokeColor = '#ef4444'; // Red
  } else if (progress < 50) {
    strokeColor = '#f59e0b'; // Yellow/Orange  
  } else if (progress < 75) {
    strokeColor = '#84cc16'; // Light green
  } else {
    strokeColor = '#10b981'; // Bright green
  }

  return (
    <div 
      ref={setNodeRef}
      className={`relative flex items-center justify-center transition-all duration-200 ${
        activeChip 
          ? (isValidDropTarget 
              ? (isOver ? 'scale-110 ring-2 ring-green-400 ring-opacity-50' : 'ring-2 ring-green-500/50')
              : 'opacity-50 ring-2 ring-red-500/50')
          : (isOver ? 'scale-110 ring-2 ring-[var(--text-accent)] ring-opacity-50' : '')
      }`} 
      key={bucket.id}
    >
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div 
              className="relative cursor-pointer hover:scale-105 transition-transform duration-200" 
              style={{ width: size, height: size }}
              onClick={() => onCircleClick(bucket)}
            >
              <svg
                width={size}
                height={size}
                className="transform -rotate-90"
              >
                {/* Background circle */}
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke="var(--text-primary)"
                  strokeWidth={strokeWidth}
                  fill="none"
                  opacity={0.2}
                />
                
                {/* Progress circle */}
                <motion.circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: circumference - (progress / 100) * circumference }}
                  transition={{ duration: 0.8, delay: index * 0.3, ease: 'easeOut' }}
                  style={{
                    filter: `drop-shadow(0 0 6px ${strokeColor}60)`,
                  }}
                />
              </svg>

              {/* Center content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <div className="text-lg font-bold text-white">
                  {progress.toFixed(0)}%
                </div>
                <div className="text-[8px] text-[var(--text-primary)] opacity-60 uppercase leading-tight">
                  {bucket.name.split(' ')[0]}
                </div>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent 
            side="bottom" 
            className="bg-black/90 border-[var(--text-primary)] text-white"
          >
            <div className="text-center">
              <div className="font-semibold">
                {currency.symbol}{formatSmartAmount(bucket.current, bucket.currency)}
              </div>
              <div className="text-[var(--text-primary)] text-xs">
                / {currency.symbol}{formatSmartAmount(
                  bucket.type === 'debt' && bucket.creditLimit 
                    ? bucket.creditLimit 
                    : bucket.target, 
                  bucket.currency
                )}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

interface CompactGoalsProps {
  activeChip?: Chip | null;
}

export function CompactGoals({ activeChip }: CompactGoalsProps) {
  const { state } = useBudget();
  const [selectedBucket, setSelectedBucket] = useState<BucketType | null>(null);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  // Get recent transactions for the selected bucket
  useEffect(() => {
    if (selectedBucket) {
      const bucketTransactions = state.transactions
        .filter(t => t.bucketId === selectedBucket.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 20);
      setRecentTransactions(bucketTransactions);
    }
  }, [state.transactions, selectedBucket]);

  const handleCircleClick = (bucket: BucketType) => {
    setSelectedBucket(bucket);
    setShowTransactionHistory(true);
  };

  const handleCloseTransactionHistory = () => {
    setShowTransactionHistory(false);
    // Don't reset selectedBucket immediately to avoid UI flicker
    setTimeout(() => setSelectedBucket(null), 200);
  };

  return (
    <motion.div
      className="w-full p-6 glass-panel border-2 border-[var(--text-primary)] hover:border-[var(--text-accent)] transition-all duration-300 group"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Circular Progress */}
      <div className="flex justify-center items-center gap-12">
        {state.buckets.slice(0, 4).map((bucket, index) => 
          <MiniCircularProgress 
            key={bucket.id} 
            bucket={bucket} 
            index={index} 
            activeChip={activeChip}
            onCircleClick={handleCircleClick}
          />
        )}
      </div>

      {/* Summary Stats */}
      <motion.div
        className="mt-8 pt-4 border-t border-[var(--text-primary)] opacity-30"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <div className="flex justify-between text-sm">
          <div className="text-[var(--text-primary)]">
            Total Progress:
          </div>
          <div className="text-white font-semibold">
            {(() => {
              const totalProgress = state.buckets.reduce((sum, bucket) => {
                const progress = bucket.type === 'fund' 
                  ? (bucket.current / bucket.target) * 100
                  : (() => {
                      // For credit cards, show payoff progress (100% - utilization)
                      const creditLimit = bucket.creditLimit || bucket.current;
                      const utilization = (bucket.current / creditLimit) * 100;
                      return 100 - utilization; // 0% owed = 100% progress
                    })();
                return sum + progress;
              }, 0);
              return (totalProgress / state.buckets.length).toFixed(1);
            })()}% Complete
          </div>
        </div>
      </motion.div>

      {/* Animated background effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute border border-[var(--text-accent)] rounded-full opacity-10"
            style={{
              width: `${200 + i * 100}px`,
              height: `${200 + i * 100}px`,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      {/* Transaction History Modal */}
      {selectedBucket && (
        <TransactionHistoryModal 
          isOpen={showTransactionHistory}
          onClose={handleCloseTransactionHistory}
          bucket={selectedBucket}
          transactions={recentTransactions}
        />
      )}
    </motion.div>
  );
} 