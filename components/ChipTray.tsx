'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Chip } from './Chip';
import { Chip as ChipType } from '@/lib/types';

interface ChipTrayProps {
  chips: ChipType[];
  isNegative: boolean;
  onClearChips: () => void;
}

export function ChipTray({ chips, isNegative, onClearChips }: ChipTrayProps) {
  return (
    <motion.div 
      className={`min-h-[60px] p-3 glass-panel border-2 rounded-sm transition-all duration-300 ${
        isNegative 
          ? 'border-red-500 bg-red-900/10 shadow-lg shadow-red-500/20' 
          : 'border-[var(--text-primary)] bg-green-900/5 shadow-lg shadow-green-500/10'
      }`}
      animate={{
        borderColor: isNegative ? '#ef4444' : 'var(--text-primary)',
        backgroundColor: isNegative ? 'rgba(127, 29, 29, 0.1)' : 'rgba(21, 128, 61, 0.05)'
      }}
      transition={{ duration: 0.3 }}
    >
      {chips.length === 0 ? (
        <div className="flex items-center justify-center h-12 text-[var(--text-primary)] opacity-40">
          <div className={`text-sm font-mono font-bold transition-colors duration-300 ${
            isNegative ? 'text-red-400' : 'text-green-400'
          }`}>
            {isNegative ? 'SPENDING MODE' : 'DREAM MODE'}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3 items-start">
          <AnimatePresence>
            {chips.map((chip) => (
              <Chip key={chip.id} chip={chip} />
            ))}
          </AnimatePresence>
          <button
            onClick={onClearChips}
            className="text-[var(--text-accent)] hover:text-red-400 transition-colors text-xs font-bold ml-auto"
            title="Clear all chips"
          >
            CLEAR ALL
          </button>
        </div>
      )}
    </motion.div>
  );
} 