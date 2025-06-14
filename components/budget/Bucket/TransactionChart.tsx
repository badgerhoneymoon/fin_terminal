'use client';

import { Transaction, Bucket as BucketType, CURRENCIES } from '@/lib/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { formatSmartAmount } from '@/lib/utils';

interface TransactionChartProps {
  transactions: Transaction[];
  bucket: BucketType;
}

interface ChartDataPoint {
  date: string;
  amount: number;
  cumulative: number;
  type: 'add' | 'subtract';
}

export function TransactionChart({ transactions, bucket }: TransactionChartProps) {
  const currency = CURRENCIES[bucket.currency];

  // Process transactions to create chart data
  const chartData: ChartDataPoint[] = transactions
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .reduce((acc, transaction, index) => {
      const prevCumulative = index > 0 ? acc[index - 1].cumulative : 0;
      const amount = transaction.type === 'add' ? transaction.amount : -transaction.amount;
      
      acc.push({
        date: new Date(transaction.timestamp).toLocaleDateString(),
        amount: transaction.amount,
        cumulative: prevCumulative + amount,
        type: transaction.type
      });
      
      return acc;
    }, [] as ChartDataPoint[]);

  // Determine Y-axis domain to ensure target line is visible
  const maxCumulative = chartData.length > 0 ? Math.max(...chartData.map(d => d.cumulative)) : 0;
  const yDomainMax = bucket.type === 'fund' ? Math.max(maxCumulative, bucket.target) : maxCumulative;

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ payload: ChartDataPoint }>; label?: string }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      // For debt buckets, reverse the color logic
      const isPositiveAction = bucket.type === 'debt' 
        ? data.type === 'subtract'  // Paying off debt is good
        : data.type === 'add';      // Adding to savings is good
      
      const actionText = bucket.type === 'debt'
        ? (data.type === 'subtract' ? 'Paid Off' : 'Increased Debt')
        : (data.type === 'add' ? 'Added' : 'Removed');
      
      return (
        <div className="bg-black/90 border border-[var(--text-primary)] rounded-md p-3 text-sm backdrop-blur-sm">
          <p className="text-[var(--text-primary)] font-semibold mb-1">{label}</p>
          <p className="text-white">
            Amount: {currency.symbol}{formatSmartAmount(data.amount, bucket.currency)}
          </p>
          <p className="text-[var(--text-primary)] opacity-80">
            Running Total: {currency.symbol}{formatSmartAmount(data.cumulative, bucket.currency)}
          </p>
          <p className={`text-xs mt-1 ${isPositiveAction ? 'text-green-400' : 'text-red-400'}`}>
            {actionText}
          </p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--text-primary)] opacity-50">
        No transactions to display
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--text-primary)" opacity={0.2} />
          <XAxis 
            dataKey="date" 
            stroke="var(--text-primary)" 
            fontSize={12}
            opacity={0.7}
          />
          <YAxis 
            stroke="var(--text-primary)" 
            fontSize={12}
            opacity={0.7}
            domain={[0, yDomainMax]}
            tickFormatter={(value) => `${currency.symbol}${formatSmartAmount(value, bucket.currency)}`}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Show target line for fund buckets */}
          {bucket.type === 'fund' && (
            <ReferenceLine 
              y={bucket.target} 
              stroke="#00ff88" 
              strokeDasharray="8 4"
              strokeWidth={3}
            />
          )}
          
          <Line 
            type="monotone" 
            dataKey="cumulative" 
            stroke="var(--text-accent)" 
            strokeWidth={2}
            dot={{ fill: 'var(--text-accent)', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: 'var(--text-accent)', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 