'use client';

import { motion } from 'framer-motion';
import { useExpense } from '@/lib/context/expense-context';
import { ExpenseCategory } from '@/lib/types';
import { formatSmartAmount } from '@/lib/utils';

interface CategoryCardProps {
  category: ExpenseCategory;
  onClick: () => void;
}

export function CategoryCard({ category, onClick }: CategoryCardProps) {
  const { getCategorySpent, getCategoryExtrapolation, getProgressColor } = useExpense();

  const spent = getCategorySpent(category.id);
  const percentage = Math.min((spent / category.monthlyLimit) * 100, 100);
  const color = getProgressColor(spent, category.monthlyLimit);
  const extrapolation = category.type === 'variable' ? getCategoryExtrapolation(category.id) : null;

  const colorClasses = {
    green: 'bg-[var(--text-primary)]',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500'
  };

  const textColorClasses = {
    green: 'text-[var(--text-primary)]',
    yellow: 'text-yellow-500',
    red: 'text-red-500'
  };

  return (
    <motion.button
      onClick={onClick}
      className="w-full p-3 border border-[var(--text-primary)] bg-transparent
                hover:bg-[var(--text-primary)]/5 transition-colors duration-200
                text-left"
      whileTap={{ scale: 0.98 }}
    >
      <div className="space-y-2">
        {/* Category name and amount */}
        <div className="flex justify-between items-baseline">
          <span className="text-sm font-mono font-medium text-[var(--text-primary)]">
            {category.name}
          </span>
          <span className={`text-sm font-mono font-bold ${textColorClasses[color]}`}>
            ${formatSmartAmount(spent)} / ${formatSmartAmount(category.monthlyLimit)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-[var(--text-primary)]/20 border border-[var(--text-primary)]/50">
          <motion.div
            className={`h-full ${colorClasses[color]}`}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>

        {/* Extrapolation for variable categories (Food) */}
        {extrapolation !== null && (
          <div className="text-xs font-mono text-[var(--text-primary)] opacity-70">
            At this rate:{' '}
            <span className={textColorClasses[getProgressColor(extrapolation, category.monthlyLimit)]}>
              ${formatSmartAmount(extrapolation)}
            </span>
            {' '}by month end
          </div>
        )}
      </div>
    </motion.button>
  );
}
