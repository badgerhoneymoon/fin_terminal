export type Currency = 'USD' | 'EUR' | 'GBP' | 'RUB' | 'IDR' | 'VND' | 'BTC' | 'USDT';

export interface Chip {
  id: string;
  amount: number;
  currency: Currency;
  usdRate: number;
  createdAt: Date;
  isNegative?: boolean;
  note?: string;
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
  note?: string;
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
  | { type: 'MINT_CHIP'; payload: { amount: number; currency: Currency; isNegative?: boolean; note?: string } }
  | { type: 'DROP_CHIP'; payload: { chipId: string; bucketId: string } }
  | { type: 'REMOVE_CHIP'; payload: { chipId: string } }
  | { type: 'CLEAR_CHIPS' }
  | { type: 'RESET_BUCKET'; payload: { bucketId: string } }
  | { type: 'ADD_BUCKET'; payload: { name: string; type: 'fund' | 'debt'; target: number; currency: Currency; creditLimit?: number; milestones?: number[] } }
  | { type: 'DELETE_BUCKET'; payload: { bucketId: string } }

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

// Habit Tracker Types
export interface Habit {
  id: string;
  name: string;
  description?: string;
  weekStart: Date; // Monday of the week this habit is for
  completions: boolean[]; // Array of 7 booleans (Mon-Sun)
  target: number; // How many days needed for success (default 6)
  createdAt: Date;
}

export interface HabitState {
  habits: Habit[];
  currentWeekStart: Date;
  soundEnabled: boolean;
}

export type HabitAction = 
  | { type: 'CREATE_HABIT'; payload: { name: string; description?: string; target?: number } }
  | { type: 'TOGGLE_COMPLETION'; payload: { habitId: string; dayIndex: number } }
  | { type: 'DELETE_HABIT'; payload: { habitId: string } }
  | { type: 'SET_WEEK'; payload: { weekStart: Date } }
  | { type: 'TOGGLE_SOUND' }
  | { type: 'IMPORT_DATA'; payload: HabitState }
  | { type: 'RESET_STATE' };

export const DAYS_OF_WEEK = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;

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
    name: 'VISA FEES',
    type: 'fund',
    current: 0,
    target: 7000,
    currency: 'USD',
    milestones: [3500, 5250],
    completedMilestones: []
  },
  {
    id: 'm4-max',
    name: 'M4 MAX',
    type: 'fund',
    current: 0,
    target: 4000,
    currency: 'USD',
    milestones: [1000, 2000, 3000],
    completedMilestones: []
  }
]; 