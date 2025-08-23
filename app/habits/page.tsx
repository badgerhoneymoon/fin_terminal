import { HabitProvider } from '@/lib/context/habit-context';
import { HabitTerminal } from '@/components/habits/HabitTerminal';

export default function HabitsPage() {
  return (
    <HabitProvider>
      <HabitTerminal />
    </HabitProvider>
  );
}