'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useBudget } from '@/lib/context/budget-context';
import { useState, useEffect } from 'react';
import { AddBucketModal } from '@/components/budget/AddBucketModal';
import { CurrencyConverterModal } from '@/components/budget/CurrencyConverterModal';

interface HeaderProps {
  layoutMode?: 'individual' | 'compact';
  onLayoutModeChange?: (mode: 'individual' | 'compact') => void;
}

export function Header({ layoutMode = 'compact', onLayoutModeChange }: HeaderProps = {}) {
  const { state, toggleSound, resetState } = useBudget();
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  
  // Terminal animation states
  const [typedText, setTypedText] = useState('');
  const [showCaret, setShowCaret] = useState(true);
  const [hasTyped, setHasTyped] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const fullText = 'BUDGET DROP';

  // Check if typing animation has run in this session
  useEffect(() => {
    const hasTypedFlag = sessionStorage.getItem('budgetdrop.hasTyped');
    if (!hasTypedFlag) {
      // Start typing animation
      let currentIndex = 0;
      const typeTimer = setInterval(() => {
        if (currentIndex <= fullText.length) {
          setTypedText(fullText.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(typeTimer);
          setHasTyped(true);
          sessionStorage.setItem('budgetdrop.hasTyped', 'true');
        }
      }, 40);

      return () => clearInterval(typeTimer);
    } else {
      setTypedText(fullText);
      setHasTyped(true);
    }
  }, []);

  // Blinking caret effect
  useEffect(() => {
    const caretTimer = setInterval(() => {
      setShowCaret(prev => !prev);
    }, 500);

    return () => clearInterval(caretTimer);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showSettingsDropdown) {
        setShowSettingsDropdown(false);
      }
    };
    
    if (showSettingsDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showSettingsDropdown]);

  // Handle title click interactions
  const handleTitleClick = () => {
    setIsHighContrast(!isHighContrast);
    if (isHighContrast) {
      document.body.classList.remove('high-contrast');
    } else {
      document.body.classList.add('high-contrast');
    }
  };

  const handleTitleDoubleClick = () => {
    // Reset scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Focus amount input if it exists
    const amountInput = document.querySelector('input[placeholder*="Amount"]') as HTMLInputElement;
    if (amountInput) {
      setTimeout(() => {
        amountInput.focus();
        amountInput.select();
      }, 300);
    }
  };

  return (
    <header className="flex items-start justify-between p-6 border-b border-[var(--text-primary)] relative">
      {/* Scanline animation overlay */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--text-primary)] to-transparent opacity-10 h-1"
          initial={{ x: '-100%', y: 0 }}
          animate={{ x: '200%', y: '100%' }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      </div>

      {/* Left side - Title */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1">
          <motion.h1 
            className="text-2xl font-bold text-white tracking-wider cursor-pointer select-none relative"
            style={{
              textShadow: '0 0 6px #00ff90',
              filter: 'drop-shadow(0 0 6px #00ff90)'
            }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={handleTitleClick}
            onDoubleClick={handleTitleDoubleClick}
            title="Click: Toggle high-contrast | Double-click: Reset scroll & focus input"
          >
            {hasTyped ? fullText : typedText}
            {showCaret && (
              <motion.span
                className="ml-3 text-[var(--text-primary)]"
                animate={{ opacity: showCaret ? 1 : 0 }}
                transition={{ duration: 0.1 }}
              >
                ▊
              </motion.span>
            )}
          </motion.h1>
        </div>

        {/* Tagline */}
        <motion.div
          className="text-xs text-[var(--text-primary)] opacity-50 font-mono"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 0.5, y: 0 }}
          transition={{ delay: hasTyped ? 0 : 2 }}
        >
          personal finance console v1.0
        </motion.div>
      </div>

      {/* Right side - Controls */}
      <div className="flex items-center gap-3">
        {/* Add Bucket Button */}
        <AddBucketModal />

        {/* Currency Converter */}
        <CurrencyConverterModal />

        {/* Layout Toggle */}
        {onLayoutModeChange && (
          <div className="flex border border-[var(--text-primary)] text-xs h-10">
            <button
              onClick={() => onLayoutModeChange('compact')}
              className={`px-4 py-2 h-full transition-all duration-300 font-mono flex items-center font-semibold ${
                layoutMode === 'compact'
                  ? 'bg-[#C400C4] text-white'
                  : 'text-[var(--text-primary)] hover:brightness-110'
              }`}
            >
              COMPACT
            </button>
            <button
              onClick={() => onLayoutModeChange('individual')}
              className={`px-4 py-2 h-full transition-all duration-300 font-mono flex items-center font-semibold ${
                layoutMode === 'individual'
                  ? 'bg-[#C400C4] text-white'
                  : 'text-[var(--text-primary)] hover:brightness-110'
              }`}
            >
              DETAILED
            </button>
          </div>
        )}

        {/* Sound Toggle */}
        <button
          onClick={toggleSound}
          className={`
            w-10 h-10 flex items-center justify-center text-sm
            border border-[var(--text-primary)] transition-all duration-200
            focusable hover:bg-[var(--text-primary)] hover:text-black
            ${state.soundEnabled ? 'bg-[var(--text-primary)] text-black' : 'text-[var(--text-primary)]'}
          `}
          title={`Sound ${state.soundEnabled ? 'ON' : 'OFF'}`}
          aria-label={`Toggle sound ${state.soundEnabled ? 'off' : 'on'}`}
        >
          {state.soundEnabled ? '🔊' : '🔇'}
        </button>

        {/* Exchange Rates Indicator */}
        <div className="flex items-center gap-2 h-10 px-3 border border-[var(--text-primary)] text-xs text-[var(--text-primary)]">
          <div className="font-mono font-semibold">FX:</div>
          <div 
            className={`w-2 h-2 rounded-full ${
              state.exchangeRates.status === 'success' ? 'bg-emerald-400' :
              state.exchangeRates.status === 'cached' ? 'bg-orange-400' :
              state.exchangeRates.status === 'error' ? 'bg-red-400' :
              'bg-yellow-400'
            }`}
            style={{
              boxShadow: state.exchangeRates.status === 'success' 
                ? '0 0 6px #34d399, 0 0 10px #34d399' 
                : state.exchangeRates.status === 'cached'
                ? '0 0 6px #fb923c, 0 0 10px #fb923c'
                : state.exchangeRates.status === 'error'
                ? '0 0 6px #f87171, 0 0 10px #f87171'
                : '0 0 6px #fbbf24, 0 0 10px #fbbf24',
              filter: state.exchangeRates.status === 'success' 
                ? 'drop-shadow(0 0 3px #34d399)' 
                : state.exchangeRates.status === 'cached'
                ? 'drop-shadow(0 0 3px #fb923c)'
                : state.exchangeRates.status === 'error'
                ? 'drop-shadow(0 0 3px #f87171)'
                : 'drop-shadow(0 0 3px #fbbf24)'
            }}
            title={
              state.exchangeRates.status === 'success' 
                ? `Exchange rates loaded (${Object.keys(state.exchangeRates.rates).length} currencies)`
                : state.exchangeRates.status === 'cached'
                ? `Using cached exchange rates (${Object.keys(state.exchangeRates.rates).length} currencies) - API unavailable`
                : state.exchangeRates.status === 'error'
                ? 'Failed to load exchange rates'
                : 'Loading exchange rates...'
            }
          ></div>
        </div>

        {/* Settings Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
            className="w-10 h-10 flex items-center justify-center text-xl border border-[var(--text-primary)] text-[var(--text-primary)] transition-all duration-200 focusable hover:bg-[var(--text-primary)] hover:text-black"
            title="Settings"
            aria-label="Open settings menu"
          >
            ⚙︎
          </button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {showSettingsDropdown && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setShowSettingsDropdown(false)}
                />
                
                {/* Menu */}
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-48 glass-panel border border-[var(--text-primary)] z-50"
                >
                  <div className="p-2 space-y-1">
                    {/* Habits Link */}
                    <div className="px-3 py-2">
                      <a
                        href="/habits"
                        onClick={() => setShowSettingsDropdown(false)}
                        className="w-full text-left text-xs hover:bg-[var(--text-primary)]/20 hover:text-[var(--text-primary)] transition-colors py-1 text-[var(--text-primary)] opacity-70 hover:opacity-100 block"
                      >
                        🎯 Habit Terminal
                      </a>
                    </div>

                    {/* Expense Tracker Link */}
                    <div className="px-3 py-2">
                      <a
                        href="/expenses"
                        onClick={() => setShowSettingsDropdown(false)}
                        className="w-full text-left text-xs hover:bg-[var(--text-primary)]/20 hover:text-[var(--text-primary)] transition-colors py-1 text-[var(--text-primary)] opacity-70 hover:opacity-100 block"
                      >
                        💸 Expense Tracker
                      </a>
                    </div>
                    
                    {/* Reset Button */}
                    <div className="px-3 py-2">
                      <button
                        onClick={() => {
                          resetState();
                          setShowSettingsDropdown(false);
                        }}
                        className="w-full text-left text-xs hover:bg-red-600/20 hover:text-red-400 transition-colors py-1 text-[var(--text-primary)]"
                      >
                        🗑️ Reset All Data
                      </button>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
} 