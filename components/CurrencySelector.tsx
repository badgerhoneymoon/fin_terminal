'use client';

import { useState, useEffect } from 'react';
import { CURRENCIES, Currency } from '@/lib/types';

interface CurrencySelectorProps {
  currency: Currency;
  onCurrencyChange: (currency: Currency) => void;
}

export function CurrencySelector({ currency, onCurrencyChange }: CurrencySelectorProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

  return (
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
                onCurrencyChange(code as Currency);
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
  );
} 