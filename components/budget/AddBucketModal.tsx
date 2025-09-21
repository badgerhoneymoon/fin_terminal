'use client';

import { useState } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Currency, CURRENCIES } from '@/lib/types';
import { useBudget } from '@/lib/context/budget-context';
import { Plus } from 'lucide-react';

export function AddBucketModal() {
  const { dispatch } = useBudget();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'fund' | 'debt'>('fund');
  const [target, setTarget] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [milestones, setMilestones] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const targetAmount = parseFloat(target) || 0;
    const creditLimitAmount = type === 'debt' ? parseFloat(creditLimit) || 0 : undefined;
    const milestonesArray = milestones
      ? milestones.split(',').map(m => parseFloat(m.trim())).filter(m => !isNaN(m))
      : [];

    dispatch({
      type: 'ADD_BUCKET',
      payload: {
        name: name.toUpperCase(),
        type,
        target: type === 'fund' ? targetAmount : 0,
        currency,
        creditLimit: creditLimitAmount,
        milestones: type === 'fund' ? milestonesArray : undefined
      }
    });

    // Reset form
    setName('');
    setType('fund');
    setTarget('');
    setCreditLimit('');
    setCurrency('USD');
    setMilestones('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-black border-green-400 text-green-400 hover:bg-green-400 hover:text-black"
        >
          <Plus className="w-4 h-4 mr-1" />
          ADD BUCKET
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-black border-green-400 text-green-400">
        <DialogHeader>
          <DialogTitle className="text-green-400">ADD NEW BUCKET</DialogTitle>
          <DialogDescription className="text-green-400/70">
            Create a new fund or debt bucket to track
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-green-400">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              placeholder="e.g., EMERGENCY FUND"
              className="bg-black border-green-400 text-green-400 placeholder:text-green-400/50"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-green-400">Type</Label>
            <RadioGroup value={type} onValueChange={(v: string) => setType(v as 'fund' | 'debt')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fund" id="fund" className="border-green-400 text-green-400" />
                <Label htmlFor="fund" className="text-green-400 cursor-pointer">Fund (save up)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="debt" id="debt" className="border-green-400 text-green-400" />
                <Label htmlFor="debt" className="text-green-400 cursor-pointer">Debt (pay down)</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency" className="text-green-400">Currency</Label>
            <select
              id="currency"
              value={currency}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCurrency(e.target.value as Currency)}
              className="w-full px-3 py-2 bg-black border border-green-400 text-green-400 rounded-md"
              required
            >
              {Object.entries(CURRENCIES).map(([code, { symbol, name }]) => (
                <option key={code} value={code}>
                  {code} - {symbol} {name}
                </option>
              ))}
            </select>
          </div>

          {type === 'fund' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="target" className="text-green-400">Target Amount</Label>
                <Input
                  id="target"
                  type="number"
                  step="0.01"
                  min="0"
                  value={target}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTarget(e.target.value)}
                  placeholder="e.g., 5000"
                  className="bg-black border-green-400 text-green-400 placeholder:text-green-400/50"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="milestones" className="text-green-400">
                  Milestones (optional)
                </Label>
                <Input
                  id="milestones"
                  value={milestones}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMilestones(e.target.value)}
                  placeholder="e.g., 1000, 2500, 4000"
                  className="bg-black border-green-400 text-green-400 placeholder:text-green-400/50"
                />
                <p className="text-xs text-green-400/50">Comma-separated values</p>
              </div>
            </>
          )}

          {type === 'debt' && (
            <div className="space-y-2">
              <Label htmlFor="creditLimit" className="text-green-400">Credit Limit</Label>
              <Input
                id="creditLimit"
                type="number"
                step="0.01"
                min="0"
                value={creditLimit}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreditLimit(e.target.value)}
                placeholder="e.g., 5000"
                className="bg-black border-green-400 text-green-400 placeholder:text-green-400/50"
                required
              />
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="bg-black border-green-400 text-green-400 hover:bg-green-400 hover:text-black"
            >
              CANCEL
            </Button>
            <Button
              type="submit"
              className="bg-green-400 text-black hover:bg-green-500"
            >
              CREATE
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}