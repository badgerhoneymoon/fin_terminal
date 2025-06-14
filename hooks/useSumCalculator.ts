import { useState } from 'react';
import { soundManager } from '@/lib/sounds';

interface UseSumCalculatorOptions {
  soundEnabled?: boolean;
}

export function useSumCalculator(options: UseSumCalculatorOptions = {}) {
  const { soundEnabled = false } = options;

  const [sumNumbers, setSumNumbers] = useState<number[]>([]);
  const [currentInput, setCurrentInput] = useState('');

  /**
   * Returns the current total sum (numbers in chips + current input value as number).
   */
  const calculateSum = () => {
    const currentNum = parseFloat(currentInput) || 0;
    return sumNumbers.reduce((sum, num) => sum + num, 0) + currentNum;
  };

  /**
   * Adds a number to the running sum list.
   * Returns `true` if the number was valid and added, `false` otherwise.
   */
  const addNumber = (value: number) => {
    if (!isNaN(value) && value > 0) {
      setSumNumbers(prev => [...prev, value]);
      if (soundEnabled) soundManager.playSum();
      return true;
    }
    return false;
  };

  /**
   * Removes the last number from the running sum list.
   */
  const removeLastNumber = () => {
    setSumNumbers(prev => prev.slice(0, -1));
    if (soundEnabled) soundManager.playDelete();
  };

  /**
   * Removes a number at a specific index from the running sum list.
   */
  const removeNumberAt = (index: number) => {
    setSumNumbers(prev => prev.filter((_, i) => i !== index));
    if (soundEnabled) soundManager.playDelete();
  };

  /**
   * Clears the entire sum calculation state (chips & current input).
   */
  const clearAll = () => {
    setSumNumbers([]);
    setCurrentInput('');
    if (soundEnabled) soundManager.playDelete();
  };

  return {
    // state
    sumNumbers,
    currentInput,

    // setters (exposed for flexibility)
    setSumNumbers,
    setCurrentInput,

    // helpers
    calculateSum,
    addNumber,
    removeNumberAt,
    removeLastNumber,
    clearAll,
  };
} 