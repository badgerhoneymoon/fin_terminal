'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useDroppable } from '@dnd-kit/core';
import { Bucket as BucketType, CURRENCIES, Transaction, Currency, Chip } from '@/lib/types';
import { useBudget } from '@/lib/budget-context';
import { useState, useEffect } from 'react';
import { formatSmartAmount } from '@/lib/utils';
import { TransactionHistoryModal } from './TransactionHistoryModal';

interface BucketProps {
  bucket: BucketType;
  activeChip?: Chip | null;
}

export function Bucket({ bucket, activeChip }: BucketProps) {
  const { state, resetBucket } = useBudget();
  const [isShaking, setIsShaking] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  
  const currency = CURRENCIES[bucket.currency];
  
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



  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showMenu) {
        setShowMenu(false);
      }
    };
    
    if (showMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showMenu]);

  // Get recent transactions for this bucket (last 20)
  useEffect(() => {
    const bucketTransactions = state.transactions
      .filter(t => t.bucketId === bucket.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
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

  // Create segmented progress bar with dynamic percentage thresholds
  const createProgressSegments = () => {
    const segmentCount = 4; // 4 segments for both fund and debt
    const segmentSize = 25; // 25% each
    
    if (bucket.type === 'fund') {
      // Fund bars with segments - neon green
      const segments = [];
      
      for (let i = 0; i < segmentCount; i++) {
        const segmentStartPercent = i * segmentSize; // 0%, 25%, 50%, 75%
        const segmentEndPercent = (i + 1) * segmentSize; // 25%, 50%, 75%, 100%
        
        const segmentStartAmount = bucket.target * (segmentStartPercent / 100);
        const segmentEndAmount = bucket.target * (segmentEndPercent / 100);
        
        // Calculate how much of this segment is complete
        const segmentProgress = Math.max(0, Math.min(1, 
          (bucket.current - segmentStartAmount) / (segmentEndAmount - segmentStartAmount)
        ));
        
        // Color coding based on overall progress percentage
        const overallProgress = (bucket.current / bucket.target) * 100;
        let barColor;
        if (overallProgress < 25) {
          barColor = 'bg-red-500'; // Red for very low progress
        } else if (overallProgress < 50) {
          barColor = 'bg-yellow-500'; // Yellow for low progress
        } else if (overallProgress < 75) {
          barColor = 'bg-green-400'; // Light green for medium progress
        } else {
          barColor = 'bg-green-500'; // Bright green for high progress
        }
        
        segments.push(
          <div
            key={i}
            className="h-6 bg-black border border-[var(--text-primary)] relative overflow-hidden"
            style={{ width: `${segmentSize}%` }}
          >
            <motion.div
              className={`h-full progress-animate ${barColor}`}
              initial={{ width: 0 }}
              animate={{ width: `${segmentProgress * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
            {/* Segment marker */}
            {i < segmentCount - 1 && (
              <div className="absolute right-0 top-0 w-0.5 h-full bg-white opacity-60" />
            )}
          </div>
        );
      }
      
      return <div className="flex flex-1 gap-0.5">{segments}</div>;
    }

    // For credit cards - show payoff progress (reverse of utilization)
    const segments = [];
    const creditLimit = bucket.creditLimit || bucket.current;
    const utilization = (bucket.current / creditLimit) * 100;
    const payoffProgress = 100 - utilization; // Invert: 0% owed = 100% progress
    
    for (let i = 0; i < segmentCount; i++) {
      const segmentStartPercent = i * segmentSize; // 0%, 25%, 50%, 75%
      
      // Calculate how much of this segment is filled by payoff progress
      const segmentProgress = Math.max(0, Math.min(1, 
        (payoffProgress - segmentStartPercent) / segmentSize
      ));
      
      // Color coding based on how much debt is paid off (like goals)
      let barColor;
      if (payoffProgress < 25) {
        barColor = 'bg-red-500'; // Very little paid off (high utilization)
      } else if (payoffProgress < 50) {
        barColor = 'bg-orange-500'; // Some progress (medium utilization)
      } else if (payoffProgress < 75) {
        barColor = 'bg-yellow-500'; // Good progress (low utilization)
      } else {
        barColor = 'bg-green-500'; // Excellent progress (very low utilization)
      }
      
      segments.push(
        <div
          key={i}
          className="h-6 bg-black border border-[var(--text-primary)] relative overflow-hidden"
          style={{ width: `${segmentSize}%` }}
        >
          <motion.div
            className={`h-full progress-animate ${barColor}`}
            initial={{ width: 0 }}
            animate={{ width: `${segmentProgress * 100}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
          {/* Segment marker */}
          {i < segmentCount - 1 && (
            <div className="absolute right-0 top-0 w-0.5 h-full bg-white opacity-60" />
          )}
        </div>
      );
    }
    
    return <div className="flex flex-1 gap-0.5">{segments}</div>;
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
                  {currency.symbol}{formatSmartAmount(bucket.current, bucket.currency)}
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
                  {currency.symbol}{formatSmartAmount(bucket.current, bucket.currency)}
                </span>
                <span className="text-[var(--text-primary)]">
                  / {currency.symbol}{formatSmartAmount(bucket.target, bucket.currency)}
                </span>
              </>
            )}

          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Recent transaction - inline */}
          {recentTransactions.length > 0 && (
            <button
              onClick={() => setShowTransactionHistory(true)}
              className="text-xs text-[var(--text-primary)] opacity-50 hover:opacity-80 hover:text-[var(--text-accent)] transition-colors cursor-pointer"
              title="Click to view transaction history"
            >
              Recent: {currency.symbol}{Math.round(recentTransactions[0].amount).toLocaleString()}
            </button>
          )}
          
          {/* Progress percentage - only show if meaningful */}
          {progress > 0 && progress < 100 && (
            <span className="text-sm text-[var(--text-primary)] opacity-80">
              {progress.toFixed(1)}%
            </span>
          )}
          


          {/* Bucket menu */}
          <div className="relative">
            <button
              className={`text-[var(--text-primary)] hover:text-[var(--text-accent)] transition-colors ${showMenu ? 'text-[var(--text-accent)]' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                setShowMenu(!showMenu);
              }}
              title="Bucket options"
            >
              ⋯
            </button>

            {/* Menu Dropdown */}
            <AnimatePresence>
              {showMenu && (
                <>
                  {/* Backdrop */}
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMenu(false)}
                  />
                  
                  {/* Menu */}
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-48 bg-black border border-[var(--text-primary)] z-50"
                  >
                    <div className="p-2 space-y-1">
                      {/* Reset Button */}
                      <div className="px-3 py-2">
                        <button
                          onClick={() => {
                            resetBucket(bucket.id);
                            setShowMenu(false);
                          }}
                          className="w-full text-left text-xs hover:bg-red-600/20 hover:text-red-400 transition-colors py-1 text-[var(--text-primary)]"
                        >
                          🔄 Reset to Default
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>


          </div>
        </div>
      </div>

      {/* Holdings Breakdown - only show if bucket has holdings */}
      {bucket.holdings && (
        <div className="mb-3 p-3 bg-black/20 border border-[var(--text-primary)] border-opacity-30 rounded-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-primary)] opacity-70 uppercase tracking-wide">
              Holdings
            </span>
            <div className="flex items-center gap-4">
              {Object.entries(bucket.holdings).map(([holdingCurrency, amount]) => {
                const holdingCurrencyInfo = CURRENCIES[holdingCurrency as Currency];
                const holdingRate = state.exchangeRates.rates[holdingCurrency];
                const usdValue = holdingCurrency === 'USD' ? amount : (amount * (holdingRate || 0));
                
                return (
                  <div key={holdingCurrency} className="flex items-center gap-2">
                    <span className="text-sm text-white font-medium">
                      {holdingCurrencyInfo.symbol}{formatSmartAmount(amount, holdingCurrency)}
                    </span>
                    <span className="text-xs text-[var(--text-primary)] opacity-60">
                      {holdingCurrency}
                    </span>
                    {holdingCurrency !== 'USD' && holdingRate && !isNaN(usdValue) && (
                      <span className="text-xs text-[var(--text-primary)] opacity-50">
                        (≈${formatSmartAmount(usdValue, 'USD')})
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Progress Display - Linear only */}
      <div className="flex items-center gap-2">
        {createProgressSegments()}
      </div>
      <div className="mt-1 relative h-4 text-xs text-[var(--text-primary)] opacity-60">
        {(() => {
          const segmentCount = 4;
          
          if (bucket.type === 'fund') {
            const thresholds = Array.from({ length: segmentCount + 1 }, (_, i) => 
              i / segmentCount
            );
            return thresholds.map((threshold, index) => (
              <span 
                key={index}
                className={`absolute ${
                  index === 0 ? '' : 
                  index === segmentCount ? 'transform -translate-x-full' : 
                  'transform -translate-x-1/2'
                }`}
                style={{ left: `${index * 25}%` }}
              >
                {currency.symbol}{Math.round(bucket.target * threshold).toLocaleString()}
              </span>
            ));
          } else {
            // For credit cards, show utilization percentages
            const thresholds = Array.from({ length: segmentCount + 1 }, (_, i) => 
              i / segmentCount
            );
            return thresholds.map((threshold, index) => (
              <span 
                key={index}
                className={`absolute ${
                  index === 0 ? '' : 
                  index === segmentCount ? 'transform -translate-x-full' : 
                  'transform -translate-x-1/2'
                }`}
                style={{ left: `${index * 25}%` }}
              >
                {Math.round(threshold * 100)}%
              </span>
            ));
          }
        })()}
      </div>

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