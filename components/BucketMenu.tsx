'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface BucketMenuProps {
  bucketId: string;
  onReset: (bucketId: string) => void;
}

export function BucketMenu({ bucketId, onReset }: BucketMenuProps) {
  const [showMenu, setShowMenu] = useState(false);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showMenu) {
        setShowMenu(false);
      }
    };
    
    if (showMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showMenu]);

  return (
    <div className="relative">
      <button
        className={`text-[var(--text-primary)] hover:text-[var(--text-accent)] transition-colors ${showMenu ? 'text-[var(--text-accent)]' : ''}`}
        onClick={(e) => {
          e.preventDefault();
          setShowMenu(!showMenu);
        }}
        title="Bucket options"
      >
        ⋯
      </button>

      {/* Menu Dropdown */}
      <AnimatePresence>
        {showMenu && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />
            
            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-48 bg-black border border-[var(--text-primary)] z-50"
            >
              <div className="p-2 space-y-1">
                {/* Reset Button */}
                <div className="px-3 py-2">
                  <button
                    onClick={() => {
                      onReset(bucketId);
                      setShowMenu(false);
                    }}
                    className="w-full text-left text-xs hover:bg-red-600/20 hover:text-red-400 transition-colors py-1 text-[var(--text-primary)]"
                  >
                    🔄 Reset to Default
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
} 