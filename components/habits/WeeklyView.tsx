'use client';

import { motion } from 'framer-motion';
import { useHabit } from '@/lib/context/habit-context';
import { Habit, DAYS_OF_WEEK } from '@/lib/types';
import { HabitChip } from './HabitChip';

interface WeeklyViewProps {
  habit: Habit;
}

export function WeeklyView({ habit }: WeeklyViewProps) {
  const { getWeekProgress, deleteHabit } = useHabit();
  const progress = getWeekProgress(habit.id);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel p-6 space-y-4"
    >
      {/* Habit Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-mono font-medium text-[var(--text-primary)]">
            {habit.name.toUpperCase()}
          </h3>
          {habit.description && (
            <p className="text-sm text-[var(--text-primary)] opacity-70 mt-1 font-mono">
              {habit.description}
            </p>
          )}
        </div>
        
        {/* Progress and Delete */}
        <div className="flex items-center gap-4">
          {/* Progress indicator */}
          <div className="text-right">
            <div className={`text-sm font-mono ${
              progress.success 
                ? 'text-[var(--text-primary)]' 
                : 'text-[var(--text-primary)] opacity-70'
            }`}>
              {progress.completed}/{progress.target} DAYS
            </div>
            {progress.success && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-xs font-mono text-[var(--text-primary)] terminal-glow"
              >
                ✓ SUCCESS
              </motion.div>
            )}
          </div>
          
          {/* Delete button */}
          <motion.button
            onClick={() => deleteHabit(habit.id)}
            className="w-8 h-8 border border-red-500 text-red-500 hover:bg-red-500 
                      hover:text-[var(--bg-terminal)] transition-colors duration-200 
                      text-xs font-mono focusable"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Delete habit"
          >
            ×
          </motion.button>
        </div>
      </div>

      {/* 7-Day Grid */}
      <div className="grid grid-cols-7 gap-2">
        {DAYS_OF_WEEK.map((day, index) => (
          <div key={day} className="text-center">
            {/* Day label */}
            <div className="text-xs font-mono text-[var(--text-primary)] opacity-70 mb-2">
              {day}
            </div>
            
            {/* Habit chip */}
            <HabitChip 
              habitId={habit.id}
              dayIndex={index}
              isCompleted={habit.completions[index]}
              day={day}
            />
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs font-mono text-[var(--text-primary)] opacity-70 mb-1">
          <span>PROGRESS</span>
          <span>{Math.round((progress.completed / progress.target) * 100)}%</span>
        </div>
        <div className="h-2 bg-[var(--text-primary)] bg-opacity-20 relative overflow-hidden">
          <motion.div
            className="h-full bg-[var(--text-primary)] absolute left-0 top-0"
            initial={{ width: 0 }}
            animate={{ 
              width: `${Math.min((progress.completed / progress.target) * 100, 100)}%` 
            }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
          {/* Success threshold line */}
          <div 
            className="absolute top-0 w-0.5 h-full bg-[var(--text-accent)] opacity-60"
            style={{ left: `${(progress.target / 7) * 100}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
}