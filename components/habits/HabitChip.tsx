'use client';

import { motion } from 'framer-motion';
import { useHabit } from '@/lib/context/habit-context';

interface HabitChipProps {
  habitId: string;
  dayIndex: number;
  isCompleted: boolean;
  day: string;
}

export function HabitChip({ habitId, dayIndex, isCompleted, day }: HabitChipProps) {
  const { toggleCompletion } = useHabit();

  const handleClick = () => {
    toggleCompletion(habitId, dayIndex);
  };

  return (
    <motion.button
      onClick={handleClick}
      className={`
        w-12 h-12 border-2 font-mono text-xs font-medium
        transition-all duration-200 focusable
        ${isCompleted 
          ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-terminal)]' 
          : 'border-[var(--text-primary)] bg-transparent text-[var(--text-primary)]'
        }
        hover:border-[var(--text-accent)]
        ${isCompleted ? 'hover:bg-[var(--text-accent)]' : 'hover:bg-[var(--text-primary)] hover:text-[var(--bg-terminal)]'}
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 20,
        delay: dayIndex * 0.05 
      }}
      aria-label={`Toggle ${day} completion`}
    >
      <motion.div
        initial={false}
        animate={{ 
          scale: isCompleted ? 1 : 0,
          rotate: isCompleted ? 0 : 180
        }}
        transition={{ duration: 0.2 }}
        className="flex items-center justify-center w-full h-full"
      >
        {isCompleted ? '✓' : '○'}
      </motion.div>
      
      {/* Completion animation */}
      {isCompleted && (
        <motion.div
          className="absolute inset-0 border-2 border-[var(--text-primary)]"
          initial={{ scale: 1, opacity: 1 }}
          animate={{ scale: 1.3, opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.button>
  );
}