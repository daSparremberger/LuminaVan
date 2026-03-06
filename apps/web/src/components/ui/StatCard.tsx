import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerItem } from './PageTransition';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
  subtitle?: string;
}

export function StatCard({ label, value, icon: Icon, trend, subtitle }: StatCardProps) {
  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className="bg-surface border border-border/50 rounded-2xl p-5
                 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-center gap-3 mb-4">
        <Icon size={18} strokeWidth={1.5} className="text-text-muted" />
        <span className="text-sm font-medium text-text-muted">{label}</span>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-semibold text-text tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-text-muted mt-1">{subtitle}</p>
          )}
        </div>

        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
            trend.positive
              ? 'bg-success-muted text-success'
              : 'bg-danger-muted text-danger'
          }`}>
            <span>{trend.positive ? '↑' : '↓'}</span>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
