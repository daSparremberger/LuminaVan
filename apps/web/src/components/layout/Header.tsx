import { Bell, User } from 'lucide-react';
import { SearchBar } from '../ui/SearchBar';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useAuthStore } from '../../stores/auth';

export function Header() {
  const { user } = useAuthStore();

  return (
    <header className="h-16 px-6 flex items-center justify-between border-b border-border/30 bg-surface/80 backdrop-blur-sm">
      {/* Left spacer */}
      <div className="w-32" />

      {/* Center - Search */}
      <SearchBar placeholder="Pesquisar alunos, rotas, veiculos..." />

      {/* Right - Actions */}
      <div className="flex items-center gap-3">
        <ThemeToggle />

        <button className="relative w-10 h-10 rounded-xl bg-surface2 hover:bg-surface3
                          flex items-center justify-center transition-colors duration-200">
          <Bell size={18} className="text-text-muted" />
          {/* Notification dot */}
          <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full" />
        </button>

        <button className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-surface2 transition-colors duration-200">
          <div className="w-8 h-8 rounded-lg bg-accent-muted flex items-center justify-center">
            <User size={16} className="text-accent" />
          </div>
          <span className="text-sm text-text-muted hidden lg:block max-w-24 truncate">
            {user?.nome?.split(' ')[0]}
          </span>
        </button>
      </div>
    </header>
  );
}
