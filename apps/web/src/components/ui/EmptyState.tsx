import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, message, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="flex flex-col items-center justify-center py-20"
    >
      <div className="w-16 h-16 rounded-2xl bg-surface2 flex items-center justify-center mb-4">
        <Icon size={28} className="text-text-muted/50" />
      </div>
      <p className="text-text-muted text-center max-w-xs">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}
