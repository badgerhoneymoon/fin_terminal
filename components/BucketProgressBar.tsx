'use client';

import { motion } from 'framer-motion';
import { Bucket as BucketType, CURRENCIES } from '@/lib/types';

interface BucketProgressBarProps {
  bucket: BucketType;
}

export function BucketProgressBar({ bucket }: BucketProgressBarProps) {
  const currency = CURRENCIES[bucket.currency];

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

  const renderProgressLabels = () => {
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
  };

  return (
    <>
      {/* Progress Display - Linear only */}
      <div className="flex items-center gap-2">
        {createProgressSegments()}
      </div>
      <div className="mt-1 relative h-4 text-xs text-[var(--text-primary)] opacity-60">
        {renderProgressLabels()}
      </div>
    </>
  );
} 