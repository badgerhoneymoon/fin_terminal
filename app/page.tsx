import { BudgetProvider } from '@/lib/budget-context';
import { BudgetDrop } from '@/components/BudgetDrop';

export default function Home() {
  return (
    <BudgetProvider>
      <BudgetDrop />
    </BudgetProvider>
  );
}
