import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    return (_jsxs("aside", { className: "relative flex flex-col w-16 lg:w-56 h-screen bg-bg shrink-0 overflow-hidden", children: [_jsxs("div", { className: "relative h-44", children: [_jsx(LampAnimation, { height: 176 }), _jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center z-10 pt-8", children: [_jsx("span", { className: "hidden lg:block font-bold text-beige text-xl tracking-wide drop-shadow-[0_0_20px_rgba(247,175,39,0.4)]", children: "RotaVans" }), _jsx("span", { className: "lg:hidden font-bold text-beige text-lg drop-shadow-[0_0_20px_rgba(247,175,39,0.4)]", children: "R" })] })] }), _jsx("nav", { className: "relative z-10 flex-1 py-2 space-y-0.5 px-2", children: links.map(({ to, icon: Icon, label }) => (_jsxs(NavLink, { to: to, className: ({ isActive }) => clsx('flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200', isActive
                        ? 'text-accent'
                        : 'text-beige/50 hover:text-beige/80'), children: [_jsx(Icon, { size: 18, className: "shrink-0" }), _jsx("span", { className: "hidden lg:block", children: label })] }, to))) }), _jsxs("div", { className: "relative z-10 px-2 pb-4 pt-2", children: [_jsx("div", { className: "hidden lg:block px-3 pb-2 text-xs text-beige/30 truncate", children: profile?.nome }), _jsxs("button", { onClick: logout, className: "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-beige/50 hover:text-beige/80 w-full transition-all duration-200", children: [_jsx(LogOut, { size: 18, className: "shrink-0" }), _jsx("span", { className: "hidden lg:block", children: "Sair" })] })] })] }));
}
