import { Bell, MessageCircle, Search, Plus } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useAuthStore } from '../../stores/auth';
import { useLocation } from 'react-router-dom';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/escolas': 'Escolas',
  '/alunos': 'Alunos',
  '/motoristas': 'Motoristas',
  '/veiculos': 'Veiculos',
  '/rotas': 'Rotas',
  '/rastreamento': 'Rastreamento',
  '/historico': 'Historico',
  '/financeiro': 'Financeiro',
  '/mensagens': 'Mensagens',
  '/perfil': 'Perfil',
  '/configuracoes': 'Configuracoes',
};

export function Header() {
  const { user } = useAuthStore();
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Dashboard';

  return (
    <header className="h-14 px-6 flex items-center justify-between border-b border-border/50 bg-surface">
      {/* Left - Title */}
      <h1 className="text-xl font-semibold text-text">{title}</h1>

      {/* Center - Search */}
      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search
            size={18}
            strokeWidth={1.5}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Search anything..."
            className="w-full h-10 pl-11 pr-4 bg-surface2 border border-border/50 rounded-xl
                       text-text text-sm placeholder:text-text-muted
                       focus:outline-none focus:border-text-muted focus:bg-surface
                       transition-all duration-200"
          />
        </div>
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-2">
        <button className="h-9 px-4 bg-accent hover:bg-accent-hover text-surface text-sm font-medium
                          rounded-xl flex items-center gap-2 transition-colors duration-150">
          <Plus size={16} strokeWidth={2} />
          <span>Create</span>
        </button>

        <ThemeToggle />

        <button className="relative w-9 h-9 rounded-xl hover:bg-surface2
                          flex items-center justify-center transition-colors duration-150">
          <Bell size={18} strokeWidth={1.5} className="text-text-muted" />
        </button>

        <button className="relative w-9 h-9 rounded-xl hover:bg-surface2
                          flex items-center justify-center transition-colors duration-150">
          <MessageCircle size={18} strokeWidth={1.5} className="text-text-muted" />
        </button>

        <button className="w-9 h-9 rounded-xl overflow-hidden bg-surface2 flex items-center justify-center">
          {user?.nome ? (
            <span className="text-sm font-medium text-text">
              {user.nome.charAt(0).toUpperCase()}
            </span>
          ) : (
            <span className="text-sm font-medium text-text-muted">?</span>
          )}
        </button>
      </div>
    </header>
  );
}
