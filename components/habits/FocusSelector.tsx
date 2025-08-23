'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useHabit } from '@/lib/context/habit-context';

export function FocusSelector() {
  const { createHabit } = useHabit();
  const [habitName, setHabitName] = useState('');
  const [habitDescription, setHabitDescription] = useState('');
  const [target, setTarget] = useState(6);
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!habitName.trim()) return;

    setIsCreating(true);
    
    // Create the habit
    createHabit(
      habitName.trim(),
      habitDescription.trim() || undefined,
      target
    );

    // Reset form
    setHabitName('');
    setHabitDescription('');
    setTarget(6);
    
    // Animation delay
    setTimeout(() => setIsCreating(false), 300);
  };

  return (
    <motion.div
      className="glass-panel p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 className="text-xl font-mono font-medium text-[var(--text-primary)] mb-4 
                    border-b border-[var(--text-primary)] pb-2">
        CREATE WEEKLY FOCUS
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Habit Name */}
        <div>
          <label className="block text-sm font-mono text-[var(--text-primary)] mb-2">
            HABIT NAME
          </label>
          <input
            type="text"
            value={habitName}
            onChange={(e) => setHabitName(e.target.value)}
            placeholder="e.g., Practice Guitar, Read Sapiens"
            className="w-full input-terminal"
            maxLength={50}
            required
          />
        </div>

        {/* Description (Optional) */}
        <div>
          <label className="block text-sm font-mono text-[var(--text-primary)] mb-2">
            DESCRIPTION <span className="opacity-60">(OPTIONAL)</span>
          </label>
          <input
            type="text"
            value={habitDescription}
            onChange={(e) => setHabitDescription(e.target.value)}
            placeholder="e.g., 30 minutes daily practice, Chapter per day"
            className="w-full input-terminal"
            maxLength={100}
          />
        </div>

        {/* Target Days */}
        <div>
          <label className="block text-sm font-mono text-[var(--text-primary)] mb-2">
            SUCCESS TARGET (DAYS PER WEEK)
          </label>
          <div className="flex items-center gap-2 mb-2">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <motion.button
                key={day}
                type="button"
                onClick={() => setTarget(day)}
                className={`
                  w-10 h-10 font-mono text-sm font-medium border-2 transition-all duration-200 focusable
                  ${target === day 
                    ? 'border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-terminal)]' 
                    : 'border-[var(--text-primary)] bg-transparent text-[var(--text-primary)]'
                  }
                  hover:border-[var(--text-accent)]
                  ${target !== day && 'hover:bg-[var(--text-primary)] hover:text-[var(--bg-terminal)]'}
                `}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {day}
              </motion.button>
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-[var(--text-primary)] opacity-60 font-mono">
            <span>
              {target === 7 
                ? "Perfect week - every single day!" 
                : target === 6 
                  ? "Recommended - allows one rest day"
                : target >= 4 
                  ? "Good progress - sustainable pace"
                  : "Light commitment - easy to maintain"}
            </span>
            <span className="text-[var(--text-primary)] opacity-100 font-medium">
              {target}/7 DAYS
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={!habitName.trim() || isCreating}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={!isCreating ? { scale: 1.02 } : {}}
          whileTap={!isCreating ? { scale: 0.98 } : {}}
        >
          {isCreating ? 'CREATING...' : 'CREATE HABIT'}
        </motion.button>
      </form>

      {/* Quick suggestions */}
      <div className="mt-6 pt-4 border-t border-[var(--text-primary)] border-opacity-30">
        <p className="text-xs font-mono text-[var(--text-primary)] opacity-60 mb-2">
          QUICK SUGGESTIONS:
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            'Practice Music',
            'Read Daily', 
            'Exercise',
            'Meditate',
            'Learn Language',
            'Write Journal'
          ].map((suggestion) => (
            <motion.button
              key={suggestion}
              onClick={() => setHabitName(suggestion)}
              className="px-3 py-1 text-xs font-mono border border-[var(--text-primary)] 
                        text-[var(--text-primary)] hover:bg-[var(--text-primary)] 
                        hover:text-[var(--bg-terminal)] transition-colors duration-200 focusable"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {suggestion}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}