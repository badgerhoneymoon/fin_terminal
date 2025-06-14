// Currency-specific thresholds for filtering and cleanup
export const CURRENCY_THRESHOLDS: { [key: string]: number } = {
  BTC: 0.00001, // Very small threshold for Bitcoin
  USDT: 0.01,   // Standard threshold for stablecoins
  USD: 0.01,
  EUR: 0.01,
  GBP: 0.01,
  RUB: 1,       // Higher threshold for Rubles due to larger numbers
  IDR: 100,     // Much higher for Indonesian Rupiah
  VND: 100      // Much higher for Vietnamese Dong
}; 