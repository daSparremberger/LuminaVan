import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'accent' | 'accent2' | 'warn';
}

export function StatCard({ label, value, icon: Icon, color = 'accent' }: Props) {
  const c = {
    accent: 'text-accent',
    accent2: 'text-accent2',
    warn: 'text-warn',
  };
  return (
    <div className="flex items-center gap-4">
      <div className={clsx('p-3 rounded-lg bg-beige/5', c[color])}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-beige/30 text-xs uppercase tracking-wider">{label}</p>
        <p className="text-beige text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}
