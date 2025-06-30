'use client';

import { useRef } from 'react';
import { CURRENCIES, Currency } from '@/lib/types';
import { formatSmartAmount } from '@/lib/utils';

interface SumInputProps {
  currency: Currency;
  sumNumbers: number[];
  getDisplayValue: () => string;
  handleAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  removeNumberAt: (index: number) => void;
  onClearAll: () => void;
  inputRef?: React.RefObject<HTMLInputElement>;
  percentageMode?: boolean;
  percentageBase?: number;
}

export function SumInput({
  currency,
  sumNumbers,
  getDisplayValue,
  handleAmountChange,
  handleKeyPress,
  handleKeyDown,
  removeNumberAt,
  onClearAll,
  inputRef: externalInputRef,
  percentageMode = false,
  percentageBase = 0,
}: SumInputProps) {
  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef || internalInputRef;

  return (
    <div className="flex-1 relative">
      <div className="relative w-full input-terminal flex items-center gap-2 flex-wrap min-h-[44px] py-2">
        {/* Number chips */}
        {sumNumbers.map((num, index) => (
          <div
            key={index}
            className="inline-flex items-center gap-1 px-2 py-1 bg-black/40 text-[var(--text-primary)] rounded border border-[var(--text-primary)] border-opacity-30 text-sm font-mono"
          >
            <span>{CURRENCIES[currency].symbol}{formatSmartAmount(num, currency)}</span>
            <button
              onClick={() => removeNumberAt(index)}
              className="text-[var(--text-primary)] opacity-60 hover:opacity-100 hover:text-red-400 text-xs ml-1 transition-colors"
              title="Remove this number"
            >
              ×
            </button>
          </div>
        ))}
        
        {/* Percentage mode indicator */}
        {percentageMode && (
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-accent)] font-bold text-sm">
              {CURRENCIES[currency].symbol}{formatSmartAmount(percentageBase, currency)}
            </span>
            <span className="text-[var(--text-accent)] opacity-80 text-sm font-mono">×</span>
            <span className="text-[var(--text-accent)] font-bold text-sm">%</span>
          </div>
        )}
        
        {/* Plus sign between chips and input */}
        {sumNumbers.length > 0 && !percentageMode && (
          <span className="text-[var(--text-primary)] opacity-60 text-sm font-mono">+</span>
        )}
        
        {/* Input field */}
        <input
          ref={inputRef}
          type="text"
          value={getDisplayValue()}
          onChange={handleAmountChange}
          onKeyPress={handleKeyPress}
          onKeyDown={handleKeyDown}
          placeholder={
            percentageMode 
              ? "Enter percentage (e.g., 5 for 5%)" 
              : sumNumbers.length > 0 
                ? "Add more..." 
                : `Amount (${CURRENCIES[currency].symbol}) - Press SPACE to sum, % for percentage`
          }
          className="flex-1 bg-transparent border-none outline-none text-white placeholder-[var(--text-primary)] placeholder-opacity-50 min-w-[120px]"
          aria-label="Chip amount"
        />
        
        {/* Clear all button */}
        {sumNumbers.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-red-400 hover:text-red-300 transition-colors text-xs font-bold ml-2"
            title="Clear sum"
          >
            CLEAR
          </button>
        )}
      </div>
    </div>
  );
} 