'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useBudget } from '@/lib/context/budget-context';

interface BucketMenuProps {
  bucketId: string;
  onReset: (bucketId: string) => void;
}

export function BucketMenu({ bucketId, onReset }: BucketMenuProps) {
  const { deleteBucket } = useBudget();
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showMenu) {
        setShowMenu(false);
        setShowDeleteConfirm(false);
      }
    };

    if (showMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showMenu]);

  const handleDelete = () => {
    deleteBucket(bucketId);
    setShowDeleteConfirm(false);
    setShowMenu(false);
  };

  const updateMenuPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        left: rect.right - 192 // 192px = w-48 menu width
      });
    }
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        className={`text-[var(--text-primary)] hover:text-[var(--text-accent)] transition-colors ${showMenu ? 'text-[var(--text-accent)]' : ''}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          updateMenuPosition();
          setShowMenu(!showMenu);
        }}
        title="Bucket options"
      >
        ⋯
      </button>

      {/* Menu Dropdown - Rendered via Portal */}
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {showMenu && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-[100]"
                onClick={() => {
                  setShowMenu(false);
                  setShowDeleteConfirm(false);
                }}
              />

              {/* Menu */}
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                style={{
                  position: 'fixed',
                  top: `${menuPosition.top}px`,
                  left: `${menuPosition.left}px`
                }}
                className="w-48 bg-black border border-[var(--text-primary)] z-[101]"
                onClick={(e) => e.stopPropagation()}
              >
              <div className="p-2 space-y-1">
                {/* Delete Section */}
                {showDeleteConfirm ? (
                  <div className="px-3 py-2 space-y-2">
                    <div className="text-xs text-red-400">Delete this bucket and all its transactions?</div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDelete}
                        className="flex-1 text-xs bg-red-600/20 hover:bg-red-600/40 text-red-400 py-1 rounded transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 text-xs bg-[var(--text-primary)]/20 hover:bg-[var(--text-primary)]/40 text-[var(--text-primary)] py-1 rounded transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="px-3 py-2">
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full text-left text-xs hover:bg-red-600/20 hover:text-red-400 transition-colors py-1 text-[var(--text-primary)]"
                    >
                      Delete Bucket
                    </button>
                  </div>
                )}

                {/* Reset Button */}
                <div className="px-3 py-2 border-t border-[var(--text-primary)]/30">
                  <button
                    onClick={() => {
                      onReset(bucketId);
                      setShowMenu(false);
                    }}
                    className="w-full text-left text-xs hover:bg-yellow-600/20 hover:text-yellow-400 transition-colors py-1 text-[var(--text-primary)]"
                  >
                    Reset to Default
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
      )}
    </div>
  );
} 