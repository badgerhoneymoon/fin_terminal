'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBudget } from '@/lib/budget-context';

export function Footer() {
  const { state, exportData, importData } = useBudget();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lastSaveTime, setLastSaveTime] = useState<Date>(new Date());
  const [importError, setImportError] = useState<string | null>(null);

  // Update last save time when state changes
  useEffect(() => {
    setLastSaveTime(new Date());
  }, [state]);

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      importData(text);
      setImportError(null);
      
      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch {
      setImportError('Invalid JSON file format');
      setTimeout(() => setImportError(null), 3000);
    }
  };

  const handleExport = () => {
    exportData();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ago`;
    } else if (diffSeconds > 0) {
      return `${diffSeconds}s ago`;
    } else {
      return 'just now';
    }
  };

  return (
    <footer className="flex items-center justify-between p-6 border-t border-[var(--text-primary)] text-sm">
      {/* Left side - Import/Export */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleExport}
          className="btn-secondary text-xs px-3 py-1"
          title="Export budget data as JSON"
        >
          [Export JSON]
        </button>
        
        <button
          onClick={handleImportClick}
          className="btn-secondary text-xs px-3 py-1"
          title="Import budget data from JSON file"
        >
          [Import]
        </button>
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleImport}
          className="hidden"
          aria-label="Import JSON file"
        />
      </div>

      {/* Center - Separator */}
      <div className="text-[var(--text-primary)] opacity-60">
        ·
      </div>

      {/* Right side - Last save indicator */}
      <div className="flex items-center gap-2 text-[var(--text-primary)] opacity-80">
        <span>Last save</span>
        <motion.span
          key={lastSaveTime.toISOString()}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="font-mono"
        >
          {formatTimeAgo(lastSaveTime)}
        </motion.span>
      </div>

      {/* Error Toast */}
      <AnimatePresence>
        {importError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-4 left-4 glass-panel border border-red-500 px-4 py-2 z-50"
          >
            <span className="text-red-400 font-bold">{importError}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </footer>
  );
} 