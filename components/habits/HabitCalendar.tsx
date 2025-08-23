'use client';

import { motion } from 'framer-motion';
import { useHabit } from '@/lib/context/habit-context';
import { Habit } from '@/lib/types';

interface HabitCalendarProps {
  habit: Habit;
}

// Helper functions for calendar
function getWeekDates(weekStart: Date): Date[] {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    dates.push(date);
  }
  return dates;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
}

function getDayName(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
}

function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

function isFuture(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date > today;
}

export function HabitCalendar({ habit }: HabitCalendarProps) {
  const { toggleCompletion, getWeekProgress, deleteHabit } = useHabit();
  const progress = getWeekProgress(habit.id);
  const weekDates = getWeekDates(habit.weekStart);


  const handleDateClick = (dayIndex: number, date: Date) => {
    // Don't allow toggling future dates
    if (isFuture(date)) return;
    toggleCompletion(habit.id, dayIndex);
  };

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

      {/* Calendar Grid */}
      <div className="space-y-3">
        {/* Week header with actual dates */}
        <div className="text-center">
          <h4 className="text-md font-mono text-[var(--text-primary)] opacity-80">
            {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
          </h4>
        </div>

        {/* 7-Day Calendar Grid */}
        <div className="grid grid-cols-7 gap-3">
          {weekDates.map((date, index) => {
            const isCompleted = habit.completions[index];
            const todayDate = isToday(date);
            const futureDate = isFuture(date);
            
            return (
              <div key={date.toISOString()} className="text-center">
                {/* Day name */}
                <div className={`text-xs font-mono mb-2 ${
                  todayDate 
                    ? 'text-[var(--text-accent)] font-bold' 
                    : 'text-[var(--text-primary)] opacity-70'
                }`}>
                  {getDayName(date)}
                </div>
                
                {/* Date and completion button */}
                <motion.button
                  onClick={() => handleDateClick(index, date)}
                  disabled={futureDate}
                  className={`
                    w-16 h-16 border-2 font-mono text-xs font-medium
                    transition-all duration-200 focusable flex flex-col items-center justify-center
                    ${futureDate 
                      ? 'border-[var(--text-primary)] border-opacity-30 text-[var(--text-primary)] opacity-30 cursor-not-allowed'
                      : isCompleted 
                        ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-terminal)]' 
                        : 'border-[var(--text-primary)] bg-transparent text-[var(--text-primary)]'
                    }
                    ${!futureDate && !isCompleted && 'hover:border-[var(--text-accent)]'}
                    ${!futureDate && !isCompleted && 'hover:bg-[var(--text-primary)] hover:text-[var(--bg-terminal)]'}
                    ${todayDate && !futureDate && 'ring-2 ring-[var(--text-accent)] ring-opacity-50'}
                  `}
                  whileHover={!futureDate ? { scale: 1.05 } : {}}
                  whileTap={!futureDate ? { scale: 0.95 } : {}}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 20,
                    delay: index * 0.05 
                  }}
                  aria-label={`${getDayName(date)} ${formatDate(date)} - ${isCompleted ? 'Completed' : 'Not completed'}`}
                >
                  {/* Date number */}
                  <div className="text-xs opacity-80">
                    {date.getDate()}
                  </div>
                  
                  {/* Completion indicator */}
                  <motion.div
                    initial={false}
                    animate={{ 
                      scale: isCompleted ? 1 : 0,
                      rotate: isCompleted ? 0 : 180
                    }}
                    transition={{ duration: 0.2 }}
                    className="text-lg leading-none"
                  >
                    {isCompleted ? '✓' : '○'}
                  </motion.div>
                  
                </motion.button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs font-mono text-[var(--text-primary)] opacity-70 mb-1">
          <span>PROGRESS</span>
          <span>{Math.round((progress.completed / 7) * 100)}% ({progress.completed}/7 DAYS)</span>
        </div>
        <div className="w-full h-2 border border-[var(--text-primary)] relative">
          <div
            className="h-full bg-[var(--text-primary)] transition-all duration-500 ease-out"
            style={{ width: `${(progress.completed / 7) * 100}%` }}
          />
          {/* Success threshold line */}
          <div 
            className="absolute top-0 w-0.5 h-full bg-[var(--text-accent)]"
            style={{ left: `${(progress.target / 7) * 100}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
}