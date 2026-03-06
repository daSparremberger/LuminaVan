import { Bell, MessageCircle, Search } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useAuthStore } from '../../stores/auth';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/escolas': 'Escolas',
  '/alunos': 'Alunos',
  '/motoristas': 'Motoristas',
  '/veiculos': 'Veículos',
  '/rotas': 'Rotas',
  '/rastreamento': 'Rastreamento',
  '/historico': 'Histórico',
  '/financeiro': 'Financeiro',
  '/mensagens': 'Mensagens',
  '/perfil': 'Perfil',
  '/configuracoes': 'Configurações',
};

const searchablePages = [
  { route: '/dashboard', terms: ['dashboard', 'painel', 'início'] },
  { route: '/escolas', terms: ['escola', 'escolas'] },
  { route: '/alunos', terms: ['aluno', 'alunos'] },
  { route: '/motoristas', terms: ['motorista', 'motoristas'] },
  { route: '/veiculos', terms: ['veículo', 'veiculos', 'veículos'] },
  { route: '/rotas', terms: ['rota', 'rotas'] },
  { route: '/rastreamento', terms: ['rastreamento', 'ao vivo', 'mapa'] },
  { route: '/historico', terms: ['histórico', 'historico'] },
  { route: '/financeiro', terms: ['financeiro', 'receitas', 'despesas'] },
  { route: '/mensagens', terms: ['mensagem', 'mensagens', 'chat'] },
  { route: '/perfil', terms: ['perfil', 'conta'] },
  { route: '/configuracoes', terms: ['configurações', 'configuracoes', 'ajustes'] },
];

function normalizeText(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function Header() {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const title = pageTitles[location.pathname] || 'Dashboard';
  const normalizedQuery = useMemo(() => normalizeText(query), [query]);

  function handleSearch() {
    if (!normalizedQuery) return;

    const match = searchablePages.find((page) =>
      page.terms.some((term) => normalizeText(term).includes(normalizedQuery) || normalizedQuery.includes(normalizeText(term)))
    );

    if (match) {
      navigate(match.route);
    }
  }

  return (
    <header className="flex h-[76px] items-center justify-between border-b border-border/80 px-4 md:px-6">
      <h1 className="font-heading text-xl font-bold text-text md:text-2xl">{title}</h1>

      <div className="mx-4 hidden max-w-md flex-1 md:block lg:mx-8">
        <label className="relative block" htmlFor="header-search">
          <Search
            size={18}
            strokeWidth={1.5}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            id="header-search"
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleSearch();
            }}
            placeholder="Pesquisar página..."
            className="h-11 w-full rounded-full border border-border bg-surface2 pl-11 pr-24 text-sm text-text placeholder:text-text-muted transition-all duration-200 focus:border-success focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSearch}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-accent px-4 py-1.5 text-xs font-medium text-surface transition-colors hover:bg-accent-hover"
          >
            Buscar
          </button>
        </label>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
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



