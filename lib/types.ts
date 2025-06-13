export type Currency = 'USD' | 'EUR' | 'GBP' | 'RUB' | 'IDR' | 'VND' | 'BTC' | 'USDT';

export interface Chip {
  id: string;
  amount: number;
  currency: Currency;
  usdRate: number;
  createdAt: Date;
  isNegative?: boolean;
}

export interface Bucket {
  id: string;
  name: string;
  type: 'fund' | 'debt';
  current: number;
  target: number;
  currency: Currency;
  creditLimit?: number;
  milestones?: number[];
  completedMilestones: number[];
  holdings?: { [currency: string]: number };
}

export interface Transaction {
  id: string;
  chipId: string;
  bucketId: string;
  amount: number;
  timestamp: Date;
  type: 'add' | 'subtract';
  originalChipAmount?: number;
  originalChipCurrency?: Currency;
  usdRateAtTime?: number;
}

export interface ExchangeRates {
  rates: { [key: string]: number };
  lastUpdated: Date;
  status: 'loading' | 'success' | 'error' | 'cached';
}

export interface BudgetState {
  buckets: Bucket[];
  chips: Chip[];
  transactions: Transaction[];
  exchangeRates: ExchangeRates;
  soundEnabled: boolean;
}

export type BudgetAction = 
  | { type: 'MINT_CHIP'; payload: { amount: number; currency: Currency; isNegative?: boolean } }
  | { type: 'DROP_CHIP'; payload: { chipId: string; bucketId: string } }
  | { type: 'REMOVE_CHIP'; payload: { chipId: string } }
  | { type: 'CLEAR_CHIPS' }
  | { type: 'RESET_BUCKET'; payload: { bucketId: string } }
  | { type: 'UNDO_TRANSACTION'; payload: { transactionId: string } }
  | { type: 'DELETE_TRANSACTION'; payload: { transactionId: string } }
  | { type: 'UPDATE_TRANSACTION'; payload: { transactionId: string; newAmount: number } }
  | { type: 'CONVERT_CHIP_POLARITY'; payload: { chipId: string; isNegative: boolean } }
  | { type: 'TOGGLE_SOUND' }
  | { type: 'IMPORT_DATA'; payload: BudgetState }
  | { type: 'RESET_STATE' }
  | { type: 'UPDATE_EXCHANGE_RATES'; payload: { rates: { [key: string]: number }; lastUpdated: Date } }
  | { type: 'UPDATE_EXCHANGE_RATES_CACHED'; payload: { rates: { [key: string]: number }; lastUpdated: Date } }
  | { type: 'SET_EXCHANGE_RATES_LOADING' }
  | { type: 'SET_EXCHANGE_RATES_ERROR' };

export const CURRENCIES: { [key in Currency]: { symbol: string; name: string } } = {
  USD: { symbol: '$', name: 'US Dollar' },
  GBP: { symbol: '£', name: 'British Pound' },
  RUB: { symbol: '₽', name: 'Russian Ruble' },
  IDR: { symbol: 'Rp', name: 'Indonesian Rupiah' },
  VND: { symbol: '₫', name: 'Vietnamese Dong' },
  BTC: { symbol: '₿', name: 'Bitcoin' },
  USDT: { symbol: '$', name: 'Tether USD' },
  EUR: { symbol: '€', name: 'Euro' }
};

export const DEFAULT_BUCKETS: Bucket[] = [
  {
    id: 'stabilisation-fund',
    name: 'STABILISATION FUND',
    type: 'fund',
    current: 0,
    target: 1500,
    currency: 'USD',
    completedMilestones: []
  },
  {
    id: 'tinkoff-card',
    name: 'TINKOFF CARD',
    type: 'debt',
    current: 0,
    target: 0,
    currency: 'RUB',
    creditLimit: 474000,
    completedMilestones: []
  },
  {
    id: 'boa-card',
    name: 'BOA CARD', 
    type: 'debt',
    current: 0,
    target: 0,
    currency: 'USD',
    creditLimit: 2600,
    completedMilestones: []
  },
  {
    id: 'uk-global-visa',
    name: 'UK GLOBAL VISA',
    type: 'fund',
    current: 0,
    target: 3500,
    currency: 'GBP',
    milestones: [1750, 2625],
    completedMilestones: []
  }
]; 