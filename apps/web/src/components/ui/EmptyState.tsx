import { LucideIcon } from 'lucide-react';

export function EmptyState({ icon: Icon, message }: { icon: LucideIcon; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-beige/40">
      <Icon size={40} className="mb-3 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
