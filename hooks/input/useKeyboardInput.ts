import { soundManager } from '@/lib/sound/sounds';

interface UseKeyboardInputOptions {
  // Main amount state
  amount: string;
  setAmount: (value: string) => void;
  
  // Sum calculator integration
  sumNumbers: number[];
  setSumNumbers: (value: number[] | ((prev: number[]) => number[])) => void;
  currentInput: string;
  setCurrentInput: (value: string) => void;
  
  // Actions
  onMint: () => void;
  
  // Settings
  soundEnabled?: boolean;
}

export function useKeyboardInput(options: UseKeyboardInputOptions) {
  const {
    amount,
    setAmount,
    sumNumbers,
    setSumNumbers,
    currentInput,
    setCurrentInput,
    onMint,
    soundEnabled = false,
  } = options;

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onMint();
    } else if (e.key === ' ') {
      e.preventDefault();
      
      // Add current number to the sum
      let currentNum: number;
      let numberAdded = false;
      
      if (sumNumbers.length === 0) {
        // First number - check amount
        currentNum = parseFloat(amount);
        if (!isNaN(currentNum) && currentNum > 0) {
          setSumNumbers([currentNum]);
          setAmount('');
          numberAdded = true;
        }
      } else {
        // Subsequent numbers - check currentInput
        currentNum = parseFloat(currentInput);
        if (!isNaN(currentNum) && currentNum > 0) {
          setSumNumbers(prev => [...prev, currentNum]);
          setCurrentInput('');
          numberAdded = true;
        }
      }
      
      // Play sum sound if a number was successfully added
      if (numberAdded && soundEnabled) {
        soundManager.playSum();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Backspace' || e.key === 'Delete') && sumNumbers.length > 0) {
      const currentValue = sumNumbers.length === 0 ? amount : currentInput;
      
      // Only remove chip if input is empty
      if (!currentValue || currentValue === '') {
        e.preventDefault();
        // Remove the last number from the sum
        setSumNumbers(prev => prev.slice(0, -1));
        if (soundEnabled) {
          soundManager.playDelete();
        }
      }
    }
  };

  return {
    handleKeyPress,
    handleKeyDown,
  };
} 