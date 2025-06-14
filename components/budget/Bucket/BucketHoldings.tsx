'use client';

import { CURRENCIES, Currency } from '@/lib/types';
import { formatSmartAmount } from '@/lib/utils';
import { CURRENCY_THRESHOLDS } from '@/lib/constants';

interface BucketHoldingsProps {
  holdings: { [key: string]: number } | undefined;
  exchangeRates: { [key: string]: number };
  bucketCurrency: Currency;
}

export function BucketHoldings({ holdings, exchangeRates, bucketCurrency }: BucketHoldingsProps) {
  if (!holdings || Object.keys(holdings).length === 0) {
    return null;
  }

  // Filter out zero or very small amounts using currency-specific thresholds
  const significantHoldings = Object.entries(holdings).filter(([currency, amount]) => {
    const threshold = CURRENCY_THRESHOLDS[currency] || 0.01;
    return Math.abs(amount) > threshold;
  });
  
  if (significantHoldings.length === 0) {
    return null;
  }

  // Only show holdings if there are currencies different from the bucket's base currency
  const hasDifferentCurrencies = significantHoldings.some(([currency]) => currency !== bucketCurrency);
  
  if (!hasDifferentCurrencies) {
    return null;
  }

  return (
    <div className="mb-3 p-3 bg-black/20 border border-[var(--text-primary)] border-opacity-30 rounded-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--text-primary)] opacity-70 uppercase tracking-wide">
          Holdings
        </span>
        <div className="flex items-center gap-4">
          {significantHoldings.map(([holdingCurrency, amount]) => {
            const holdingCurrencyInfo = CURRENCIES[holdingCurrency as Currency];
            const holdingRate = exchangeRates[holdingCurrency];
            const usdValue = holdingCurrency === 'USD' ? amount : (amount * (holdingRate || 0));
            
            return (
              <div key={holdingCurrency} className="flex items-center gap-2">
                <span className="text-sm text-white font-medium">
                  {holdingCurrencyInfo.symbol}{formatSmartAmount(amount, holdingCurrency)}
                </span>
                <span className="text-xs text-[var(--text-primary)] opacity-60">
                  {holdingCurrency}
                </span>
                {holdingCurrency !== 'USD' && holdingRate && !isNaN(usdValue) && (
                  <span className="text-xs text-[var(--text-primary)] opacity-50">
                    (≈${formatSmartAmount(usdValue, 'USD')})
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 