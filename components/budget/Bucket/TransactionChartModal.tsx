'use client';

import { Transaction, Bucket as BucketType } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TransactionChart } from './TransactionChart';

interface TransactionChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  bucket: BucketType;
  transactions: Transaction[];
}

export function TransactionChartModal({ 
  isOpen, 
  onClose, 
  bucket, 
  transactions 
}: TransactionChartModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl glass-panel border-2 border-[var(--text-primary)]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white uppercase">
            {bucket.name} • Transaction Chart
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <div className="mb-4 text-sm text-[var(--text-primary)] opacity-70">
            Showing {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} over time
          </div>
          <TransactionChart transactions={transactions} bucket={bucket} />
        </div>
      </DialogContent>
    </Dialog>
  );
} 