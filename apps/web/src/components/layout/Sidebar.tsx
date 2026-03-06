import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, School, Users, Truck, Car, Map, History,
  DollarSign, Radio, MessageCircle, LogOut, Settings, UserCircle,
  ChevronDown, LucideIcon
} from 'lucide-react';
import { useAuthStore } from '../../stores/auth';
import { clsx } from 'clsx';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
}

interface NavSection {
  label: string;
  icon: LucideIcon;
  items?: NavItem[];
  to?: string;
}

const navigation: NavSection[] = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    to: '/dashboard',
  },
  {
    label: 'Cadastros',
    icon: Users,
    items: [
      { to: '/escolas', icon: School, label: 'Escolas' },
      { to: '/alunos', icon: Users, label: 'Alunos' },
      { to: '/motoristas', icon: Truck, label: 'Motoristas' },
      { to: '/veiculos', icon: Car, label: 'Veiculos' },
    ],
  },
  {
    label: 'Operacoes',
    icon: Map,
    items: [
      { to: '/rotas', icon: Map, label: 'Rotas' },
      { to: '/rastreamento', icon: Radio, label: 'Ao Vivo' },
      { to: '/historico', icon: History, label: 'Historico' },
    ],
  },
  {
    label: 'Financeiro',
    icon: DollarSign,
    to: '/financeiro',
  },
  {
    label: 'Mensagens',
    icon: MessageCircle,
    to: '/mensagens',
  },
];

const bottomNav: NavItem[] = [
  { to: '/configuracoes', icon: Settings, label: 'Configuracoes' },
  { to: '/perfil', icon: UserCircle, label: 'Perfil' },
];

export function Sidebar() {
  const { logout } = useAuthStore();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const toggleExpand = (label: string) => {
    setExpanded(expanded === label ? null : label);
  };

  return (
    <motion.aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setExpanded(null);
      }}
      animate={{ width: isHovered ? 220 : 64 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="flex flex-col h-full bg-surface border-r border-border/50 shrink-0"
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-border/50">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
          <span className="text-surface font-bold text-sm">R</span>
        </div>
        <AnimatePresence>
          {isHovered && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="ml-3 font-semibold text-text whitespace-nowrap overflow-hidden"
            >
              RotaVans
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto overflow-x-hidden">
        {navigation.map((section) => (
          <div key={section.label} className="mb-1">
            {section.to ? (
              // Direct link
              <NavLink
                to={section.to}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-accent-muted text-text'
                      : 'text-text-muted hover:text-text hover:bg-surface2'
                  )
                }
              >
                <section.icon size={20} strokeWidth={1.5} className="shrink-0" />
                <AnimatePresence>
                  {isHovered && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="whitespace-nowrap"
                    >
                      {section.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            ) : (
              // Expandable section
              <>
                <button
                  onClick={() => toggleExpand(section.label)}
                  className={clsx(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                    expanded === section.label
                      ? 'bg-surface2 text-text'
                      : 'text-text-muted hover:text-text hover:bg-surface2'
                  )}
                >
                  <section.icon size={20} strokeWidth={1.5} className="shrink-0" />
                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 flex items-center justify-between"
                      >
                        <span className="whitespace-nowrap">{section.label}</span>
                        <ChevronDown
                          size={16}
                          className={clsx(
                            'transition-transform duration-200',
                            expanded === section.label && 'rotate-180'
                          )}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
                <AnimatePresence>
                  {expanded === section.label && isHovered && section.items && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-4 mt-1 space-y-0.5">
                        {section.items.map((item) => (
                          <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                              clsx(
                                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150',
                                isActive
                                  ? 'bg-accent-muted text-text font-medium'
                                  : 'text-text-muted hover:text-text hover:bg-surface2'
                              )
                            }
                          >
                            <item.icon size={16} strokeWidth={1.5} />
                            <span>{item.label}</span>
                          </NavLink>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="py-3 px-2 border-t border-border/50">
        {bottomNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 mb-1',
                isActive
                  ? 'bg-accent-muted text-text'
                  : 'text-text-muted hover:text-text hover:bg-surface2'
              )
            }
          >
            <item.icon size={20} strokeWidth={1.5} className="shrink-0" />
            <AnimatePresence>
              {isHovered && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                     text-text-muted hover:text-danger hover:bg-danger-muted transition-all duration-150"
        >
          <LogOut size={20} strokeWidth={1.5} className="shrink-0" />
          <AnimatePresence>
            {isHovered && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="whitespace-nowrap"
              >
                Sair
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
