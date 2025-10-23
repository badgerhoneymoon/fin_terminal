'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Currency } from '@/lib/types';
import { useBudget } from '@/lib/context/budget-context';
import { ArrowLeftRight } from 'lucide-react';

export function CurrencyConverterModal() {
  const { state } = useBudget();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [displayAmount, setDisplayAmount] = useState('');
  const [fromCurrency, setFromCurrency] = useState<Currency>('USD');
  const [toCurrency, setToCurrency] = useState<Currency>('VND');
  const [result, setResult] = useState<number | null>(null);

  const currencies: Currency[] = ['VND', 'USD', 'RUB'];

  useEffect(() => {
    if (amount && !isNaN(parseFloat(amount))) {
      const amountNum = parseFloat(amount);
      const fromRate = state.exchangeRates.rates[fromCurrency] || 1;
      const toRate = state.exchangeRates.rates[toCurrency] || 1;

      // Exchange rates are stored as: 1 unit of currency = X USD
      // e.g., rates['VND'] = 0.00004 means 1 VND = 0.00004 USD
      // To convert: amount in fromCurrency -> USD -> toCurrency
      const amountInUSD = amountNum * fromRate; // Convert to USD
      const convertedAmount = amountInUSD / toRate; // Convert from USD to target

      setResult(convertedAmount);
    } else {
      setResult(null);
    }
  }, [amount, fromCurrency, toCurrency, state.exchangeRates.rates]);

  const swapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Remove all non-digit and non-decimal characters
    const cleaned = value.replace(/[^\d.]/g, '');

    // Prevent multiple decimals
    const parts = cleaned.split('.');
    const formatted = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;

    setAmount(formatted);

    // Format for display with thousand separators
    if (formatted) {
      const num = parseFloat(formatted);
      if (!isNaN(num)) {
        setDisplayAmount(num.toLocaleString('en-US'));
      } else {
        setDisplayAmount(formatted);
      }
    } else {
      setDisplayAmount('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-black border-green-400 text-green-400 hover:bg-green-400 hover:text-black"
        >
          <ArrowLeftRight className="w-4 h-4 mr-1" />
          CONVERTER
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-black border-green-400 text-green-400">
        <DialogHeader>
          <DialogTitle className="text-green-400">CURRENCY CONVERTER</DialogTitle>
          <DialogDescription className="text-green-400/70">
            Quick conversion between VND, USD, and RUB
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* From Currency */}
          <div className="space-y-3">
            <Label className="text-green-400 text-sm">From</Label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={displayAmount}
                onChange={handleAmountChange}
                placeholder="Enter amount"
                className="flex-1 h-12 bg-black border-green-400 text-green-400 placeholder:text-green-400/50 text-lg"
                autoFocus
              />
              <div className="flex border border-green-400 rounded-md overflow-hidden h-12">
                {currencies.map((curr) => (
                  <button
                    key={curr}
                    onClick={() => {
                      setFromCurrency(curr);
                      // Auto-switch "To" if same currency selected
                      if (curr === toCurrency) {
                        const otherCurrency = currencies.find(c => c !== curr);
                        if (otherCurrency) setToCurrency(otherCurrency);
                      }
                    }}
                    disabled={currencies.length === 1}
                    className={`px-3 text-lg font-mono transition-colors ${
                      fromCurrency === curr
                        ? 'bg-green-400 text-black'
                        : 'bg-black text-green-400 hover:bg-green-400/20'
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <button
              onClick={swapCurrencies}
              className="p-2 text-green-400 hover:text-green-300 transition-colors hover:scale-110 transform duration-200"
              title="Swap currencies"
            >
              <ArrowLeftRight className="w-6 h-6" />
            </button>
          </div>

          {/* To Currency */}
          <div className="space-y-3">
            <Label className="text-green-400 text-sm">To</Label>
            <div className="flex gap-2">
              <div className="flex-1 px-4 h-12 bg-black border border-green-400 rounded-md text-green-400 text-lg font-mono flex items-center">
                {result !== null ? (
                  Math.round(result) === 0
                    ? result.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : Math.round(result).toLocaleString('en-US')
                ) : '—'}
              </div>
              <div className="flex border border-green-400 rounded-md overflow-hidden h-12">
                {currencies.map((curr) => (
                  <button
                    key={curr}
                    onClick={() => {
                      setToCurrency(curr);
                      // Auto-switch "From" if same currency selected
                      if (curr === fromCurrency) {
                        const otherCurrency = currencies.find(c => c !== curr);
                        if (otherCurrency) setFromCurrency(otherCurrency);
                      }
                    }}
                    disabled={currencies.length === 1}
                    className={`px-3 text-lg font-mono transition-colors ${
                      toCurrency === curr
                        ? 'bg-green-400 text-black'
                        : 'bg-black text-green-400 hover:bg-green-400/20'
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Exchange Rate Info */}
          {amount && result !== null && (
            <div className="text-xs text-green-400/60 text-center font-mono pt-2 border-t border-green-400/20">
              1 {fromCurrency} = {(() => {
                const rate = result / parseFloat(amount);
                return Math.round(rate) === 0
                  ? rate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : Math.round(rate).toLocaleString('en-US');
              })()} {toCurrency}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() => setOpen(false)}
            className="bg-green-400 text-black hover:bg-green-500"
          >
            CLOSE
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
