import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Fragment, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, School, X, Users } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { PageTransition } from '../components/ui/PageTransition';
import { api } from '../lib/api';
const CARGO_OPTIONS = ['Diretor', 'Coordenador', 'Secretario', 'Outro'];
export function Escolas() {
    const [escolas, setEscolas] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ nome: '', endereco: '', turno_manha: false, turno_tarde: false, turno_noite: false });
    const [contatos, setContatos] = useState([]);
    const [originalContatos, setOriginalContatos] = useState([]);
    const [expandedSchool, setExpandedSchool] = useState(null);
    const [schoolContatos, setSchoolContatos] = useState([]);
    useEffect(() => { load(); }, []);
    async function load() {
        const data = await api.get('/escolas');
        setEscolas(data);
    }
    function openNew() {
        setEditing(null);
        setForm({ nome: '', endereco: '', turno_manha: false, turno_tarde: false, turno_noite: false });
        setContatos([]);
        setOriginalContatos([]);
        setModalOpen(true);
    }
    async function openEdit(e) {
        setEditing(e);
        setForm({ nome: e.nome, endereco: e.endereco, turno_manha: e.turno_manha, turno_tarde: e.turno_tarde, turno_noite: e.turno_noite });
        // Load contacts for this school
        try {
            const escola = await api.get(`/escolas/${e.id}`);
            const contatosData = escola.contatos || [];
            setOriginalContatos(contatosData);
            setContatos(contatosData.map(c => ({ id: c.id, cargo: c.cargo, nome: c.nome, telefone: c.telefone || '' })));
        }
        catch {
            setContatos([]);
            setOriginalContatos([]);
        }
        setModalOpen(true);
    }
    function addContato() {
        setContatos([...contatos, { cargo: 'Diretor', nome: '', telefone: '' }]);
    }
    function removeContato(index) {
        setContatos(contatos.filter((_, i) => i !== index));
    }
    function updateContato(index, field, value) {
        setContatos(contatos.map((c, i) => i === index ? { ...c, [field]: value } : c));
    }
    async function save() {
        let escolaId;
        if (editing) {
            await api.put(`/escolas/${editing.id}`, form);
            escolaId = editing.id;
        }
        else {
            const newEscola = await api.post('/escolas', form);
            escolaId = newEscola.id;
        }
        // Save contacts
        // For existing school, sync contacts
        if (editing) {
            // Delete removed contacts
            const currentIds = contatos.filter(c => c.id).map(c => c.id);
            for (const orig of originalContatos) {
                if (!currentIds.includes(orig.id)) {
                    await api.delete(`/escolas/${escolaId}/contatos/${orig.id}`);
                }
            }
        }
        // Add or update contacts
        for (const contato of contatos) {
            if (contato.nome.trim()) {
                if (contato.id) {
                    // Update existing contact
                    await api.put(`/escolas/${escolaId}/contatos/${contato.id}`, {
                        cargo: contato.cargo,
                        nome: contato.nome,
                        telefone: contato.telefone || null
                    });
                }
                else {
                    // Add new contact
                    await api.post(`/escolas/${escolaId}/contatos`, {
                        cargo: contato.cargo,
                        nome: contato.nome,
                        telefone: contato.telefone || null
                    });
                }
            }
        }
        setModalOpen(false);
        load();
    }
    async function remove(id) {
        if (!confirm('Excluir esta escola?'))
            return;
        await api.delete(`/escolas/${id}`);
        load();
    }
    async function toggleContatos(escolaId) {
        if (expandedSchool === escolaId) {
            setExpandedSchool(null);
            setSchoolContatos([]);
        }
        else {
            try {
                const escola = await api.get(`/escolas/${escolaId}`);
                setSchoolContatos(escola.contatos || []);
                setExpandedSchool(escolaId);
            }
            catch {
                setSchoolContatos([]);
                setExpandedSchool(escolaId);
            }
        }
    }
    return (_jsx(PageTransition, { children: _jsxs("div", { children: [_jsx(PageHeader, { title: "Escolas", subtitle: `${escolas.length} escola(s) cadastrada(s)`, action: _jsxs("button", { onClick: openNew, className: "flex items-center gap-2 bg-accent hover:bg-accent/90 text-text px-4 py-2 rounded-xl text-sm font-medium", children: [_jsx(Plus, { size: 18 }), " Nova Escola"] }) }), escolas.length === 0 ? (_jsx(EmptyState, { icon: School, message: "Nenhuma escola cadastrada" })) : (_jsx("div", { className: "border border-border/30 rounded-xl overflow-hidden", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-surface2 text-left text-sm text-text-muted", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3", children: "Nome" }), _jsx("th", { className: "px-4 py-3", children: "Endereco" }), _jsx("th", { className: "px-4 py-3", children: "Turnos" }), _jsx("th", { className: "px-4 py-3", children: "Contatos" }), _jsx("th", { className: "px-4 py-3 w-24" })] }) }), _jsx("tbody", { className: "text-sm", children: escolas.map((e) => (_jsxs(Fragment, { children: [_jsxs("tr", { className: "border-t border-border/30 hover:bg-surface2", children: [_jsx("td", { className: "px-4 py-3 text-text", children: e.nome }), _jsx("td", { className: "px-4 py-3 text-text-muted", children: e.endereco }), _jsx("td", { className: "px-4 py-3 text-text-muted", children: [e.turno_manha && 'M', e.turno_tarde && 'T', e.turno_noite && 'N'].filter(Boolean).join(', ') || '-' }), _jsx("td", { className: "px-4 py-3", children: _jsxs("button", { onClick: () => toggleContatos(e.id), className: "flex items-center gap-1 text-text-muted hover:text-accent", children: [_jsx(Users, { size: 16 }), _jsx("span", { className: "text-xs", children: "Ver" })] }) }), _jsxs("td", { className: "px-4 py-3 flex gap-2", children: [_jsx("button", { onClick: () => openEdit(e), className: "text-text-muted hover:text-text", children: _jsx(Pencil, { size: 16 }) }), _jsx("button", { onClick: () => remove(e.id), className: "text-text-muted hover:text-red-400", children: _jsx(Trash2, { size: 16 }) })] })] }), expandedSchool === e.id && (_jsx("tr", { className: "bg-surface2/30", children: _jsx("td", { colSpan: 5, className: "px-4 py-3", children: schoolContatos.length === 0 ? (_jsx("p", { className: "text-text-muted text-sm", children: "Nenhum contato cadastrado" })) : (_jsx("div", { className: "space-y-2", children: schoolContatos.map((c) => (_jsxs("div", { className: "flex items-center gap-4 text-sm", children: [_jsx("span", { className: "bg-accent/20 text-accent px-2 py-0.5 rounded text-xs font-medium", children: c.cargo }), _jsx("span", { className: "text-text", children: c.nome }), c.telefone && _jsx("span", { className: "text-text-muted", children: c.telefone })] }, c.id))) })) }) }))] }, e.id))) })] }) })), _jsx(Modal, { open: modalOpen, onClose: () => setModalOpen(false), title: editing ? 'Editar Escola' : 'Nova Escola', children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm text-text-muted mb-1", children: "Nome" }), _jsx("input", { value: form.nome, onChange: (e) => setForm({ ...form, nome: e.target.value }), className: "w-full bg-surface2 border border-border/30 rounded-xl px-4 py-3 text-text text-sm focus:outline-none focus:border-accent" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-text-muted mb-1", children: "Endereco" }), _jsx("input", { value: form.endereco, onChange: (e) => setForm({ ...form, endereco: e.target.value }), className: "w-full bg-surface2 border border-border/30 rounded-xl px-4 py-3 text-text text-sm focus:outline-none focus:border-accent" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-text-muted mb-2", children: "Turnos" }), _jsx("div", { className: "flex gap-4", children: ['manha', 'tarde', 'noite'].map((t) => (_jsxs("label", { className: "flex items-center gap-2 text-sm text-text-muted", children: [_jsx("input", { type: "checkbox", checked: form[`turno_${t}`], onChange: (e) => setForm({ ...form, [`turno_${t}`]: e.target.checked }), className: "rounded bg-surface2 border-border/30" }), t.charAt(0).toUpperCase() + t.slice(1)] }, t))) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-text-muted mb-2", children: "Contatos" }), _jsxs("div", { className: "space-y-2", children: [contatos.map((c, i) => (_jsxs("div", { className: "flex gap-2 items-center", children: [_jsx("select", { value: c.cargo, onChange: (e) => updateContato(i, 'cargo', e.target.value), className: "bg-surface2 border border-border/30 rounded-xl px-3 py-2 text-text text-sm focus:outline-none focus:border-accent", children: CARGO_OPTIONS.map((cargo) => (_jsx("option", { value: cargo, children: cargo }, cargo))) }), _jsx("input", { placeholder: "Nome", value: c.nome, onChange: (e) => updateContato(i, 'nome', e.target.value), className: "flex-1 bg-surface2 border border-border/30 rounded-xl px-3 py-2 text-text text-sm focus:outline-none focus:border-accent" }), _jsx("input", { placeholder: "Telefone", value: c.telefone, onChange: (e) => updateContato(i, 'telefone', e.target.value), className: "w-32 bg-surface2 border border-border/30 rounded-xl px-3 py-2 text-text text-sm focus:outline-none focus:border-accent" }), _jsx("button", { onClick: () => removeContato(i), className: "text-text-muted hover:text-red-400 p-1", type: "button", children: _jsx(X, { size: 18 }) })] }, i))), _jsxs("button", { onClick: addContato, type: "button", className: "flex items-center gap-1 text-accent hover:text-accent/80 text-sm font-medium", children: [_jsx(Plus, { size: 16 }), " Adicionar Contato"] })] })] }), _jsx("button", { onClick: save, className: "w-full bg-accent hover:bg-accent/90 text-text font-semibold py-3 rounded-xl", children: editing ? 'Salvar' : 'Criar' })] }) })] }) }));
}
