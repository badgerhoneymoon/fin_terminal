import { BudgetProvider } from '@/lib/context/budget-context';
import { BudgetDrop } from '@/components/budget/BudgetDrop';

export default function Home() {
  return (
    <BudgetProvider>
      <BudgetDrop />
    </BudgetProvider>
  );
}
