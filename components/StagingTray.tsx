'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBudget } from '@/lib/budget-context';
import { CURRENCIES, Currency } from '@/lib/types';
import { Chip } from './Chip';
import { formatSmartAmount } from '@/lib/utils';

export function StagingTray() {
  const { state, mintChip, clearChips, convertChipPolarity } = useBudget();
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [showToast, setShowToast] = useState(false);
  const [isNegative, setIsNegative] = useState(false);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const amountInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (isDropdownOpen) {
        setIsDropdownOpen(false);
      }
    };
    
    if (isDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isDropdownOpen]);

  const handleMint = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return;
    }

    mintChip(numAmount, currency, isNegative);
    setAmount('');
    
    // Show toast
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleMint();
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Remove any existing currency symbols and formatting (keep only digits and decimal point)
    const cleanValue = value.replace(/[^\d.]/g, '');
    setAmount(cleanValue);
  };

  const formatDisplayValue = (value: string, curr: Currency) => {
    if (!value) return '';
    const symbol = CURRENCIES[curr].symbol;
    
    // Add thousand separators while preserving decimal input
    const parts = value.split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const formattedValue = parts.length > 1 ? `${integerPart}.${parts[1]}` : integerPart;
    
    return `${symbol}${formattedValue}`;
  };

  const handlePolarityToggle = () => {
    const newIsNegative = !isNegative;
    setIsNegative(newIsNegative);
    
    // Convert existing chips if any exist
    if (state.chips.length > 0) {
      state.chips.forEach(chip => {
        if (chip.isNegative !== newIsNegative) {
          convertChipPolarity(chip.id, newIsNegative);
        }
      });
    }
  };

  return (
    <div className="w-full">
      {/* Input Section */}
      <div className="flex items-center gap-4 mb-6">
        {/* Add/Subtract Toggle Button */}
        <button
          onClick={handlePolarityToggle}
          className={`flex items-center justify-center w-10 h-10 text-lg font-bold transition-all duration-300 ${
            isNegative 
              ? 'bg-red-500 text-white border border-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30' 
              : 'btn-primary shadow-lg shadow-green-500/30'
          }`}
          title={isNegative ? 'Negative Chip (Spending)' : 'Positive Chip (Payment)'}
        >
          {isNegative ? '−' : '+'}
        </button>

        {/* Mint Button */}
        <button
          onClick={handleMint}
          disabled={!amount || parseFloat(amount) <= 0}
          className="flex items-center justify-center w-10 h-10 btn-primary text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          title="Mint Chip"
        >
          →
        </button>

        {/* Currency Selector - moved to left */}
        <div className="relative">
          <button
            className="flex items-center gap-2 px-4 py-2 btn-primary text-sm font-mono min-w-[80px] justify-between"
            onClick={(e) => {
              e.stopPropagation();
              setIsDropdownOpen(!isDropdownOpen);
            }}
            title="Select currency"
          >
            <div className="flex items-center gap-1">
              <span>{CURRENCIES[currency].symbol}</span>
              <span className="font-bold">{currency}</span>
            </div>
            <span className={`text-xs transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
          </button>
          
          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 bg-black border border-[var(--text-primary)] z-50 min-w-[120px]">
              {Object.entries(CURRENCIES).map(([code, currencyData]) => (
                <button
                  key={code}
                  className={`w-full px-4 py-2 text-left text-sm font-mono transition-colors
                    ${currency === code 
                      ? 'bg-[var(--text-primary)] text-black' 
                      : 'text-[var(--text-primary)] hover:bg-white hover:bg-opacity-10 hover:text-white'
                    }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrency(code as Currency);
                    setIsDropdownOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span>{currencyData.symbol}</span>
                    <span className="font-bold">{code}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 relative">
          <input
            ref={amountInputRef}
            type="text"
            value={amount ? formatDisplayValue(amount, currency) : ''}
            onChange={handleAmountChange}
            onKeyPress={handleKeyPress}
            placeholder={`Amount (${CURRENCIES[currency].symbol})`}
            className="w-full input-terminal"
            aria-label="Chip amount"
          />
        </div>

        {/* Arrow and USD conversion */}
        <div className="flex items-center gap-2">
          <div className="text-[var(--text-primary)] font-bold">→</div>
          {amount && parseFloat(amount) > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-[var(--text-primary)] text-sm font-mono"
            >
              ${(() => {
                const num = parseFloat(amount) || 0;
                if (currency === 'USD') return formatSmartAmount(num, 'USD');
                const rate = state.exchangeRates.rates[currency as keyof typeof state.exchangeRates.rates];
                if (!rate || rate === 0 || isNaN(rate)) return '?';
                const converted = num * rate;
                // Additional safety check for NaN
                if (isNaN(converted)) return '?';
                return formatSmartAmount(converted, 'USD');
              })()} USD
            </motion.div>
          )}
        </div>
      </div>

      {/* Chip Display Area - Color coded based on mode */}
      <motion.div 
        className={`min-h-[60px] p-3 glass-panel border-2 rounded-sm transition-all duration-300 ${
          isNegative 
            ? 'border-red-500 bg-red-900/10 shadow-lg shadow-red-500/20' 
            : 'border-[var(--text-primary)] bg-green-900/5 shadow-lg shadow-green-500/10'
        }`}
        animate={{
          borderColor: isNegative ? '#ef4444' : 'var(--text-primary)',
          backgroundColor: isNegative ? 'rgba(127, 29, 29, 0.1)' : 'rgba(21, 128, 61, 0.05)'
        }}
        transition={{ duration: 0.3 }}
      >
        {state.chips.length === 0 ? (
          <div className="flex items-center justify-center h-12 text-[var(--text-primary)] opacity-40">
            <div className={`text-sm font-mono font-bold transition-colors duration-300 ${
              isNegative ? 'text-red-400' : 'text-green-400'
            }`}>
              {isNegative ? 'SPENDING MODE' : 'DREAM MODE'}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3 items-start">
            <AnimatePresence>
              {state.chips.map((chip) => (
                <Chip key={chip.id} chip={chip} />
              ))}
            </AnimatePresence>
            <button
              onClick={clearChips}
              className="text-[var(--text-accent)] hover:text-red-400 transition-colors text-xs font-bold ml-auto"
              title="Clear all chips"
            >
              CLEAR ALL
            </button>
          </div>
        )}
      </motion.div>

      {/* Toast Notification - Centered Bottom */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-4 left-1/2 transform -translate-x-1/2 glass-panel border border-[var(--text-primary)] px-4 py-2 z-50"
          >
            <span className="text-[var(--text-primary)] font-bold">MINTED</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 