import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, School, Users, Truck, Car, Map, History, DollarSign, Radio, MessageCircle, LogOut, Settings, UserCircle, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../stores/auth';
import { clsx } from 'clsx';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
const navigation = [
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
const bottomNav = [
    { to: '/configuracoes', icon: Settings, label: 'Configuracoes' },
    { to: '/perfil', icon: UserCircle, label: 'Perfil' },
];
export function Sidebar() {
    const { logout } = useAuthStore();
    const [expanded, setExpanded] = useState(null);
    const [isHovered, setIsHovered] = useState(false);
    const toggleExpand = (label) => {
        setExpanded(expanded === label ? null : label);
    };
    return (_jsxs(motion.aside, { onMouseEnter: () => setIsHovered(true), onMouseLeave: () => {
            setIsHovered(false);
            setExpanded(null);
        }, animate: { width: isHovered ? 220 : 64 }, transition: { duration: 0.2, ease: 'easeOut' }, className: "flex flex-col h-full bg-surface border-r border-border/50 shrink-0", children: [_jsxs("div", { className: "h-14 flex items-center px-4 border-b border-border/50", children: [_jsx("div", { className: "w-8 h-8 rounded-lg bg-accent flex items-center justify-center", children: _jsx("span", { className: "text-surface font-bold text-sm", children: "R" }) }), _jsx(AnimatePresence, { children: isHovered && (_jsx(motion.span, { initial: { opacity: 0, width: 0 }, animate: { opacity: 1, width: 'auto' }, exit: { opacity: 0, width: 0 }, className: "ml-3 font-semibold text-text whitespace-nowrap overflow-hidden", children: "RotaVans" })) })] }), _jsx("nav", { className: "flex-1 py-3 px-2 overflow-y-auto overflow-x-hidden", children: navigation.map((section) => (_jsx("div", { className: "mb-1", children: section.to ? (
                    // Direct link
                    _jsxs(NavLink, { to: section.to, className: ({ isActive }) => clsx('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150', isActive
                            ? 'bg-accent-muted text-text'
                            : 'text-text-muted hover:text-text hover:bg-surface2'), children: [_jsx(section.icon, { size: 20, strokeWidth: 1.5, className: "shrink-0" }), _jsx(AnimatePresence, { children: isHovered && (_jsx(motion.span, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "whitespace-nowrap", children: section.label })) })] })) : (
                    // Expandable section
                    _jsxs(_Fragment, { children: [_jsxs("button", { onClick: () => toggleExpand(section.label), className: clsx('w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150', expanded === section.label
                                    ? 'bg-surface2 text-text'
                                    : 'text-text-muted hover:text-text hover:bg-surface2'), children: [_jsx(section.icon, { size: 20, strokeWidth: 1.5, className: "shrink-0" }), _jsx(AnimatePresence, { children: isHovered && (_jsxs(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "flex-1 flex items-center justify-between", children: [_jsx("span", { className: "whitespace-nowrap", children: section.label }), _jsx(ChevronDown, { size: 16, className: clsx('transition-transform duration-200', expanded === section.label && 'rotate-180') })] })) })] }), _jsx(AnimatePresence, { children: expanded === section.label && isHovered && section.items && (_jsx(motion.div, { initial: { height: 0, opacity: 0 }, animate: { height: 'auto', opacity: 1 }, exit: { height: 0, opacity: 0 }, transition: { duration: 0.2 }, className: "overflow-hidden", children: _jsx("div", { className: "pl-4 mt-1 space-y-0.5", children: section.items.map((item) => (_jsxs(NavLink, { to: item.to, className: ({ isActive }) => clsx('flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150', isActive
                                                ? 'bg-accent-muted text-text font-medium'
                                                : 'text-text-muted hover:text-text hover:bg-surface2'), children: [_jsx(item.icon, { size: 16, strokeWidth: 1.5 }), _jsx("span", { children: item.label })] }, item.to))) }) })) })] })) }, section.label))) }), _jsxs("div", { className: "py-3 px-2 border-t border-border/50", children: [bottomNav.map((item) => (_jsxs(NavLink, { to: item.to, className: ({ isActive }) => clsx('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 mb-1', isActive
                            ? 'bg-accent-muted text-text'
                            : 'text-text-muted hover:text-text hover:bg-surface2'), children: [_jsx(item.icon, { size: 20, strokeWidth: 1.5, className: "shrink-0" }), _jsx(AnimatePresence, { children: isHovered && (_jsx(motion.span, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "whitespace-nowrap", children: item.label })) })] }, item.to))), _jsxs("button", { onClick: logout, className: "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium\n                     text-text-muted hover:text-danger hover:bg-danger-muted transition-all duration-150", children: [_jsx(LogOut, { size: 20, strokeWidth: 1.5, className: "shrink-0" }), _jsx(AnimatePresence, { children: isHovered && (_jsx(motion.span, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "whitespace-nowrap", children: "Sair" })) })] })] })] }));
}
