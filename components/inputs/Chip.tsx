'use client';

import { motion } from 'framer-motion';
import { useDraggable } from '@dnd-kit/core';
import { Chip as ChipType, CURRENCIES } from '@/lib/types';
import { useBudget } from '@/lib/context/budget-context';

interface ChipProps {
  chip: ChipType;
}

export function Chip({ chip }: ChipProps) {
  const { removeChip } = useBudget();
  const currency = CURRENCIES[chip.currency];
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: chip.id,
    data: {
      type: 'chip',
      chip,
    },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  // Calculate USD equivalent for tooltip
  const usdValue = chip.amount * chip.usdRate;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        relative inline-flex items-center justify-center
        min-w-[120px] h-12 px-4 py-2
        glass-panel
        border-2 ${chip.isNegative ? 'border-red-500' : 'border-[var(--text-primary)]'}
        font-mono text-sm font-medium
        draggable focusable
        ${chip.isNegative ? 'hover:border-red-400' : 'hover:border-[var(--text-accent)]'}
        transition-all duration-200
        ${isDragging ? 'dragging opacity-80 scale-105' : ''}
        ${isDragging ? 'crt-flicker' : ''}
        ${chip.isNegative ? 'bg-red-900/20' : ''}
      `}
      initial={{ scale: 0, rotate: -10 }}
      animate={{ scale: 1, rotate: 0 }}
      exit={{ scale: 0, rotate: 10 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={chip.currency !== 'USD' ? `≈ $${usdValue.toFixed(2)}` : undefined}
      role="button"
      tabIndex={0}
      aria-label={`${chip.isNegative ? 'Spending' : 'Payment'} ${currency.symbol}${chip.amount.toLocaleString()} ${chip.currency} chip`}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          // Handle keyboard picking up chip
          // This would integrate with keyboard navigation for buckets
        }
      }}
    >
      {/* Chip content */}
      <div className="flex items-center gap-2">
        {chip.isNegative && (
          <span className="text-red-400 font-bold text-xs">−</span>
        )}
        <span className={`${chip.isNegative ? 'text-red-400' : 'text-[var(--text-primary)]'} font-bold`}>
          {currency.symbol}
        </span>
        <span className={chip.isNegative ? 'text-red-200' : 'text-white'}>
          {chip.amount.toLocaleString()}
        </span>
        <span className={`${chip.isNegative ? 'text-red-400' : 'text-[var(--text-primary)]'} text-xs opacity-80`}>
          {chip.currency}
        </span>
      </div>

      {/* Remove button */}
      <div
        onPointerDown={(e) => {
          // Prevent drag start
          e.stopPropagation();
          e.preventDefault();
          removeChip(chip.id);
        }}
        className="absolute -top-1 -right-1 w-4 h-4 bg-black border border-[var(--text-accent)] text-[var(--text-accent)] text-xs font-bold flex items-center justify-center hover:bg-[var(--text-accent)] hover:text-black transition-colors cursor-pointer"
        title="Remove chip"
      >
        ×
      </div>

      {/* CRT glow effect */}
      <div className={`absolute inset-0 border-2 ${chip.isNegative ? 'border-red-500' : 'border-[var(--text-primary)]'} opacity-20 blur-sm -z-10`} />
      
      {/* Ghost trail effect when dragging */}
      {isDragging && (
        <motion.div
          className={`absolute inset-0 border-2 ${chip.isNegative ? 'border-red-500' : 'border-[var(--text-primary)]'} opacity-30 blur-md`}
          initial={{ scale: 1, opacity: 0.3 }}
          animate={{ scale: 1.2, opacity: 0 }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
} 