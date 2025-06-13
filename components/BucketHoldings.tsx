'use client';

import { CURRENCIES, Currency } from '@/lib/types';
import { formatSmartAmount } from '@/lib/utils';

interface BucketHoldingsProps {
  holdings: { [key: string]: number } | undefined;
  exchangeRates: { [key: string]: number };
}

export function BucketHoldings({ holdings, exchangeRates }: BucketHoldingsProps) {
  if (!holdings || Object.keys(holdings).length === 0) {
    return null;
  }

  return (
    <div className="mb-3 p-3 bg-black/20 border border-[var(--text-primary)] border-opacity-30 rounded-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--text-primary)] opacity-70 uppercase tracking-wide">
          Holdings
        </span>
        <div className="flex items-center gap-4">
          {Object.entries(holdings).map(([holdingCurrency, amount]) => {
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