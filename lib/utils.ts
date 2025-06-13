import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Smart formatting utility for decimal points based on amount size
export function formatSmartAmount(amount: number, currency?: string): string {
  // Handle null, undefined, NaN cases
  if (amount == null || isNaN(amount)) {
    return '0';
  }

  // Special handling for Bitcoin - always show relevant decimal places
  if (currency === 'BTC') {
    if (amount >= 1) {
      return amount.toFixed(4); // Show 4 decimal places for whole bitcoins
    } else if (amount >= 0.01) {
      return amount.toFixed(4); // Show 4 decimal places for amounts >= 0.01 BTC
    } else if (amount >= 0.001) {
      return amount.toFixed(5); // Show 5 decimal places for smaller amounts
    } else {
      return amount.toFixed(6); // Show 6 decimal places for very small amounts
    }
  }

  // Smart rounding based on amount size for other currencies
  if (amount >= 100) {
    // 3+ digits: round to nearest dollar (no decimals) - e.g., 276.5 → 277
    return Math.round(amount).toLocaleString();
  } else if (amount >= 10) {
    // 2 digits: round to nearest 10 cents - e.g., 15.234 → 15.2
    return (Math.round(amount * 10) / 10).toLocaleString(undefined, { maximumFractionDigits: 1 });
  } else if (amount >= 1) {
    // 1 digit: show 2 decimals - e.g., 5.674 → 5.67
    return amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
  } else {
    // Less than $1: show significant digits only
    return amount < 0.01 && amount > 0
      ? amount.toFixed(6).replace(/\.?0+$/, '')
      : amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
}

// Calculate the total USD value from a bucket's holdings
export function calculateCurrentFromHoldings(
  holdings: { [currency: string]: number } | undefined,
  exchangeRates: { [key: string]: number }
): number {
  if (!holdings) return 0;
  
  let totalUSD = 0;
  
  Object.entries(holdings).forEach(([currency, amount]) => {
    if (currency === 'USD') {
      totalUSD += amount;
    } else {
      const rate = exchangeRates[currency];
      if (rate && !isNaN(rate)) {
        totalUSD += amount * rate;
      }
    }
  });
  
  return totalUSD;
}
