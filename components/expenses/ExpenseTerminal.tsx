'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useExpense } from '@/lib/context/expense-context';
import { CategoryCard } from './CategoryCard';
import { QuickAddModal } from './QuickAddModal';
import { CategoryHistoryModal } from './CategoryHistoryModal';
import { formatSmartAmount } from '@/lib/utils';

export function ExpenseTerminal() {
  const { state, getTotalMonthSpent, getProgressColor, exportData, importData, setMonth } = useExpense();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const totalSpent = getTotalMonthSpent();
  const totalLimit = state.categories.reduce((sum, cat) => sum + cat.monthlyLimit, 0);
  const totalColor = getProgressColor(totalSpent, totalLimit);
  const totalPercentage = Math.min((totalSpent / totalLimit) * 100, 100);

  // Month navigation
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(state.currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setMonth(newMonth);
  };

  const formatMonthDisplay = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    }).toUpperCase();
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return (
      state.currentMonth.getMonth() === now.getMonth() &&
      state.currentMonth.getFullYear() === now.getFullYear()
    );
  };

  const goToCurrentMonth = () => {
    setMonth(new Date());
  };

  const colorClasses = {
    green: 'bg-[var(--text-primary)]',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500'
  };

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-terminal)] crt-scanlines">
      <div className="flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-[var(--text-primary)] bg-[var(--bg-terminal)]">
          <div className="max-w-lg mx-auto px-4 py-4">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Title and month nav */}
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-mono font-medium text-[var(--text-primary)] terminal-glow">
                  EXPENSES
                </h1>

                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={() => navigateMonth('prev')}
                    className="w-8 h-8 border border-[var(--text-primary)] text-[var(--text-primary)]
                              hover:bg-[var(--text-primary)] hover:text-[var(--bg-terminal)]
                              transition-colors duration-200 font-mono text-sm"
                    whileTap={{ scale: 0.95 }}
                  >
                    ←
                  </motion.button>

                  <span className="text-sm text-[var(--text-primary)] font-mono min-w-[80px] text-center">
                    {formatMonthDisplay(state.currentMonth)}
                  </span>

                  <motion.button
                    onClick={() => navigateMonth('next')}
                    className="w-8 h-8 border border-[var(--text-primary)] text-[var(--text-primary)]
                              hover:bg-[var(--text-primary)] hover:text-[var(--bg-terminal)]
                              transition-colors duration-200 font-mono text-sm"
                    whileTap={{ scale: 0.95 }}
                  >
                    →
                  </motion.button>
                </div>
              </div>

              {!isCurrentMonth() && (
                <motion.button
                  onClick={goToCurrentMonth}
                  className="text-xs text-[var(--text-accent)] hover:text-[var(--text-primary)]
                            transition-colors duration-200 font-mono"
                  whileHover={{ scale: 1.02 }}
                >
                  GO TO CURRENT MONTH
                </motion.button>
              )}

              {/* Total budget progress */}
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-[var(--text-primary)] opacity-70 font-mono">
                    TOTAL
                  </span>
                  <span className="text-lg font-mono font-bold text-[var(--text-primary)]">
                    ${formatSmartAmount(totalSpent)} / ${formatSmartAmount(totalLimit)}
                  </span>
                </div>
                <div className="h-3 bg-[var(--text-primary)]/20 border border-[var(--text-primary)]">
                  <motion.div
                    className={`h-full ${colorClasses[totalColor]}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${totalPercentage}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </header>

        {/* Main Content - Category Cards */}
        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4 pb-24">
          <div className="space-y-3">
            {state.categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <CategoryCard
                  category={category}
                  onClick={() => handleCategoryClick(category.id)}
                />
              </motion.div>
            ))}
          </div>
        </main>

        {/* Footer */}
        <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--text-primary)] bg-[var(--bg-terminal)] p-3">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
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
                className="px-2 py-1 border border-[var(--text-primary)] text-[var(--text-primary)]
                          hover:bg-[var(--text-primary)] hover:text-[var(--bg-terminal)]
                          transition-colors duration-200 font-mono text-xs"
              >
                IMPORT
              </button>

              <button
                onClick={exportData}
                className="px-2 py-1 border border-[var(--text-primary)] text-[var(--text-primary)]
                          hover:bg-[var(--text-primary)] hover:text-[var(--bg-terminal)]
                          transition-colors duration-200 font-mono text-xs"
              >
                EXPORT
              </button>
            </div>

            <motion.a
              href="/"
              className="px-2 py-1 border border-[var(--text-primary)] text-[var(--text-primary)]
                        hover:bg-[var(--text-primary)] hover:text-[var(--bg-terminal)]
                        transition-colors duration-200 font-mono text-xs"
              whileTap={{ scale: 0.95 }}
            >
              BUDGET
            </motion.a>
          </div>
        </footer>

        {/* FAB - Quick Add Button */}
        <motion.button
          onClick={() => setShowQuickAdd(true)}
          className="fixed bottom-20 right-4 w-14 h-14 rounded-full
                    bg-[var(--text-primary)] text-[var(--bg-terminal)]
                    flex items-center justify-center text-2xl font-bold
                    shadow-lg shadow-[var(--text-primary)]/30
                    hover:scale-110 transition-transform z-50"
          whileTap={{ scale: 0.9 }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
        >
          +
        </motion.button>

        {/* Quick Add Modal */}
        <QuickAddModal
          isOpen={showQuickAdd}
          onClose={() => setShowQuickAdd(false)}
        />

        {/* Category History Modal */}
        <CategoryHistoryModal
          categoryId={selectedCategoryId}
          onClose={() => setSelectedCategoryId(null)}
        />
      </div>
    </div>
  );
}
