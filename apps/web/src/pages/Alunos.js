import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Users, ChevronDown, ChevronUp, Camera } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { api } from '../lib/api';
const initialForm = {
    nome: '', nascimento: '', telefone: '', endereco: '', escola_id: '', turno: 'manha', turma: '', ano: '',
    nome_responsavel: '', cpf_responsavel: '', nascimento_responsavel: '', telefone_responsavel: '',
    valor_mensalidade: '', meses_contrato: '', inicio_contrato: '', restricoes: '', observacoes: '', face_embeddings: null
};
export function Alunos() {
    const [alunos, setAlunos] = useState([]);
    const [escolas, setEscolas] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(initialForm);
    const [expandedSections, setExpandedSections] = useState({ responsavel: true, contrato: false, saude: false, biometria: false });
    useEffect(() => { load(); }, []);
    async function load() {
        const [a, e] = await Promise.all([api.get('/alunos'), api.get('/escolas')]);
        setAlunos(a);
        setEscolas(e);
    }
    function openNew() {
        setEditing(null);
        setForm({ ...initialForm, escola_id: escolas[0]?.id?.toString() || '' });
        setExpandedSections({ responsavel: true, contrato: false, saude: false, biometria: false });
        setModalOpen(true);
    }
    function openEdit(a) {
        setEditing(a);
        setForm({
            nome: a.nome, nascimento: a.nascimento?.split('T')[0] || '', telefone: a.telefone || '',
            endereco: a.endereco, escola_id: a.escola_id.toString(), turno: a.turno, turma: a.turma || '', ano: a.ano || '',
            nome_responsavel: a.nome_responsavel || '', cpf_responsavel: a.cpf_responsavel || '',
            nascimento_responsavel: a.nascimento_responsavel?.split('T')[0] || '', telefone_responsavel: a.telefone_responsavel || '',
            valor_mensalidade: a.valor_mensalidade?.toString() || '', meses_contrato: a.meses_contrato?.toString() || '',
            inicio_contrato: a.inicio_contrato?.split('T')[0] || '', restricoes: a.restricoes || '', observacoes: a.observacoes || '',
            face_embeddings: a.face_embeddings || null
        });
        setExpandedSections({ responsavel: true, contrato: !!a.valor_mensalidade, saude: !!a.restricoes || !!a.observacoes, biometria: false });
        setModalOpen(true);
    }
    async function save() {
        const payload = {
            ...form,
            escola_id: Number(form.escola_id),
            nascimento: form.nascimento || null,
            nascimento_responsavel: form.nascimento_responsavel || null,
            inicio_contrato: form.inicio_contrato || null,
            valor_mensalidade: form.valor_mensalidade ? parseFloat(form.valor_mensalidade) : null,
            meses_contrato: form.meses_contrato ? parseInt(form.meses_contrato) : null,
        };
        if (editing) {
            await api.put(`/alunos/${editing.id}`, payload);
        }
        else {
            await api.post('/alunos', payload);
        }
        setModalOpen(false);
        load();
    }
    async function remove(id) {
        if (!confirm('Excluir este aluno?'))
            return;
        await api.delete(`/alunos/${id}`);
        load();
    }
    function toggleSection(section) {
        setExpandedSections(s => ({ ...s, [section]: !s[section] }));
    }
    const inputClass = "w-full bg-surface2 border border-beige/10 rounded-xl px-4 py-3 text-beige text-sm focus:outline-none focus:border-accent";
    return (_jsxs("div", { children: [_jsx(PageHeader, { title: "Alunos", subtitle: `${alunos.length} aluno(s)`, action: _jsxs("button", { onClick: openNew, className: "flex items-center gap-2 bg-accent hover:bg-accent/90 text-beige px-4 py-2 rounded-xl text-sm font-medium", children: [_jsx(Plus, { size: 18 }), " Novo Aluno"] }) }), alunos.length === 0 ? _jsx(EmptyState, { icon: Users, message: "Nenhum aluno cadastrado" }) : (_jsx("div", { className: "border border-beige/10 rounded-xl overflow-hidden", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-surface2 text-left text-sm text-beige/40", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3", children: "Nome" }), _jsx("th", { className: "px-4 py-3", children: "Escola" }), _jsx("th", { className: "px-4 py-3", children: "Turno" }), _jsx("th", { className: "px-4 py-3", children: "Turma" }), _jsx("th", { className: "px-4 py-3", children: "Responsavel" }), _jsx("th", { className: "px-4 py-3 w-24" })] }) }), _jsx("tbody", { className: "text-sm", children: alunos.map((a) => (_jsxs("tr", { className: "border-t border-beige/10 hover:bg-beige/52/50", children: [_jsx("td", { className: "px-4 py-3 text-beige", children: a.nome }), _jsx("td", { className: "px-4 py-3 text-beige/40", children: a.escola_nome || '-' }), _jsx("td", { className: "px-4 py-3 text-beige/40 capitalize", children: a.turno }), _jsx("td", { className: "px-4 py-3 text-beige/40", children: a.turma || '-' }), _jsx("td", { className: "px-4 py-3 text-beige/40", children: a.nome_responsavel || '-' }), _jsxs("td", { className: "px-4 py-3 flex gap-2", children: [_jsx("button", { onClick: () => openEdit(a), className: "text-beige/40 hover:text-beige", children: _jsx(Pencil, { size: 16 }) }), _jsx("button", { onClick: () => remove(a.id), className: "text-beige/40 hover:text-red-400", children: _jsx(Trash2, { size: 16 }) })] })] }, a.id))) })] }) })), _jsx(Modal, { open: modalOpen, onClose: () => setModalOpen(false), title: editing ? 'Editar Aluno' : 'Novo Aluno', size: "lg", children: _jsxs("div", { className: "space-y-6 max-h-[70vh] overflow-y-auto pr-2", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-beige font-medium mb-3", children: "Dados Pessoais" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm text-beige/40 mb-1", children: "Nome Completo *" }), _jsx("input", { value: form.nome, onChange: (e) => setForm({ ...form, nome: e.target.value }), className: inputClass })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-beige/40 mb-1", children: "Data de Nascimento" }), _jsx("input", { type: "date", value: form.nascimento, onChange: (e) => setForm({ ...form, nascimento: e.target.value }), className: inputClass })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm text-beige/40 mb-1", children: "Telefone" }), _jsx("input", { value: form.telefone, onChange: (e) => setForm({ ...form, telefone: e.target.value }), placeholder: "(00) 00000-0000", className: inputClass })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-beige/40 mb-1", children: "Endereco *" }), _jsx("input", { value: form.endereco, onChange: (e) => setForm({ ...form, endereco: e.target.value }), className: inputClass })] })] })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-beige font-medium mb-3", children: "Dados Escolares" }), _jsxs("div", { className: "grid grid-cols-4 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm text-beige/40 mb-1", children: "Escola *" }), _jsx("select", { value: form.escola_id, onChange: (e) => setForm({ ...form, escola_id: e.target.value }), className: inputClass, children: escolas.map((e) => _jsx("option", { value: e.id, children: e.nome }, e.id)) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-beige/40 mb-1", children: "Turno *" }), _jsxs("select", { value: form.turno, onChange: (e) => setForm({ ...form, turno: e.target.value }), className: inputClass, children: [_jsx("option", { value: "manha", children: "Manha" }), _jsx("option", { value: "tarde", children: "Tarde" }), _jsx("option", { value: "noite", children: "Noite" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-beige/40 mb-1", children: "Ano" }), _jsx("input", { value: form.ano, onChange: (e) => setForm({ ...form, ano: e.target.value }), placeholder: "5 ano", className: inputClass })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-beige/40 mb-1", children: "Turma" }), _jsx("input", { value: form.turma, onChange: (e) => setForm({ ...form, turma: e.target.value }), placeholder: "A", className: inputClass })] })] })] }), _jsxs("div", { className: "border border-beige/10 rounded-xl overflow-hidden", children: [_jsxs("button", { type: "button", onClick: () => toggleSection('responsavel'), className: "w-full flex items-center justify-between px-4 py-3 bg-surface2 text-beige font-medium", children: [_jsx("span", { children: "Dados do Responsavel" }), expandedSections.responsavel ? _jsx(ChevronUp, { size: 18 }) : _jsx(ChevronDown, { size: 18 })] }), expandedSections.responsavel && (_jsxs("div", { className: "p-4 space-y-3", children: [_jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm text-beige/40 mb-1", children: "Nome do Responsavel" }), _jsx("input", { value: form.nome_responsavel, onChange: (e) => setForm({ ...form, nome_responsavel: e.target.value }), className: inputClass })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-beige/40 mb-1", children: "CPF do Responsavel" }), _jsx("input", { value: form.cpf_responsavel, onChange: (e) => setForm({ ...form, cpf_responsavel: e.target.value }), placeholder: "000.000.000-00", className: inputClass })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm text-beige/40 mb-1", children: "Nascimento Responsavel" }), _jsx("input", { type: "date", value: form.nascimento_responsavel, onChange: (e) => setForm({ ...form, nascimento_responsavel: e.target.value }), className: inputClass })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-beige/40 mb-1", children: "Telefone Responsavel" }), _jsx("input", { value: form.telefone_responsavel, onChange: (e) => setForm({ ...form, telefone_responsavel: e.target.value }), placeholder: "(00) 00000-0000", className: inputClass })] })] })] }))] }), _jsxs("div", { className: "border border-beige/10 rounded-xl overflow-hidden", children: [_jsxs("button", { type: "button", onClick: () => toggleSection('contrato'), className: "w-full flex items-center justify-between px-4 py-3 bg-surface2 text-beige font-medium", children: [_jsx("span", { children: "Contrato" }), expandedSections.contrato ? _jsx(ChevronUp, { size: 18 }) : _jsx(ChevronDown, { size: 18 })] }), expandedSections.contrato && (_jsx("div", { className: "p-4 space-y-3", children: _jsxs("div", { className: "grid grid-cols-3 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm text-beige/40 mb-1", children: "Valor Mensalidade (R$)" }), _jsx("input", { type: "number", step: "0.01", value: form.valor_mensalidade, onChange: (e) => setForm({ ...form, valor_mensalidade: e.target.value }), placeholder: "0.00", className: inputClass })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-beige/40 mb-1", children: "Meses de Contrato" }), _jsx("input", { type: "number", value: form.meses_contrato, onChange: (e) => setForm({ ...form, meses_contrato: e.target.value }), placeholder: "12", className: inputClass })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-beige/40 mb-1", children: "Inicio do Contrato" }), _jsx("input", { type: "date", value: form.inicio_contrato, onChange: (e) => setForm({ ...form, inicio_contrato: e.target.value }), className: inputClass })] })] }) }))] }), _jsxs("div", { className: "border border-beige/10 rounded-xl overflow-hidden", children: [_jsxs("button", { type: "button", onClick: () => toggleSection('saude'), className: "w-full flex items-center justify-between px-4 py-3 bg-surface2 text-beige font-medium", children: [_jsx("span", { children: "Saude e Observacoes" }), expandedSections.saude ? _jsx(ChevronUp, { size: 18 }) : _jsx(ChevronDown, { size: 18 })] }), expandedSections.saude && (_jsxs("div", { className: "p-4 space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm text-beige/40 mb-1", children: "Restricoes (alergias, necessidades especiais)" }), _jsx("textarea", { value: form.restricoes, onChange: (e) => setForm({ ...form, restricoes: e.target.value }), rows: 2, className: inputClass })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm text-beige/40 mb-1", children: "Observacoes Gerais" }), _jsx("textarea", { value: form.observacoes, onChange: (e) => setForm({ ...form, observacoes: e.target.value }), rows: 2, className: inputClass })] })] }))] }), _jsxs("div", { className: "border border-beige/10 rounded-xl overflow-hidden", children: [_jsxs("button", { type: "button", onClick: () => toggleSection('biometria'), className: "w-full flex items-center justify-between px-4 py-3 bg-surface2 text-beige font-medium", children: [_jsxs("span", { className: "flex items-center gap-2", children: [_jsx(Camera, { size: 18 }), "Biometria Facial"] }), expandedSections.biometria ? _jsx(ChevronUp, { size: 18 }) : _jsx(ChevronDown, { size: 18 })] }), expandedSections.biometria && (_jsxs("div", { className: "p-4 space-y-4", children: [_jsx("div", { className: "flex items-center gap-3", children: _jsx("span", { className: form.face_embeddings ? 'text-green-400' : 'text-red-400', children: form.face_embeddings ? 'Cadastrado' : 'Nao cadastrado' }) }), _jsx("p", { className: "text-beige/40 text-sm", children: "Capture 5 fotos do rosto do aluno para habilitar check-in por reconhecimento facial." }), _jsx("button", { type: "button", onClick: () => alert('Funcionalidade de captura facial sera implementada em breve'), className: "bg-accent hover:bg-accent/90 text-beige px-4 py-2 rounded-xl text-sm", children: "Capturar Fotos" })] }))] }), _jsx("button", { onClick: save, disabled: !form.nome || !form.endereco || !form.escola_id, className: "w-full bg-accent hover:bg-accent/90 text-beige font-semibold py-3 rounded-xl disabled:opacity-50", children: editing ? 'Salvar Alteracoes' : 'Cadastrar Aluno' })] }) })] }));
}
