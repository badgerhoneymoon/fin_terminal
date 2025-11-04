'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChecklistItem {
  id: string;
  category: string;
  rule: string;
  amount: string;
}

const checklistItems: ChecklistItem[] = [
  {
    id: 'stability',
    category: 'A. Stability Fund',
    rule: '5% of income',
    amount: '$125'
  },
  {
    id: 'russian-card',
    category: 'B. Russian Credit Card',
    rule: '5% + last-cycle',
    amount: '$125 + X'
  },
  {
    id: 'boa-card',
    category: 'C. BoA Card',
    rule: 'Last-cycle',
    amount: 'X'
  },
  {
    id: 'itx-5080',
    category: 'D. ITX 5080',
    rule: 'Fixed',
    amount: '$500'
  },
  {
    id: 'ps5-pro',
    category: 'E. PS5 Pro',
    rule: 'Weighted',
    amount: '$165'
  },
  {
    id: 'ps-vr2',
    category: 'F. PS VR2',
    rule: 'Weighted',
    amount: '$107'
  },
  {
    id: 'asus-monitor',
    category: 'G. ASUS Monitor',
    rule: 'Weighted',
    amount: '$329'
  }
];

interface ChecklistSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function ChecklistSidebar({ isOpen, onToggle }: ChecklistSidebarProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={`
          fixed right-0 top-1/2 -translate-y-1/2 z-40
          px-2 py-4 bg-black border border-[var(--text-primary)]
          text-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-black
          transition-all duration-200 ${isOpen ? 'translate-x-0' : 'translate-x-0'}
        `}
        title={isOpen ? 'Hide Checklist' : 'Show Checklist'}
        style={{ writingMode: 'vertical-rl' }}
      >
        {isOpen ? '◀ CHECKLIST' : '▶ CHECKLIST'}
      </button>

      {/* Sidebar Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-96 bg-black border-l border-[var(--text-primary)] z-30 overflow-y-auto"
            style={{ boxShadow: '-10px 0 30px rgba(0,255,144,0.1)' }}
          >
            <div className="p-6">
              {/* Header */}
              <div className="mb-6">
                <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">
                  💰 FINANCIAL CHECKLIST
                </h2>
                <div className="text-xs text-[var(--text-primary)] opacity-60">
                  Base: $2,500 per cycle
                </div>
                <div className="text-xs text-[var(--text-primary)] opacity-80 mt-2">
                  Progress: {checkedItems.size} / {checklistItems.length}
                </div>
              </div>

              {/* Checklist Items */}
              <div className="space-y-3">
                {checklistItems.map((item) => (
                  <label
                    key={item.id}
                    className={`
                      block p-3 border border-[var(--text-primary)]
                      hover:bg-[var(--text-primary)]/10 transition-all cursor-pointer
                      ${checkedItems.has(item.id) ? 'opacity-50' : ''}
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={checkedItems.has(item.id)}
                        onChange={() => toggleCheck(item.id)}
                        className="mt-1 w-4 h-4 accent-green-500 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="font-mono font-semibold text-sm text-[var(--text-primary)]">
                          {item.category}
                        </div>
                        <div className="text-xs text-[var(--text-primary)] opacity-60 mt-1">
                          {item.rule}
                        </div>
                        <div className="text-sm font-mono font-bold text-green-400 mt-1">
                          {item.amount}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Clear Button */}
              <button
                onClick={() => setCheckedItems(new Set())}
                className="mt-6 w-full px-4 py-2 border border-[var(--text-primary)] text-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-black transition-all text-xs font-mono"
              >
                CLEAR ALL
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}