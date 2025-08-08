import { useState } from 'react';
import { soundManager } from '@/lib/sound/sounds';

interface UseSumCalculatorOptions {
  soundEnabled?: boolean;
}

export interface CalculatorEntry {
  value: number;
  operation: '+' | '-';
}

export function useSumCalculator(options: UseSumCalculatorOptions = {}) {
  const { soundEnabled = false } = options;

  const [sumEntries, setSumEntries] = useState<CalculatorEntry[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [nextOperation, setNextOperation] = useState<'+' | '-'>('+');

  /**
   * Returns the current total sum (numbers in chips + current input value as number).
   */
  const calculateSum = () => {
    const currentNum = parseFloat(currentInput) || 0;
    const entriesTotal = sumEntries.reduce((sum, entry) => {
      return entry.operation === '+' ? sum + entry.value : sum - entry.value;
    }, 0);
    // Apply the next operation to the current input if it exists
    if (currentNum > 0) {
      return nextOperation === '+' ? entriesTotal + currentNum : entriesTotal - currentNum;
    }
    return entriesTotal;
  };

  /**
   * Adds a number to the running sum list with the specified operation.
   * Returns `true` if the number was valid and added, `false` otherwise.
   */
  const addEntry = (value: number, operation: '+' | '-' = '+') => {
    if (!isNaN(value) && value > 0) {
      setSumEntries(prev => [...prev, { value, operation }]);
      if (soundEnabled) soundManager.playSum();
      return true;
    }
    return false;
  };

  /**
   * Removes the last entry from the running sum list.
   */
  const removeLastEntry = () => {
    setSumEntries(prev => prev.slice(0, -1));
    if (soundEnabled) soundManager.playDelete();
  };

  /**
   * Removes an entry at a specific index from the running sum list.
   */
  const removeEntryAt = (index: number) => {
    setSumEntries(prev => prev.filter((_, i) => i !== index));
    if (soundEnabled) soundManager.playDelete();
  };

  /**
   * Clears the entire sum calculation state (chips & current input).
   */
  const clearAll = () => {
    setSumEntries([]);
    setCurrentInput('');
    setNextOperation('+');
    if (soundEnabled) soundManager.playDelete();
  };

  // Compatibility layer for old sumNumbers interface
  const sumNumbers = sumEntries.map(e => e.value);
  const setSumNumbers = (value: number[] | ((prev: number[]) => number[])) => {
    if (typeof value === 'function') {
      setSumEntries(prev => {
        const oldNumbers = prev.map(e => e.value);
        const newNumbers = value(oldNumbers);
        return newNumbers.map(num => ({ value: num, operation: '+' as const }));
      });
    } else {
      setSumEntries(value.map(num => ({ value: num, operation: '+' as const })));
    }
  };

  return {
    // state
    sumNumbers,
    sumEntries,
    currentInput,
    nextOperation,

    // setters (exposed for flexibility)
    setSumNumbers,
    setSumEntries,
    setCurrentInput,
    setNextOperation,

    // helpers
    calculateSum,
    addEntry,
    removeEntryAt,
    removeLastEntry,
    clearAll,
    // Legacy compatibility
    addNumber: (value: number) => addEntry(value, '+'),
    removeNumberAt: removeEntryAt,
    removeLastNumber: removeLastEntry,
  };
} 