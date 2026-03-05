import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export function TenantFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const token = useAuthStore((s) => s.token);
    const isEdit = !!id && id !== 'novo';
    const [form, setForm] = useState({ nome: '', cidade: '', estado: '' });
    const [loading, setLoading] = useState(false);
    const [conviteLink, setConviteLink] = useState(null);
    useEffect(() => {
        if (isEdit) {
            fetch(`${API_URL}/admin/tenants/${id}`, { headers: { Authorization: `Bearer ${token}` } })
                .then(r => r.json()).then(d => setForm({ nome: d.nome, cidade: d.cidade, estado: d.estado }));
        }
    }, [id, token, isEdit]);
    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        const res = await fetch(isEdit ? `${API_URL}/admin/tenants/${id}` : `${API_URL}/admin/tenants`, {
            method: isEdit ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(form)
        });
        if (res.ok && !isEdit) {
            const d = await res.json();
            navigate(`/admin/tenants/${d.id}`);
        }
        setLoading(false);
    }
    async function handleGerarConvite() {
        const res = await fetch(`${API_URL}/admin/tenants/${id}/convite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ dias_validade: 7 })
        });
        if (res.ok) {
            const d = await res.json();
            setConviteLink(`${window.location.origin}/convite/${d.token}`);
        }
    }
    return (_jsxs("div", { className: "max-w-2xl", children: [_jsx("h2", { className: "text-2xl font-bold text-white mb-6", children: isEdit ? 'Editar Regiao' : 'Nova Regiao' }), _jsxs("form", { onSubmit: handleSubmit, className: "bg-zinc-900 rounded-lg p-6 space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-zinc-400 mb-1", children: "Nome da Prefeitura" }), _jsx("input", { type: "text", value: form.nome, onChange: e => setForm({ ...form, nome: e.target.value }), className: "w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2 text-white", required: true })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-zinc-400 mb-1", children: "Cidade" }), _jsx("input", { type: "text", value: form.cidade, onChange: e => setForm({ ...form, cidade: e.target.value }), className: "w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2 text-white", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-zinc-400 mb-1", children: "Estado" }), _jsx("input", { type: "text", value: form.estado, onChange: e => setForm({ ...form, estado: e.target.value }), className: "w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2 text-white", maxLength: 2, required: true })] })] }), _jsx("button", { type: "submit", disabled: loading, className: "bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50", children: loading ? 'Salvando...' : 'Salvar' })] }), isEdit && (_jsxs("div", { className: "bg-zinc-900 rounded-lg p-6 mt-6", children: [_jsx("h3", { className: "text-lg font-bold text-white mb-4", children: "Convite para Gestor" }), conviteLink ? (_jsxs("div", { className: "bg-zinc-800 p-4 rounded", children: [_jsx("p", { className: "text-zinc-400 text-sm mb-2", children: "Link (valido 7 dias):" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "text", value: conviteLink, readOnly: true, className: "flex-1 bg-zinc-700 border border-zinc-600 rounded px-4 py-2 text-white" }), _jsx("button", { onClick: () => navigator.clipboard.writeText(conviteLink), className: "bg-zinc-700 text-white px-4 py-2 rounded", children: "Copiar" })] })] })) : _jsx("button", { onClick: handleGerarConvite, className: "bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700", children: "Gerar Link de Convite" })] }))] }));
}
