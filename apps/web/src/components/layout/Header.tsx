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
    <header className="flex h-[76px] items-center justify-between border-b border-border/80 px-4 md:px-6">
      <h1 className="font-heading text-xl font-bold text-text md:text-2xl">{title}</h1>

      <div className="mx-4 hidden max-w-md flex-1 md:block lg:mx-8">
        <label className="relative block">
          <Search
            size={18}
            strokeWidth={1.5}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Search anything..."
            className="h-11 w-full rounded-full border border-border bg-surface2 pl-11 pr-4 text-sm text-text placeholder:text-text-muted transition-all duration-200 focus:border-success/50 focus:outline-none"
          />
        </label>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <button className="hidden h-10 items-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-surface transition-colors duration-150 hover:bg-accent-hover sm:flex">
          <Plus size={16} strokeWidth={2} />
          <span>Create</span>
        </button>

        <div className="flex items-center gap-1 rounded-full border border-border bg-surface2 p-1">
          <ThemeToggle />

          <button className="relative flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-150 hover:bg-surface">
            <Bell size={18} strokeWidth={1.5} className="text-text-muted" />
          </button>

          <button className="relative flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-150 hover:bg-surface">
            <MessageCircle size={18} strokeWidth={1.5} className="text-text-muted" />
          </button>
        </div>

        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border bg-surface2">
          {user?.nome ? (
            <span className="text-sm font-semibold text-text">
              {user.nome.charAt(0).toUpperCase()}
            </span>
          ) : (
            <span className="text-sm font-medium text-text-muted">?</span>
          )}
        </div>
      </div>
    </header>
  );
}


