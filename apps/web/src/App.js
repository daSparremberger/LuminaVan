import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './stores/auth';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Escolas } from './pages/Escolas';
import { Alunos } from './pages/Alunos';
import { Motoristas } from './pages/Motoristas';
import { Rotas } from './pages/Rotas';
import { Veiculos } from './pages/Veiculos';
import { Historico } from './pages/Historico';
import { Financeiro } from './pages/Financeiro';
import { Rastreamento } from './pages/Rastreamento';
import { Mensagens } from './pages/Mensagens';
function Guard({ children }) {
    const { user, loading } = useAuth();
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-bg flex items-center justify-center", children: _jsx("div", { className: "text-gray-400", children: "Carregando..." }) }));
    }
    return user ? _jsx(_Fragment, { children: children }) : _jsx(Navigate, { to: "/login", replace: true });
}
export default function App() {
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsxs(Route, { path: "/", element: _jsx(Guard, { children: _jsx(Layout, {}) }), children: [_jsx(Route, { index: true, element: _jsx(Navigate, { to: "/dashboard", replace: true }) }), _jsx(Route, { path: "dashboard", element: _jsx(Dashboard, {}) }), _jsx(Route, { path: "escolas", element: _jsx(Escolas, {}) }), _jsx(Route, { path: "alunos", element: _jsx(Alunos, {}) }), _jsx(Route, { path: "motoristas", element: _jsx(Motoristas, {}) }), _jsx(Route, { path: "rotas", element: _jsx(Rotas, {}) }), _jsx(Route, { path: "veiculos", element: _jsx(Veiculos, {}) }), _jsx(Route, { path: "historico", element: _jsx(Historico, {}) }), _jsx(Route, { path: "financeiro", element: _jsx(Financeiro, {}) }), _jsx(Route, { path: "rastreamento", element: _jsx(Rastreamento, {}) }), _jsx(Route, { path: "mensagens", element: _jsx(Mensagens, {}) })] }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/dashboard", replace: true }) })] }));
}
