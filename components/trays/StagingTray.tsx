'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBudget } from '@/lib/context/budget-context';
import { CURRENCIES, Currency, Chip } from '@/lib/types';
import { CurrencySelector } from '../inputs/CurrencySelector';
import { SumInput } from '../inputs/SumInput';
import { ChipTray } from './ChipTray';
import { formatSmartAmount } from '@/lib/utils';
import { soundManager } from '@/lib/sound/sounds';
import { useSumCalculator } from '@/hooks/input/useSumCalculator';
import { useKeyboardInput } from '@/hooks/input/useKeyboardInput';

export function StagingTray() {
  const { state, mintChip, clearChips, convertChipPolarity } = useBudget();
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [showToast, setShowToast] = useState(false);
  const [isNegative, setIsNegative] = useState(false);
  const [note, setNote] = useState('');
  const [percentageMode, setPercentageMode] = useState(false);
  const [percentageBase, setPercentageBase] = useState(0);
  const sumInputRef = useRef<HTMLInputElement>(null);
  const noteInputRef = useRef<HTMLInputElement>(null);

  const {
    sumNumbers,
    setSumNumbers,
    currentInput,
    setCurrentInput,
    calculateSum,
    clearAll,
    removeNumberAt,
  } = useSumCalculator({ soundEnabled: state.soundEnabled });

  // Auto-focus amount input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      sumInputRef.current?.focus();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const handleMint = () => {
    let finalAmount: number;
    
    if (sumNumbers.length > 0) {
      // If we have numbers in the sum, use the total
      finalAmount = calculateSum();
    } else {
      // Otherwise use the regular amount
      finalAmount = parseFloat(amount);
    }
    
    if (isNaN(finalAmount) || finalAmount <= 0) {
      return;
    }

    mintChip(finalAmount, currency, isNegative, note);
    setAmount('');
    setCurrentInput('');
    setSumNumbers([]);
    setNote('');
    setPercentageMode(false);
    setPercentageBase(0);
    
    // Focus back to amount input for next entry
    setTimeout(() => {
      sumInputRef.current?.focus();
    }, 100);
    
    // Show toast
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleCurrencyChange = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    // Focus the amount input after currency selection
    setTimeout(() => {
      sumInputRef.current?.focus();
    }, 100);
  };

  const handleFocusNote = () => {
    setTimeout(() => {
      noteInputRef.current?.focus();
    }, 50);
  };

  const handlePercentageMode = (baseAmount: number) => {
    setPercentageMode(true);
    setPercentageBase(baseAmount);
    setAmount('');
    setCurrentInput('');
    setSumNumbers([]);
    if (state.soundEnabled) {
      soundManager.playSum(); // Play a sound to indicate percentage mode
    }
  };

  const calculatePercentage = () => {
    if (percentageMode && amount) {
      const percentage = parseFloat(amount);
      if (!isNaN(percentage)) {
        const calculatedAmount = (percentageBase * percentage / 100).toString();
        setAmount(calculatedAmount);
        setPercentageMode(false);
        setPercentageBase(0);
        return true;
      }
    }
    return false;
  };

  const { handleKeyPress, handleKeyDown } = useKeyboardInput({
    amount,
    setAmount,
    sumNumbers,
    setSumNumbers,
    currentInput,
    setCurrentInput,
    onMint: handleMint,
    onEnterFromAmount: handleFocusNote,
    onPercentageMode: handlePercentageMode,
    onCalculatePercentage: calculatePercentage,
    soundEnabled: state.soundEnabled,
  });

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Remove any existing currency symbols and formatting (keep only digits and decimal point)
    const cleanValue = value.replace(/[^\d.]/g, '');
    
    if (percentageMode) {
      // Just store the percentage value, don't calculate yet
      setAmount(cleanValue);
    } else if (sumNumbers.length > 0) {
      setCurrentInput(cleanValue);
    } else {
      setAmount(cleanValue);
    }
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

  const getDisplayValue = () => {
    if (percentageMode) {
      return amount; // Show the percentage number being typed (without currency formatting)
    }
    if (sumNumbers.length > 0) {
      return currentInput ? formatDisplayValue(currentInput, currency) : '';
    }
    return amount ? formatDisplayValue(amount, currency) : '';
  };

  const handlePolarityToggle = () => {
    const newIsNegative = !isNegative;
    setIsNegative(newIsNegative);
    
    // Play negate sound
    if (state.soundEnabled) {
      soundManager.playNegate();
    }
    
    // Convert existing chips if any exist
    if (state.chips.length > 0) {
      state.chips.forEach((chip: Chip) => {
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
          disabled={(!amount && sumNumbers.length === 0) || (sumNumbers.length > 0 ? calculateSum() <= 0 : parseFloat(amount) <= 0)}
          className="flex items-center justify-center w-10 h-10 btn-primary text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          title="Mint Chip"
        >
          →
        </button>

        {/* Currency Selector */}
        <CurrencySelector 
          currency={currency}
          onCurrencyChange={handleCurrencyChange}
        />
        <SumInput
          currency={currency}
          sumNumbers={sumNumbers}
          getDisplayValue={getDisplayValue}
          handleAmountChange={handleAmountChange}
          handleKeyPress={handleKeyPress}
          handleKeyDown={handleKeyDown}
          removeNumberAt={removeNumberAt}
          onClearAll={() => {
            clearAll();
            setAmount('');
            setPercentageMode(false);
            setPercentageBase(0);
          }}
          inputRef={sumInputRef}
          percentageMode={percentageMode}
          percentageBase={percentageBase}
        />

        {/* Arrow and USD conversion */}
        <div className="flex items-center gap-2">
          <div className="text-[var(--text-primary)] font-bold">→</div>
          {((amount && parseFloat(amount) > 0) || (sumNumbers.length > 0 && calculateSum() > 0)) && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-[var(--text-primary)] text-sm font-mono"
            >
              ${(() => {
                const num = sumNumbers.length > 0 ? calculateSum() : parseFloat(amount) || 0;
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

      {/* Note Input Section */}
      <div className="mb-4">
        <input
          ref={noteInputRef}
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleMint();
            }
          }}
          placeholder="Add a note (optional) - e.g., 'Salary', 'Groceries', 'Coffee'"
          className="w-full input-terminal bg-transparent border border-[var(--text-primary)] border-opacity-30 px-3 py-2 text-[var(--text-primary)] placeholder-[var(--text-primary)] placeholder-opacity-50 focus:border-opacity-100 focus:outline-none"
          maxLength={100}
        />
      </div>

      {/* Chip Display Area */}
      <ChipTray
        chips={state.chips}
        isNegative={isNegative}
        onClearChips={clearChips}
      />

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