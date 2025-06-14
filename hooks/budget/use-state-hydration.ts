import { useEffect, useRef } from 'react';
import { BudgetState, BudgetAction } from '@/lib/types';
import { StorageService } from '@/lib/services/storage';

interface UseStateHydrationProps {
  state: BudgetState;
  dispatch: React.Dispatch<BudgetAction>;
}

export const useStateHydration = ({ state, dispatch }: UseStateHydrationProps) => {
  // Ref to skip first save (avoids clobbering existing storage before hydration)
  const isFirstRender = useRef(true);

  /*
   * After the component mounts on the client we can safely hydrate the state
   * from localStorage. Doing it here – instead of in the lazy initialiser –
   * guarantees that the very first client render matches the HTML already
   * in the DOM, so React has nothing to complain about.
   */
  useEffect(() => {
    const loadedState = StorageService.loadFromStorage();
    if (loadedState) {
      console.log('Loading saved data from localStorage:', {
        buckets: loadedState.buckets.length,
        chips: loadedState.chips.length,
        transactions: loadedState.transactions.length,
        soundEnabled: loadedState.soundEnabled
      });
      dispatch({ type: 'IMPORT_DATA', payload: loadedState });
    } else {
      console.log('No saved data found in localStorage, using defaults');
    }
    // We want this effect to run only once after mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save to localStorage on state changes (but skip the very first render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    StorageService.saveToStorage(state);
  }, [state]);
}; 