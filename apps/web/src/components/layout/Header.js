import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Bell, MessageCircle, Search, Plus } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useAuthStore } from '../../stores/auth';
import { useLocation } from 'react-router-dom';
const pageTitles = {
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
    return (_jsxs("header", { className: "h-14 px-6 flex items-center justify-between border-b border-border/50 bg-surface", children: [_jsx("h1", { className: "text-xl font-semibold text-text", children: title }), _jsx("div", { className: "flex-1 max-w-md mx-8", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { size: 18, strokeWidth: 1.5, className: "absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" }), _jsx("input", { type: "text", placeholder: "Search anything...", className: "w-full h-10 pl-11 pr-4 bg-surface2 border border-border/50 rounded-xl\n                       text-text text-sm placeholder:text-text-muted\n                       focus:outline-none focus:border-text-muted focus:bg-surface\n                       transition-all duration-200" })] }) }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("button", { className: "h-9 px-4 bg-accent hover:bg-accent-hover text-surface text-sm font-medium\n                          rounded-xl flex items-center gap-2 transition-colors duration-150", children: [_jsx(Plus, { size: 16, strokeWidth: 2 }), _jsx("span", { children: "Create" })] }), _jsx(ThemeToggle, {}), _jsx("button", { className: "relative w-9 h-9 rounded-xl hover:bg-surface2\n                          flex items-center justify-center transition-colors duration-150", children: _jsx(Bell, { size: 18, strokeWidth: 1.5, className: "text-text-muted" }) }), _jsx("button", { className: "relative w-9 h-9 rounded-xl hover:bg-surface2\n                          flex items-center justify-center transition-colors duration-150", children: _jsx(MessageCircle, { size: 18, strokeWidth: 1.5, className: "text-text-muted" }) }), _jsx("button", { className: "w-9 h-9 rounded-xl overflow-hidden bg-surface2 flex items-center justify-center", children: user?.nome ? (_jsx("span", { className: "text-sm font-medium text-text", children: user.nome.charAt(0).toUpperCase() })) : (_jsx("span", { className: "text-sm font-medium text-text-muted", children: "?" })) })] })] }));
}
