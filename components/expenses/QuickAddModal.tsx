'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useExpense } from '@/lib/context/expense-context';
import { Currency, CURRENCIES, EXPENSE_CURRENCIES } from '@/lib/types';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'category' | 'amount';

export function QuickAddModal({ isOpen, onClose }: QuickAddModalProps) {
  const { state, addExpense } = useExpense();
  const [step, setStep] = useState<Step>('category');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('VND');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [description, setDescription] = useState('');

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setStep('amount');
  };

  const handleNumberPress = (num: string) => {
    // Allow multiple decimals if separated by +
    if (num === '.') {
      const parts = amount.split('+');
      const lastPart = parts[parts.length - 1];
      if (lastPart.includes('.')) return;
    }
    if (amount === '0' && num !== '.' && num !== '+') {
      setAmount(num);
    } else {
      setAmount(prev => prev + num);
    }
  };

  const handlePlusPress = () => {
    // Don't allow + at start or after another +
    if (!amount || amount.endsWith('+')) return;
    setAmount(prev => prev + '+');
  };

  const handleBackspace = () => {
    setAmount(prev => prev.slice(0, -1));
  };

  const handleCurrencyToggle = () => {
    const currentIndex = EXPENSE_CURRENCIES.indexOf(currency);
    const nextIndex = (currentIndex + 1) % EXPENSE_CURRENCIES.length;
    setCurrency(EXPENSE_CURRENCIES[nextIndex]);
  };

  // Calculate sum if expression contains +
  const calculateTotal = (expr: string): number => {
    if (!expr) return 0;
    // Remove trailing + if present
    const cleanExpr = expr.endsWith('+') ? expr.slice(0, -1) : expr;
    return cleanExpr.split('+').reduce((sum, part) => sum + (parseFloat(part) || 0), 0);
  };

  const handleSubmit = () => {
    const total = calculateTotal(amount);
    if (!selectedCategory || !amount || total <= 0) return;

    addExpense(selectedCategory, total, currency, description || undefined, selectedDate);
    // Reset for next expense but stay open
    setStep('category');
    setSelectedCategory(null);
    setAmount('');
    setDescription('');
    // Keep currency and date - likely same for batch entry
  };

  const handleClose = () => {
    setStep('category');
    setSelectedCategory(null);
    setAmount('');
    setCurrency('VND');
    setSelectedDate(new Date());
    setDescription('');
    onClose();
  };

  // Date helpers
  const formatDateDisplay = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'TODAY';
    if (date.toDateString() === yesterday.toDateString()) return 'YESTERDAY';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  };

  const adjustDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    // Don't allow future dates
    if (newDate <= new Date()) {
      setSelectedDate(newDate);
    }
  };

  const handleBack = () => {
    if (step === 'amount') {
      setStep('category');
      setAmount('');
    } else {
      handleClose();
    }
  };

  const selectedCategoryData = state.categories.find(c => c.id === selectedCategory);

  // Format amount with comma separators for display (no spaces)
  const formatDisplayAmount = (value: string) => {
    if (!value) return '0';
    // Handle expressions with +
    if (value.includes('+')) {
      return value.split('+').map(part => formatSingleNumber(part)).join('+');
    }
    return formatSingleNumber(value);
  };

  const formatSingleNumber = (value: string) => {
    if (!value) return '0';
    const parts = value.split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.length > 1 ? `${integerPart}.${parts[1]}` : integerPart;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center"
          onClick={handleClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70" />

          {/* Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-[var(--bg-terminal)] border-t border-[var(--text-primary)]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--text-primary)]/30">
              <button
                onClick={handleBack}
                className="text-[var(--text-primary)] font-mono text-sm"
              >
                {step === 'category' ? 'CANCEL' : '← BACK'}
              </button>
              <span className="text-[var(--text-primary)] font-mono text-sm font-bold">
                {step === 'category' ? 'SELECT CATEGORY' : selectedCategoryData?.name}
              </span>
              <div className="w-16" /> {/* Spacer for centering */}
            </div>

            {/* Content */}
            <div className="p-4">
              {step === 'category' ? (
                /* Category Selection */
                <div className="grid grid-cols-2 gap-3">
                  {state.categories.map(category => (
                    <motion.button
                      key={category.id}
                      onClick={() => handleCategorySelect(category.id)}
                      className="p-4 border border-[var(--text-primary)] text-[var(--text-primary)]
                                font-mono text-sm hover:bg-[var(--text-primary)] hover:text-[var(--bg-terminal)]
                                transition-colors duration-200"
                      whileTap={{ scale: 0.95 }}
                    >
                      {category.name}
                    </motion.button>
                  ))}
                </div>
              ) : (
                /* Amount Entry with Numpad */
                <div className="space-y-4">
                  {/* Amount Display */}
                  <div className="text-center py-4 px-2 border border-[var(--text-primary)] overflow-hidden">
                    <div
                      className="font-mono font-bold text-[var(--text-primary)] break-all"
                      style={{ fontSize: amount.length > 20 ? '1.25rem' : amount.length > 12 ? '1.5rem' : '1.875rem' }}
                    >
                      {CURRENCIES[currency].symbol}
                      {formatDisplayAmount(amount)}
                    </div>
                    {amount.includes('+') && (
                      <div className="text-sm font-mono text-[var(--text-primary)] opacity-60 mt-1">
                        = {CURRENCIES[currency].symbol}{formatDisplayAmount(calculateTotal(amount).toString())}
                      </div>
                    )}
                  </div>

                  {/* Date and Currency Row */}
                  <div className="flex gap-2">
                    {/* Date Selector */}
                    <div className="flex-1 flex border border-[var(--text-primary)]">
                      <button
                        onClick={() => adjustDate(-1)}
                        className="px-3 text-[var(--text-primary)] font-mono text-lg
                                  hover:bg-[var(--text-primary)]/10 transition-colors"
                      >
                        ←
                      </button>
                      <div className="flex-1 p-2 text-center text-[var(--text-primary)] font-mono text-sm">
                        {formatDateDisplay(selectedDate)}
                      </div>
                      <button
                        onClick={() => adjustDate(1)}
                        className="px-3 text-[var(--text-primary)] font-mono text-lg
                                  hover:bg-[var(--text-primary)]/10 transition-colors
                                  disabled:opacity-30"
                        disabled={selectedDate.toDateString() === new Date().toDateString()}
                      >
                        →
                      </button>
                    </div>

                    {/* Currency Toggle */}
                    <button
                      onClick={handleCurrencyToggle}
                      className="px-4 border border-[var(--text-primary)] text-[var(--text-primary)]
                                font-mono text-sm hover:bg-[var(--text-primary)]/10 transition-colors"
                    >
                      {currency}
                    </button>
                  </div>

                  {/* Description Input */}
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="DESCRIPTION (OPTIONAL)"
                    className="w-full p-3 border border-[var(--text-primary)] bg-transparent
                              text-[var(--text-primary)] font-mono text-sm
                              placeholder:text-[var(--text-primary)]/40
                              focus:outline-none focus:bg-[var(--text-primary)]/5"
                  />

                  {/* Numpad */}
                  <div className="grid grid-cols-4 gap-2">
                    {['1', '2', '3', '+', '4', '5', '6', '.', '7', '8', '9', '⌫', null, '0', null, null].map((key, idx) => (
                      key ? (
                        <motion.button
                          key={key}
                          onClick={() => {
                            if (key === '⌫') handleBackspace();
                            else if (key === '+') handlePlusPress();
                            else handleNumberPress(key);
                          }}
                          className={`p-4 border border-[var(--text-primary)] text-[var(--text-primary)]
                                    font-mono hover:bg-[var(--text-primary)]/10
                                    active:bg-[var(--text-primary)] active:text-[var(--bg-terminal)]
                                    transition-colors duration-100
                                    ${key === '⌫' ? 'text-3xl' : 'text-xl'}`}
                          whileTap={{ scale: 0.95 }}
                        >
                          {key}
                        </motion.button>
                      ) : (
                        <div key={`empty-${idx}`} />
                      )
                    ))}
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    onClick={handleSubmit}
                    disabled={!amount || parseFloat(amount) <= 0}
                    className="w-full p-4 bg-[var(--text-primary)] text-[var(--bg-terminal)]
                              font-mono text-lg font-bold disabled:opacity-30 disabled:cursor-not-allowed
                              hover:opacity-90 transition-opacity"
                    whileTap={{ scale: 0.98 }}
                  >
                    ADD EXPENSE
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
