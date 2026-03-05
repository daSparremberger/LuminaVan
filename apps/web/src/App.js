import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth';
import { Layout } from './components/layout/Layout';
import { LoginPage as Login } from './pages/Login';
import { ConvitePage } from './pages/Convite';
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
import { AdminLayout } from './pages/Admin';
import { AdminDashboard } from './pages/Admin/Dashboard';
import { TenantsPage } from './pages/Admin/Tenants';
import { TenantFormPage } from './pages/Admin/TenantForm';
function ProtectedRoute({ children, allowedRoles }) {
    const { role } = useAuthStore();
    if (!role)
        return _jsx(Navigate, { to: "/login", replace: true });
    if (!allowedRoles.includes(role))
        return _jsx(Navigate, { to: "/", replace: true });
    return _jsx(_Fragment, { children: children });
}
function RootRedirect() {
    const { role } = useAuthStore();
    if (!role)
        return _jsx(Navigate, { to: "/login", replace: true });
    if (role === 'admin')
        return _jsx(Navigate, { to: "/admin", replace: true });
    return _jsx(Navigate, { to: "/dashboard", replace: true });
}
export default function App() {
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsx(Route, { path: "/convite/:token", element: _jsx(ConvitePage, {}) }), _jsx(Route, { path: "/", element: _jsx(RootRedirect, {}) }), _jsxs(Route, { path: "/admin", element: _jsx(ProtectedRoute, { allowedRoles: ['admin'], children: _jsx(AdminLayout, {}) }), children: [_jsx(Route, { index: true, element: _jsx(AdminDashboard, {}) }), _jsx(Route, { path: "tenants", element: _jsx(TenantsPage, {}) }), _jsx(Route, { path: "tenants/:id", element: _jsx(TenantFormPage, {}) })] }), _jsxs(Route, { element: _jsx(ProtectedRoute, { allowedRoles: ['gestor'], children: _jsx(Layout, {}) }), children: [_jsx(Route, { path: "dashboard", element: _jsx(Dashboard, {}) }), _jsx(Route, { path: "escolas", element: _jsx(Escolas, {}) }), _jsx(Route, { path: "alunos", element: _jsx(Alunos, {}) }), _jsx(Route, { path: "motoristas", element: _jsx(Motoristas, {}) }), _jsx(Route, { path: "rotas", element: _jsx(Rotas, {}) }), _jsx(Route, { path: "veiculos", element: _jsx(Veiculos, {}) }), _jsx(Route, { path: "historico", element: _jsx(Historico, {}) }), _jsx(Route, { path: "financeiro", element: _jsx(Financeiro, {}) }), _jsx(Route, { path: "rastreamento", element: _jsx(Rastreamento, {}) }), _jsx(Route, { path: "mensagens", element: _jsx(Mensagens, {}) })] }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }));
}
