import { BudgetState, BudgetAction, Currency } from '@/lib/types';
import { soundManager } from '@/lib/sound/sounds';
import { StorageService } from '@/lib/services/storage';

interface UseBudgetActionsProps {
  state: BudgetState;
  dispatch: React.Dispatch<BudgetAction>;
}

export const useBudgetActions = ({ state, dispatch }: UseBudgetActionsProps) => {
  const mintChip = (amount: number, currency: string, isNegative?: boolean, note?: string) => {
    dispatch({ type: 'MINT_CHIP', payload: { amount, currency: currency as Currency, isNegative, note } });
    if (state.soundEnabled) {
      soundManager.playMint();
    }
  };

  const dropChip = (chipId: string, bucketId: string) => {
    const chip = state.chips.find(c => c.id === chipId);
    const bucket = state.buckets.find(b => b.id === bucketId);
    
    // Check if this will complete milestones before dispatching
    let willCompleteMilestones = false;
    if (chip && bucket && bucket.type === 'debt' && bucket.milestones) {
      const chipInUSD = chip.currency === 'USD' ? chip.amount : chip.amount / chip.usdRate;
      const bucketRate = bucket.currency === 'USD' ? 1 : state.exchangeRates.rates[bucket.currency];
      const convertedAmount = bucket.currency === 'USD' ? chipInUSD : chipInUSD * bucketRate;
      const newCurrent = Math.max(0, bucket.current - convertedAmount);
      
      willCompleteMilestones = bucket.milestones.some(milestone => 
        bucket.current > milestone && newCurrent <= milestone
      );
    }
    
    dispatch({ type: 'DROP_CHIP', payload: { chipId, bucketId } });
    
    if (state.soundEnabled) {
      if (willCompleteMilestones) {
        setTimeout(() => soundManager.playMilestone(), 100);
      } else {
        soundManager.playDrop();
      }
    }
  };

  const removeChip = (chipId: string) => {
    dispatch({ type: 'REMOVE_CHIP', payload: { chipId } });
    if (state.soundEnabled) {
      soundManager.playDelete();
    }
  };

  const clearChips = () => {
    dispatch({ type: 'CLEAR_CHIPS' });
    if (state.soundEnabled) {
      soundManager.playDelete();
    }
  };

  const resetBucket = (bucketId: string) => {
    dispatch({ type: 'RESET_BUCKET', payload: { bucketId } });
  };

  const deleteTransaction = (transactionId: string) => {
    dispatch({ type: 'DELETE_TRANSACTION', payload: { transactionId } });
    if (state.soundEnabled) {
      soundManager.playDelete();
    }
  };

  const updateTransaction = (transactionId: string, newAmount: number) => {
    dispatch({ type: 'UPDATE_TRANSACTION', payload: { transactionId, newAmount } });
    if (state.soundEnabled) {
      soundManager.playDrop();
    }
  };

  const convertChipPolarity = (chipId: string, isNegative: boolean) => {
    dispatch({ type: 'CONVERT_CHIP_POLARITY', payload: { chipId, isNegative } });
  };

  const toggleSound = () => {
    const newSoundEnabled = !state.soundEnabled;
    dispatch({ type: 'TOGGLE_SOUND' });
    soundManager.setEnabled(newSoundEnabled);
  };

  const exportData = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `budget-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importData = (data: string) => {
    try {
      const parsed = JSON.parse(data);
      // For manual imports, keep current exchange rates from API
      // But preserve the original rates structure if it exists
      if (parsed.exchangeRates && state.exchangeRates.status === 'success') {
        parsed.exchangeRates = {
          ...parsed.exchangeRates,
          rates: state.exchangeRates.rates,
          lastUpdated: state.exchangeRates.lastUpdated,
          status: state.exchangeRates.status
        };
      } else if (!parsed.exchangeRates) {
        parsed.exchangeRates = state.exchangeRates;
      }
      dispatch({ type: 'IMPORT_DATA', payload: parsed });
    } catch (error) {
      console.error('Failed to import data:', error);
      throw new Error('Invalid JSON data');
    }
  };

  const resetState = () => {
    dispatch({ type: 'RESET_STATE' });
    // Also clear localStorage
    StorageService.clearStorage();
  };

  return {
    mintChip,
    dropChip,
    removeChip,
    clearChips,
    resetBucket,
    deleteTransaction,
    updateTransaction,
    convertChipPolarity,
    toggleSound,
    exportData,
    importData,
    resetState
  };
}; 