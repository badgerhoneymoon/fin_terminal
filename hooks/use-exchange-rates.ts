import { useEffect, useCallback } from 'react';
import { BudgetAction } from '../lib/types';
import { CurrencyService } from '../lib/services/currency-service';

interface UseExchangeRatesProps {
  dispatch: React.Dispatch<BudgetAction>;
}

export const useExchangeRates = ({ dispatch }: UseExchangeRatesProps) => {
  // Fetch exchange rates function
  const fetchRates = useCallback(async () => {
    dispatch({ type: 'SET_EXCHANGE_RATES_LOADING' });
    try {
      console.log('Fetching exchange rates from API...');
      const currencyData = await CurrencyService.fetchExchangeRates();
      
      if (currencyData.fromCache) {
        dispatch({ 
          type: 'UPDATE_EXCHANGE_RATES_CACHED', 
          payload: {
            rates: currencyData.rates,
            lastUpdated: currencyData.lastUpdated
          }
        });
        console.log('Exchange rates loaded from cache:', currencyData.rates);
      } else {
        dispatch({ 
          type: 'UPDATE_EXCHANGE_RATES', 
          payload: {
            rates: currencyData.rates,
            lastUpdated: currencyData.lastUpdated
          }
        });
        console.log('Exchange rates updated from API:', currencyData.rates);
      }
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
      dispatch({ type: 'SET_EXCHANGE_RATES_ERROR' });
    }
  }, [dispatch]);

  // Fetch on mount and periodically
  useEffect(() => {
    // Small delay to let localStorage data load first
    const timer = setTimeout(fetchRates, 100);

    // Fetch every hour
    const interval = setInterval(fetchRates, 60 * 60 * 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [fetchRates]);

  // Manual refresh function
  const refreshExchangeRates = useCallback(async () => {
    try {
      console.log('Manually refreshing exchange rates...');
      const currencyData = await CurrencyService.fetchExchangeRates();
      
      if (currencyData.fromCache) {
        dispatch({ 
          type: 'UPDATE_EXCHANGE_RATES_CACHED', 
          payload: {
            rates: currencyData.rates,
            lastUpdated: currencyData.lastUpdated
          }
        });
        console.log('Exchange rates refreshed from cache:', currencyData.rates);
      } else {
        dispatch({ 
          type: 'UPDATE_EXCHANGE_RATES', 
          payload: {
            rates: currencyData.rates,
            lastUpdated: currencyData.lastUpdated
          }
        });
        console.log('Exchange rates refreshed from API:', currencyData.rates);
      }
      return true;
    } catch (error) {
      console.error('Failed to refresh exchange rates:', error);
      throw error;
    }
  }, [dispatch]);

  return {
    refreshExchangeRates
  };
}; 