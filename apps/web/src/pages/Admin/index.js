import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet, NavLink } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth';
export function AdminLayout() {
    const { user, logout } = useAuthStore();
    return (_jsxs("div", { className: "min-h-screen bg-zinc-950 flex", children: [_jsxs("aside", { className: "w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col", children: [_jsxs("div", { className: "p-4 border-b border-zinc-800", children: [_jsx("h1", { className: "text-xl font-bold text-white", children: "RotaVans Admin" }), _jsx("p", { className: "text-zinc-500 text-sm", children: user?.email })] }), _jsxs("nav", { className: "p-2 flex-1", children: [_jsx(NavLink, { to: "/admin", end: true, className: ({ isActive }) => `block px-4 py-2 rounded ${isActive ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:bg-zinc-800'}`, children: "Dashboard" }), _jsx(NavLink, { to: "/admin/tenants", className: ({ isActive }) => `block px-4 py-2 rounded ${isActive ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:bg-zinc-800'}`, children: "Regioes" })] }), _jsx("div", { className: "p-4 border-t border-zinc-800", children: _jsx("button", { onClick: logout, className: "text-zinc-400 hover:text-white", children: "Sair" }) })] }), _jsx("main", { className: "flex-1 p-6", children: _jsx(Outlet, {}) })] }));
}
