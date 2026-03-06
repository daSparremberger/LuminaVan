import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export function TenantsPage() {
    const [tenants, setTenants] = useState([]);
    const token = useAuthStore((s) => s.token);
    useEffect(() => {
        fetch(`${API_URL}/admin/tenants`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(setTenants);
    }, [token]);
    return (_jsxs("div", { children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h2", { className: "text-2xl font-bold text-white", children: "Regioes" }), _jsx(Link, { to: "/admin/tenants/novo", className: "bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700", children: "Nova Regiao" })] }), _jsx("div", { className: "bg-zinc-900 rounded-lg overflow-hidden", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-zinc-800", children: _jsxs("tr", { children: [_jsx("th", { className: "text-left p-4 text-zinc-400", children: "Nome" }), _jsx("th", { className: "text-left p-4 text-zinc-400", children: "Cidade" }), _jsx("th", { className: "text-left p-4 text-zinc-400", children: "Estado" }), _jsx("th", { className: "text-left p-4 text-zinc-400", children: "Gestores" }), _jsx("th", { className: "text-left p-4 text-zinc-400", children: "Status" }), _jsx("th", { className: "text-left p-4 text-zinc-400", children: "Acoes" })] }) }), _jsx("tbody", { children: tenants.map((t) => (_jsxs("tr", { className: "border-t border-zinc-800", children: [_jsx("td", { className: "p-4 text-white", children: t.nome }), _jsx("td", { className: "p-4 text-zinc-400", children: t.cidade }), _jsx("td", { className: "p-4 text-zinc-400", children: t.estado }), _jsx("td", { className: "p-4 text-zinc-400", children: t.total_gestores }), _jsx("td", { className: "p-4", children: _jsx("span", { className: `px-2 py-1 rounded text-xs ${t.ativo ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`, children: t.ativo ? 'Ativo' : 'Inativo' }) }), _jsx("td", { className: "p-4", children: _jsx(Link, { to: `/admin/tenants/${t.id}`, className: "text-blue-500 hover:underline", children: "Ver" }) })] }, t.id))) })] }) })] }));
}
