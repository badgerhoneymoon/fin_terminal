'use client';

import { motion } from 'framer-motion';
import { Transaction, Bucket, CURRENCIES } from '@/lib/types';
import { useBudget } from '@/lib/context/budget-context';
import { formatSmartAmount } from '@/lib/utils';
import { useState } from 'react';

interface TransactionItemProps {
  transaction: Transaction;
  bucket: Bucket;
  index: number;
  isLatest: boolean;
}

export function TransactionItem({ 
  transaction, 
  bucket, 
  index, 
  isLatest 
}: TransactionItemProps) {
  const { state, deleteTransaction, updateTransaction } = useBudget();
  const currency = CURRENCIES[bucket.currency];
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const formatDate = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const getOriginalChipInfo = (transaction: Transaction) => {
    // Use stored original chip info if available, otherwise estimate
    if (transaction.originalChipAmount && transaction.originalChipCurrency && transaction.usdRateAtTime) {
      return {
        usdAmount: transaction.originalChipAmount * transaction.usdRateAtTime,
        originalCurrency: transaction.originalChipCurrency,
        originalAmount: transaction.originalChipAmount
      };
    }
    
    // Fallback to estimation
    const bucketRate = state.exchangeRates.rates[bucket.currency] || 1;
    const usdAmount = transaction.amount * bucketRate;
    
    return {
      usdAmount,
      originalCurrency: bucket.currency,
      originalAmount: transaction.amount
    };
  };

  const getCleanNumberForEdit = (amount: number, currency: string): string => {
    // Smart rounding without formatting (no commas, suitable for input)
    if (currency === 'BTC') {
      if (amount >= 1) return amount.toFixed(4);
      else if (amount >= 0.01) return amount.toFixed(4);
      else if (amount >= 0.001) return amount.toFixed(5);
      else return amount.toFixed(6);
    }
    
    if (amount >= 100) {
      return Math.round(amount).toString();
    } else if (amount >= 10) {
      return (Math.round(amount * 10) / 10).toString();
    } else if (amount >= 1) {
      return amount.toFixed(2);
    } else {
      return amount < 0.01 && amount > 0
        ? amount.toFixed(6).replace(/\.?0+$/, '')
        : amount.toFixed(2);
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction.id);
    setEditValue(getCleanNumberForEdit(transaction.amount, bucket.currency));
  };

  const handleSaveEdit = () => {
    if (editingTransaction && editValue) {
      const newAmount = parseFloat(editValue);
      if (!isNaN(newAmount) && newAmount > 0) {
        updateTransaction(editingTransaction, newAmount);
      }
    }
    setEditingTransaction(null);
    setEditValue('');
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleSaveEdit();
  };

  const handleCancelEdit = () => {
    setEditingTransaction(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const chipInfo = getOriginalChipInfo(transaction);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`
        p-3 border border-[var(--text-primary)] border-opacity-30 
        ${isLatest ? 'bg-[var(--text-accent)]/10 border-[var(--text-accent)]' : 'bg-black/20'}
        hover:bg-[var(--text-primary)]/5 transition-colors
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`
            w-2 h-2 rounded-full 
            ${bucket.type === 'debt' 
              ? (transaction.type === 'add' ? 'bg-red-400' : 'bg-green-400')
              : (transaction.type === 'add' ? 'bg-green-400' : 'bg-red-400')
            }
          `} />
          <div>
            <div className="text-white font-medium">
              {bucket.type === 'debt' 
                ? (transaction.type === 'add' ? '+' : '-')
                : (transaction.type === 'add' ? '+' : '-')
              }
              {editingTransaction === transaction.id ? (
                <input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="bg-black border border-[var(--text-accent)] text-white px-2 py-1 w-20 text-sm rounded focus:outline-none focus:ring-1 focus:ring-[var(--text-accent)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  autoFocus
                />
              ) : (
                <span 
                  className="cursor-pointer hover:text-[var(--text-accent)] transition-colors"
                  onClick={() => handleEditTransaction(transaction)}
                  title="Click to edit amount"
                >
                  {currency.symbol}{formatSmartAmount(transaction.amount, bucket.currency)}
                </span>
              )}
            </div>
            <div className="text-xs text-[var(--text-primary)] opacity-60">
              {formatDate(transaction.timestamp)}
              {bucket.type === 'debt' && (
                <span className={`ml-2 font-medium ${
                  transaction.type === 'add' ? 'text-red-400' : 'text-green-400'
                }`}>
                  {transaction.type === 'add' ? '(Spending ↗)' : '(Payment ↘)'}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm text-[var(--text-primary)] opacity-70">
              USD: ${formatSmartAmount(chipInfo.usdAmount, 'USD')}
            </div>
            <div className="text-xs text-[var(--text-primary)] opacity-50">
              {chipInfo.originalCurrency !== bucket.currency ? (
                `From ${CURRENCIES[chipInfo.originalCurrency].symbol}${formatSmartAmount(chipInfo.originalAmount, chipInfo.originalCurrency)} ${chipInfo.originalCurrency}`
              ) : (
                'Original Currency'
              )}
            </div>
          </div>
          
          {editingTransaction === transaction.id ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleSaveClick}
                className="w-8 h-8 flex items-center justify-center text-lg text-green-400 hover:text-green-300 hover:bg-green-400/20 transition-colors opacity-80 hover:opacity-100 rounded-sm"
                title="Save changes"
              >
                ✓
              </button>
              <button
                onClick={handleCancelEdit}
                className="w-8 h-8 flex items-center justify-center text-lg text-gray-400 hover:text-gray-300 hover:bg-gray-400/20 transition-colors rounded-sm"
                title="Cancel edit"
              >
                ×
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleEditTransaction(transaction)}
                className="w-8 h-8 flex items-center justify-center text-lg text-[var(--text-accent)] hover:text-[var(--text-accent)] hover:bg-purple-500/20 transition-colors opacity-70 hover:opacity-100 rounded-sm"
                title="Edit Transaction"
              >
                ✎
              </button>
              <button
                onClick={() => deleteTransaction(transaction.id)}
                className="w-8 h-8 flex items-center justify-center text-lg text-red-400 hover:text-red-300 hover:bg-red-400/20 transition-colors opacity-70 hover:opacity-100 rounded-sm"
                title="Delete Transaction"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
} 