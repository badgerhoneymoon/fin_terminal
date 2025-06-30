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
  onEnterFromAmount?: () => void;
  onPercentageMode?: (baseAmount: number) => void;
  onCalculatePercentage?: () => boolean;
  
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
    onEnterFromAmount,
    onPercentageMode,
    onCalculatePercentage,
    soundEnabled = false,
  } = options;

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // First check if we're in percentage mode
      if (onCalculatePercentage && onCalculatePercentage()) {
        // Percentage was calculated, focus note field
        if (onEnterFromAmount) {
          onEnterFromAmount();
        }
        return;
      }
      
      // Check if there's an amount to process
      const currentNum = parseFloat(currentInput) || 0;
      const totalSum = sumNumbers.reduce((sum, num) => sum + num, 0) + currentNum;
      const singleAmount = parseFloat(amount) || 0;
      
      const hasAmount = (sumNumbers.length > 0 && totalSum > 0) || 
                       (sumNumbers.length === 0 && singleAmount > 0);
      
      if (hasAmount && onEnterFromAmount) {
        // Move to note field instead of minting immediately
        onEnterFromAmount();
      } else {
        // No amount, so just mint (this handles the case from note field)
        onMint();
      }
    } else if (e.key === '%' && onPercentageMode) {
      e.preventDefault();
      
      // Calculate base amount for percentage
      const currentNum = parseFloat(currentInput) || 0;
      const totalSum = sumNumbers.reduce((sum, num) => sum + num, 0) + currentNum;
      const singleAmount = parseFloat(amount) || 0;
      
      const baseAmount = sumNumbers.length > 0 ? totalSum : singleAmount;
      
      if (baseAmount > 0) {
        onPercentageMode(baseAmount);
      }
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