'use client';

import { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useExpense } from '@/lib/context/expense-context';
import { CURRENCIES } from '@/lib/types';
import { formatSmartAmount } from '@/lib/utils';

interface CategoryHistoryModalProps {
  categoryId: string | null;
  onClose: () => void;
}

export function CategoryHistoryModal({ categoryId, onClose }: CategoryHistoryModalProps) {
  const { state, getCurrentMonthExpenses, deleteExpense } = useExpense();
  const [swipedExpenseId, setSwipedExpenseId] = useState<string | null>(null);

  if (!categoryId) return null;

  const category = state.categories.find(c => c.id === categoryId);
  const monthExpenses = getCurrentMonthExpenses();
  const categoryExpenses = monthExpenses
    .filter(e => e.categoryId === categoryId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDragEnd = (expenseId: string, info: PanInfo) => {
    if (info.offset.x < -100) {
      setSwipedExpenseId(expenseId);
    } else {
      setSwipedExpenseId(null);
    }
  };

  const handleDelete = (expenseId: string) => {
    deleteExpense(expenseId);
    setSwipedExpenseId(null);
  };

  return (
    <AnimatePresence>
      {categoryId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70" />

          {/* Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-[var(--bg-terminal)] border-t border-[var(--text-primary)]
                      max-h-[70vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--text-primary)]/30">
              <button
                onClick={onClose}
                className="text-[var(--text-primary)] font-mono text-sm"
              >
                CLOSE
              </button>
              <span className="text-[var(--text-primary)] font-mono text-sm font-bold">
                {category?.name} HISTORY
              </span>
              <div className="w-12" />
            </div>

            {/* Expense List */}
            <div className="flex-1 overflow-y-auto">
              {categoryExpenses.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-[var(--text-primary)] opacity-50 font-mono text-sm">
                    No expenses this month
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--text-primary)]/20">
                  {categoryExpenses.map(expense => (
                    <div key={expense.id} className="relative overflow-hidden">
                      {/* Delete button (revealed on swipe) */}
                      <div className="absolute right-0 top-0 bottom-0 flex items-center">
                        <motion.button
                          onClick={() => handleDelete(expense.id)}
                          className="h-full w-24 bg-red-600 text-white font-mono text-base font-bold
                                    flex items-center justify-center"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: swipedExpenseId === expense.id ? 1 : 0 }}
                        >
                          DELETE
                        </motion.button>
                      </div>

                      {/* Expense item */}
                      <motion.div
                        drag="x"
                        dragConstraints={{ left: -120, right: 0 }}
                        dragElastic={0.1}
                        onDragEnd={(_, info) => handleDragEnd(expense.id, info)}
                        animate={{ x: swipedExpenseId === expense.id ? -100 : 0 }}
                        className="p-4 bg-[var(--bg-terminal)] flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="text-sm font-mono text-[var(--text-primary)]">
                            {formatDate(expense.date)}
                          </div>
                          {expense.description && (
                            <div className="text-xs font-mono text-[var(--text-primary)] opacity-50 mt-1">
                              {expense.description}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-mono font-bold text-[var(--text-primary)]">
                            {CURRENCIES[expense.currency].symbol}
                            {formatSmartAmount(expense.amount)}
                          </div>
                          <div className="text-xs font-mono text-[var(--text-primary)] opacity-50">
                            ≈ ${formatSmartAmount(expense.amount * expense.usdRate)}
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tip */}
            <div className="p-3 border-t border-[var(--text-primary)]/30 text-center">
              <span className="text-xs font-mono text-[var(--text-primary)] opacity-50">
                Swipe left to delete
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
