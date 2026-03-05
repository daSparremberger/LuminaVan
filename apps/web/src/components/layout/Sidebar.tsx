import { NavLink } from 'react-router-dom';
import { LayoutDashboard, School, Users, Truck, Car, Map, History, DollarSign, Radio, MessageCircle, LogOut } from 'lucide-react';
import { useAuth } from '../../stores/auth';
import { clsx } from 'clsx';
import { LampAnimation } from '../ui/LampAnimation';

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/escolas', icon: School, label: 'Escolas' },
  { to: '/alunos', icon: Users, label: 'Alunos' },
  { to: '/motoristas', icon: Truck, label: 'Motoristas' },
  { to: '/veiculos', icon: Car, label: 'Veículos' },
  { to: '/rotas', icon: Map, label: 'Rotas' },
  { to: '/rastreamento', icon: Radio, label: 'Ao Vivo' },
  { to: '/historico', icon: History, label: 'Histórico' },
  { to: '/financeiro', icon: DollarSign, label: 'Financeiro' },
  { to: '/mensagens', icon: MessageCircle, label: 'Mensagens' },
];

export function Sidebar() {
  const { logout, profile } = useAuth();
  return (
    <aside className="relative flex flex-col w-16 lg:w-56 h-screen bg-bg shrink-0 overflow-hidden">
      {/* Lamp Animation at top with logo */}
      <div className="relative h-44">
        <LampAnimation height={176} />
        {/* Logo centered under lamp light */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pt-8">
          <span className="hidden lg:block font-bold text-beige text-xl tracking-wide drop-shadow-[0_0_20px_rgba(247,175,39,0.4)]">
            RotaVans
          </span>
          <span className="lg:hidden font-bold text-beige text-lg drop-shadow-[0_0_20px_rgba(247,175,39,0.4)]">
            R
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex-1 py-2 space-y-0.5 px-2">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) =>
            clsx('flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              isActive
                ? 'text-accent'
                : 'text-beige/50 hover:text-beige/80')}>
            <Icon size={18} className="shrink-0" />
            <span className="hidden lg:block">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="relative z-10 px-2 pb-4 pt-2">
        <div className="hidden lg:block px-3 pb-2 text-xs text-beige/30 truncate">{profile?.nome}</div>
        <button onClick={logout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-beige/50 hover:text-beige/80 w-full transition-all duration-200">
          <LogOut size={18} className="shrink-0" /><span className="hidden lg:block">Sair</span>
        </button>
      </div>
    </aside>
  );
}
