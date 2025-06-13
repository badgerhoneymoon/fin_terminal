'use client';

import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Transaction, Bucket, CURRENCIES } from '@/lib/types';
import { useBudget } from '@/lib/budget-context';
import { formatSmartAmount } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface TransactionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  bucket: Bucket;
  transactions: Transaction[];
}

export function TransactionHistoryModal({ 
  isOpen, 
  onClose, 
  bucket, 
  transactions 
}: TransactionHistoryModalProps) {
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

  const calculatePercentageChange = () => {
    if (transactions.length < 2) return null;
    
    const latest = transactions[0];
    const previous = transactions[1];
    
    // Only show percentage when comparing the same transaction types
    // Comparing spending vs payment doesn't make sense
    if (latest.type !== previous.type) {
      return null; // Don't show percentage for different transaction types
    }
    
    // Calculate raw percentage change
    const rawChange = ((latest.amount - previous.amount) / previous.amount) * 100;
    
    // For credit cards (debt), both transactions are now the same type
    if (bucket.type === 'debt') {
      if (latest.type === 'add') {
        // Both are spending transactions - higher amount = worse
        return rawChange;
      } else {
        // Both are payment transactions - higher amount = better
        return -rawChange; // Invert for payments (higher payment = better)
      }
    }
    
    // For fund buckets, higher is always better
    return rawChange;
  };

  const percentChange = calculatePercentageChange();

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction.id);
    setEditValue(transaction.amount.toString());
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

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] bg-black border border-[var(--text-primary)]">
        <DialogHeader>
          <DialogTitle className="text-white font-mono text-lg">
            ▌ TRANSACTION HISTORY: {bucket.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex items-center gap-6 p-4 bg-black/40 border border-[var(--text-primary)] border-opacity-30">
            <div>
              <div className="text-xs text-[var(--text-primary)] opacity-70 uppercase">Total Transactions</div>
              <div className="text-lg font-bold text-white">{transactions.length}</div>
            </div>
            {transactions.length > 0 && (
              <div>
                <div className="text-xs text-[var(--text-primary)] opacity-70 uppercase">Most Recent</div>
                <div className="text-lg font-bold text-white">
                  {currency.symbol}{formatSmartAmount(transactions[0].amount, bucket.currency)}
                  {percentChange && (
                    <span className={`ml-2 text-sm ${
                      bucket.type === 'debt' 
                        ? (percentChange > 0 ? 'text-red-400' : 'text-green-400')
                        : (percentChange > 0 ? 'text-green-400' : 'text-red-400')
                    }`}>
                      {percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}%
                      {bucket.type === 'debt' && (
                        <span className="ml-1 text-xs opacity-70">
                          {percentChange > 0 ? '↗' : '↘'}
                        </span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Transaction List */}
          <div className={`${transactions.length > 3 ? 'max-h-64 overflow-y-auto' : ''}`}>
            {transactions.length === 0 ? (
              <div className="text-center text-[var(--text-primary)] opacity-50 py-8">
                No transactions found for this bucket
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((transaction, index) => {
                  const chipInfo = getOriginalChipInfo(transaction);
                  const isLatest = index === 0;
                  
                  return (
                    <motion.div
                      key={transaction.id}
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
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 