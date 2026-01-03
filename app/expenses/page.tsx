import { ExpenseProvider } from '@/lib/context/expense-context';
import { ExpenseTerminal } from '@/components/expenses/ExpenseTerminal';

export default function ExpensesPage() {
  return (
    <ExpenseProvider>
      <ExpenseTerminal />
    </ExpenseProvider>
  );
}
