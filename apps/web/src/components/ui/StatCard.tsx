import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerItem } from './PageTransition';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
}

export function StatCard({ label, value, icon: Icon, trend }: StatCardProps) {
  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
      className="bg-surface2 border border-border/30 rounded-2xl p-5
                 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5
                 transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-accent-muted flex items-center justify-center">
          <Icon size={20} className="text-accent" />
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
            trend.positive
              ? 'bg-green-500/10 text-green-500'
              : 'bg-red-500/10 text-red-500'
          }`}>
            {trend.positive ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-text mb-1">{value}</p>
      <p className="text-sm text-text-muted">{label}</p>
    </motion.div>
  );
}
