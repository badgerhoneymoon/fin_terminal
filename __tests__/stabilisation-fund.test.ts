import { budgetReducer, initialState } from '@/lib/reducers/budget-reducer';
import type { BudgetState, Currency } from '@/lib/types';

// Helper to get bucket by id
const getBucket = (state: BudgetState, id: string) => {
  const bucket = state.buckets.find(b => b.id === id);
  if (!bucket) {
    throw new Error(`Bucket with id "${id}" not found in state`);
  }
  return bucket;
};

describe('Stabilisation Fund – currency chip allocation', () => {
  it('handles USD and EUR chip additions with correct conversion & holdings update', () => {
    // Arrange – prepare state with known exchange rates
    let state: BudgetState = {
      ...initialState,
      exchangeRates: {
        rates: {
          USD: 1,
          EUR: 1.1 // 1 EUR → 1.1 USD
        },
        lastUpdated: new Date(),
        status: 'success'
      }
    };

    const fundId = 'stabilisation-fund';
    const startingCurrent = getBucket(state, fundId).current; // 340 per DEFAULT_BUCKETS

    // Act – mint & drop USD 100 chip
    state = budgetReducer(state, {
      type: 'MINT_CHIP',
      payload: { amount: 100, currency: 'USD', note: 'Test salary payment' }
    });
    const usdChip = state.chips.find(c => c.currency === 'USD')!;
    state = budgetReducer(state, {
      type: 'DROP_CHIP',
      payload: { chipId: usdChip.id, bucketId: fundId }
    });

    // Assert – current increases by 100 USD, holdings track USD 100
    let fund = getBucket(state, fundId);
    expect(fund.current).toBe(startingCurrent + 100);
    expect(fund.holdings?.USD).toBe(100);
    
    // Assert – note is preserved in transaction
    const transaction = state.transactions.find(t => t.bucketId === fundId);
    expect(transaction?.note).toBe('Test salary payment');

    // Act – mint & drop EUR 100 chip (worth 110 USD)
    state = budgetReducer(state, {
      type: 'MINT_CHIP',
      payload: { amount: 100, currency: 'EUR' }
    });
    const eurChip = state.chips.find(c => c.currency === 'EUR')!;
    state = budgetReducer(state, {
      type: 'DROP_CHIP',
      payload: { chipId: eurChip.id, bucketId: fundId }
    });

    // Assert – current increases by 110 USD equivalent, holdings track EUR 100
    fund = getBucket(state, fundId);
    expect(fund.current).toBeCloseTo(startingCurrent + 100 + 110, 5);
    expect(fund.holdings?.EUR).toBe(100);
  });

  it('caps at target & creates remainder chip when over-funded', () => {
    // Arrange
    let state: BudgetState = {
      ...initialState,
      exchangeRates: {
        rates: {
          USD: 1
        },
        lastUpdated: new Date(),
        status: 'success'
      }
    };

    const fundId = 'stabilisation-fund';
    const fund = getBucket(state, fundId);
    const amountNeeded = fund.target - fund.current; // 1 160 USD based on default values

    // Act – mint a chip larger than remaining need
    const chipAmount = amountNeeded + 840; // 2 000 USD total
    state = budgetReducer(state, {
      type: 'MINT_CHIP',
      payload: { amount: chipAmount, currency: 'USD' }
    });
    const bigChip = state.chips.find(c => c.currency === 'USD')!;
    state = budgetReducer(state, {
      type: 'DROP_CHIP',
      payload: { chipId: bigChip.id, bucketId: fundId }
    });

    // Assert – fund is capped at target value
    const updatedFund = getBucket(state, fundId);
    expect(updatedFund.current).toBe(updatedFund.target);

    // A remainder chip should be present matching the unused amount (840 USD)
    expect(state.chips).toHaveLength(1);
    const remainder = state.chips[0];
    expect(remainder.amount).toBe(840);
    expect(remainder.currency).toBe('USD');

    // Holdings include the full original chip amount (2 000 USD)
    expect(updatedFund.holdings?.USD).toBe(chipAmount);
  });
}); 