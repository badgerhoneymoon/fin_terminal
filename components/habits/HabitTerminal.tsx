'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useHabit } from '@/lib/context/habit-context';
import { Habit } from '@/lib/types';
import { HabitCalendar } from './HabitCalendar';
import { FocusSelector } from './FocusSelector';

export function HabitTerminal() {
  const { state, getCurrentWeekHabits, setWeek, exportData, importData } = useHabit();
  const [currentWeekHabits, setCurrentWeekHabits] = useState<Habit[]>([]);

  // Update current week habits when state changes
  useEffect(() => {
    setCurrentWeekHabits(getCurrentWeekHabits());
  }, [state.habits, state.currentWeekStart, getCurrentWeekHabits]);

  // Week navigation helpers
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeekStart = new Date(state.currentWeekStart);
    if (direction === 'prev') {
      newWeekStart.setDate(newWeekStart.getDate() - 7);
    } else {
      newWeekStart.setDate(newWeekStart.getDate() + 7);
    }
    setWeek(newWeekStart);
  };

  const goToCurrentWeek = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    setWeek(monday);
  };

  const isCurrentWeek = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const currentMonday = new Date(now.setDate(diff));
    currentMonday.setHours(0, 0, 0, 0);
    return state.currentWeekStart.getTime() === currentMonday.getTime();
  };

  // Format week display
  const formatWeekDisplay = (date: Date) => {
    const endDate = new Date(date);
    endDate.setDate(date.getDate() + 6);
    
    const formatDate = (d: Date) => {
      return d.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    };

    return `${formatDate(date)} - ${formatDate(endDate)}`;
  };

  return (
    <div className="min-h-screen bg-[var(--bg-terminal)] crt-scanlines">
      <div className="flex flex-col min-h-screen">
        {/* Header */}
        <div className="border-b border-[var(--text-primary)] bg-[var(--bg-terminal)]">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between"
            >
              <div>
                <h1 className="text-2xl font-mono font-medium text-[var(--text-primary)] terminal-glow">
                  HABIT TERMINAL
                </h1>
                
                {/* Week navigation */}
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={() => navigateWeek('prev')}
                      className="w-8 h-8 border border-[var(--text-primary)] text-[var(--text-primary)] 
                                hover:bg-[var(--text-primary)] hover:text-[var(--bg-terminal)] 
                                transition-colors duration-200 font-mono text-sm focusable"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title="Previous week"
                    >
                      ←
                    </motion.button>
                    
                    <div className="text-center">
                      <p className="text-sm text-[var(--text-primary)] font-mono">
                        {formatWeekDisplay(state.currentWeekStart)}
                      </p>
                      {!isCurrentWeek() && (
                        <motion.button
                          onClick={goToCurrentWeek}
                          className="text-xs text-[var(--text-accent)] hover:text-[var(--text-primary)] 
                                    transition-colors duration-200 font-mono"
                          whileHover={{ scale: 1.05 }}
                        >
                          GO TO CURRENT WEEK
                        </motion.button>
                      )}
                    </div>
                    
                    <motion.button
                      onClick={() => navigateWeek('next')}
                      className="w-8 h-8 border border-[var(--text-primary)] text-[var(--text-primary)] 
                                hover:bg-[var(--text-primary)] hover:text-[var(--bg-terminal)] 
                                transition-colors duration-200 font-mono text-sm focusable"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title="Next week"
                    >
                      →
                    </motion.button>
                  </div>
                </div>
              </div>
              
              {/* Navigation back to budget */}
              <motion.a
                href="/"
                className="px-4 py-2 border border-[var(--text-primary)] text-[var(--text-primary)] 
                          hover:bg-[var(--text-primary)] hover:text-[var(--bg-terminal)] 
                          transition-colors duration-200 font-mono text-sm focusable"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ← BUDGET DROP
              </motion.a>
            </motion.div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
          <div className="grid gap-8">
            
            {/* Focus Selector - Create new habits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <FocusSelector />
            </motion.div>

            {/* Weekly Habit Tracking */}
            {currentWeekHabits.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-mono font-medium text-[var(--text-primary)] 
                              border-b border-[var(--text-primary)] pb-2">
                  THIS WEEK&apos;S FOCUS
                </h2>
                
                <div className="space-y-4">
                  {currentWeekHabits
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((habit) => (
                      <HabitCalendar key={habit.id} habit={habit} />
                    ))}
                </div>
              </motion.div>
            )}

            {/* Empty state */}
            {currentWeekHabits.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center py-16"
              >
                <div className="glass-panel p-8 max-w-md mx-auto">
                  <h3 className="text-lg font-mono text-[var(--text-primary)] mb-4">
                    NO HABITS SET FOR THIS WEEK
                  </h3>
                  <p className="text-[var(--text-primary)] opacity-70 font-mono text-sm">
                    Create a habit above to start tracking your weekly focus.
                    Aim for 6 out of 7 days to build lasting change.
                  </p>
                </div>
              </motion.div>
            )}

          </div>
        </div>

        {/* Footer - Habit Terminal specific */}
        <footer className="border-t border-[var(--text-primary)] bg-[var(--bg-terminal)] p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Left side - Import/Export */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  // Create file input for import
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.json,application/json';
                  input.onchange = async (event) => {
                    const target = event.target as HTMLInputElement;
                    const file = target.files?.[0];
                    if (!file) return;

                    try {
                      const text = await file.text();
                      importData(text);
                    } catch (error) {
                      console.error('Import error:', error);
                      alert('Invalid JSON file format');
                    }
                  };
                  input.click();
                }}
                className="px-3 py-1 border border-[var(--text-primary)] text-[var(--text-primary)] 
                          hover:bg-[var(--text-primary)] hover:text-[var(--bg-terminal)] 
                          transition-colors duration-200 font-mono text-xs focusable"
                title="Import habit data from JSON file"
              >
                [IMPORT]
              </button>
              
              <button
                onClick={exportData}
                className="px-3 py-1 border border-[var(--text-primary)] text-[var(--text-primary)] 
                          hover:bg-[var(--text-primary)] hover:text-[var(--bg-terminal)] 
                          transition-colors duration-200 font-mono text-xs focusable"
                title="Export habit data as JSON"
              >
                [EXPORT JSON]
              </button>
            </div>

            {/* Center - Info */}
            <p className="text-xs text-[var(--text-primary)] opacity-50 font-mono">
              habit terminal v1.0 • data persists locally
            </p>

            {/* Right side - placeholder for balance */}
            <div className="w-32"></div>
          </div>
        </footer>
      </div>
    </div>
  );
}