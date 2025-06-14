'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Transaction, Bucket } from '@/lib/types';
import { useEffect } from 'react';
import { TransactionItem } from './TransactionItem';
import { TransactionSummary } from './TransactionSummary';

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
          <TransactionSummary 
            transactions={transactions} 
            bucket={bucket} 
          />

          {/* Transaction List */}
          <div className={`${transactions.length > 3 ? 'max-h-64 overflow-y-auto' : ''}`}>
            {transactions.length === 0 ? (
              <div className="text-center text-[var(--text-primary)] opacity-50 py-8">
                No transactions found for this bucket
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((transaction, index) => (
                  <TransactionItem
                    key={transaction.id}
                    transaction={transaction}
                    bucket={bucket}
                    index={index}
                    isLatest={index === 0}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 