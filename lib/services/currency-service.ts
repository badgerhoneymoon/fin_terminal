export interface CurrencyResponse {
  rates: { [key: string]: number };
  lastUpdated: Date;
  fromCache?: boolean;
}

export class CurrencyService {
  private static readonly API_BASE = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies';
  private static readonly BASE_CURRENCY = 'usd';
  private static readonly CACHE_KEY = 'budgetdrop.exchangeRates';
  private static readonly CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  private static saveToCache(data: CurrencyResponse): void {
    try {
      const cacheData = {
        ...data,
        lastUpdated: data.lastUpdated.toISOString()
      };
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
      console.log('Exchange rates saved to localStorage cache');
    } catch (error) {
      console.error('Failed to save exchange rates to cache:', error);
    }
  }

  private static loadFromCache(): CurrencyResponse | null {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) return null;

      const data = JSON.parse(cached);
      const lastUpdated = new Date(data.lastUpdated);
      
      // Check if cache is expired (older than 24 hours)
      const now = new Date();
      if (now.getTime() - lastUpdated.getTime() > this.CACHE_EXPIRY) {
        console.log('Cached exchange rates are expired');
        return null;
      }

      console.log('Loaded exchange rates from localStorage cache');
      return {
        rates: data.rates,
        lastUpdated,
        fromCache: true
      };
    } catch (error) {
      console.error('Failed to load exchange rates from cache:', error);
      return null;
    }
  }

  static async fetchExchangeRates(): Promise<CurrencyResponse> {
    try {
      const response = await fetch(`${this.API_BASE}/${this.BASE_CURRENCY}.json`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // The API returns data in format: { usd: { eur: 0.85, gbp: 0.73, ... } }
      const rates = data[this.BASE_CURRENCY];
      
      if (!rates) {
        throw new Error('Invalid API response format');
      }

      // Convert to our expected format (rates TO convert FROM other currencies TO USD)
      // The API gives us rates FROM USD TO other currencies (1 USD = X EUR)
      // But we need rates FROM other currencies TO USD (1 EUR = Y USD)
      // So we need to invert the rates (except for USD which stays 1)
      const formattedRates: { [key: string]: number } = {
        USD: 1, // Base currency
      };

      // Map the currencies we support
      const currencyMap: { [key: string]: string } = {
        'eur': 'EUR',
        'gbp': 'GBP', 
        'rub': 'RUB',
        'idr': 'IDR',
        'vnd': 'VND',
        'btc': 'BTC',
        'usdt': 'USDT'
      };

      Object.entries(currencyMap).forEach(([apiKey, ourKey]) => {
        if (rates[apiKey] !== undefined && rates[apiKey] !== 0) {
          // Invert the rate: if 1 USD = 0.85 EUR, then 1 EUR = 1/0.85 USD
          formattedRates[ourKey] = 1 / rates[apiKey];
        }
      });

      const result: CurrencyResponse = {
        rates: formattedRates,
        lastUpdated: new Date(),
        fromCache: false
      };

      // Save to cache on successful fetch
      this.saveToCache(result);

      return result;

    } catch (error) {
      console.error('Failed to fetch exchange rates from API:', error);
      
      // Try to use cached data as fallback
      const cachedData = this.loadFromCache();
      if (cachedData) {
        console.log('Using cached exchange rates as fallback');
        return cachedData;
      }
      
      // If no cache available, throw the original error
      throw error;
    }
  }
} 