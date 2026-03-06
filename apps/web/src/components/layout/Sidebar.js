import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, School, Users, Truck, Car, Map, History, DollarSign, Radio, MessageCircle, LogOut, Settings, UserCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/auth';
import { clsx } from 'clsx';
import { useState } from 'react';
import { motion } from 'framer-motion';
const categories = [
    {
        label: 'Principal',
        items: [
            { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        ],
    },
    {
        label: 'Cadastros',
        items: [
            { to: '/escolas', icon: School, label: 'Escolas' },
            { to: '/alunos', icon: Users, label: 'Alunos' },
            { to: '/motoristas', icon: Truck, label: 'Motoristas' },
            { to: '/veiculos', icon: Car, label: 'Veiculos' },
        ],
    },
    {
        label: 'Operacoes',
        items: [
            { to: '/rotas', icon: Map, label: 'Rotas' },
            { to: '/rastreamento', icon: Radio, label: 'Ao Vivo' },
            { to: '/historico', icon: History, label: 'Historico' },
        ],
    },
    {
        label: 'Gestao',
        items: [
            { to: '/financeiro', icon: DollarSign, label: 'Financeiro' },
            { to: '/mensagens', icon: MessageCircle, label: 'Mensagens' },
        ],
    },
    {
        label: 'Sistema',
        items: [
            { to: '/configuracoes', icon: Settings, label: 'Configuracoes' },
            { to: '/perfil', icon: UserCircle, label: 'Perfil' },
        ],
    },
];
export function Sidebar() {
    const { logout, user } = useAuthStore();
    const [isExpanded, setIsExpanded] = useState(false);
    return (_jsxs(motion.aside, { onMouseEnter: () => setIsExpanded(true), onMouseLeave: () => setIsExpanded(false), animate: { width: isExpanded ? 240 : 72 }, transition: { duration: 0.2, ease: 'easeOut' }, className: "relative flex flex-col h-full bg-surface shrink-0 border-r border-border/30", children: [_jsxs("div", { className: "h-16 flex items-center justify-center border-b border-border/30", children: [_jsx(motion.div, { animate: { opacity: isExpanded ? 1 : 0, width: isExpanded ? 'auto' : 0 }, transition: { duration: 0.15 }, className: "overflow-hidden", children: _jsx("span", { className: "font-heading font-bold text-accent text-xl whitespace-nowrap", children: "RotaVans" }) }), !isExpanded && (_jsx("span", { className: "font-heading font-bold text-accent text-xl", children: "R" }))] }), _jsx("nav", { className: "flex-1 py-4 px-3 overflow-y-auto overflow-x-hidden", children: categories.map((category, idx) => (_jsxs("div", { className: clsx(idx > 0 && 'mt-4'), children: [_jsx(motion.span, { animate: { opacity: isExpanded ? 1 : 0, height: isExpanded ? 'auto' : 0 }, transition: { duration: 0.15 }, className: "block px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted/50 overflow-hidden", children: category.label }), _jsx("div", { className: "space-y-1", children: category.items.map(({ to, icon: Icon, label }) => (_jsxs(NavLink, { to: to, className: ({ isActive }) => clsx('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200', isActive
                                    ? 'bg-accent-muted text-accent'
                                    : 'text-text-muted hover:text-text hover:bg-surface2'), children: [_jsx(Icon, { size: 20, className: "shrink-0" }), _jsx(motion.span, { animate: { opacity: isExpanded ? 1 : 0, width: isExpanded ? 'auto' : 0 }, transition: { duration: 0.15 }, className: "whitespace-nowrap overflow-hidden", children: label })] }, to))) })] }, category.label))) }), _jsxs("div", { className: "p-3 border-t border-border/30", children: [_jsx(motion.div, { animate: { opacity: isExpanded ? 1 : 0, height: isExpanded ? 'auto' : 0 }, transition: { duration: 0.15 }, className: "px-3 pb-2 text-xs text-text-muted/50 truncate overflow-hidden", children: user?.nome }), _jsxs("button", { onClick: logout, className: "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium\n                     text-text-muted hover:text-text hover:bg-surface2 transition-all duration-200", children: [_jsx(LogOut, { size: 20, className: "shrink-0" }), _jsx(motion.span, { animate: { opacity: isExpanded ? 1 : 0, width: isExpanded ? 'auto' : 0 }, transition: { duration: 0.15 }, className: "whitespace-nowrap overflow-hidden", children: "Sair" })] })] })] }));
}
