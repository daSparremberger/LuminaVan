import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Users, ChevronDown, ChevronUp, Camera } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { PageTransition } from '../components/ui/PageTransition';
import { api } from '../lib/api';
import type { Aluno, Escola } from '@rotavans/shared';

const initialForm: {
  nome: string; nascimento: string; telefone: string; endereco: string; escola_id: string; turno: string; turma: string; ano: string;
  nome_responsavel: string; cpf_responsavel: string; nascimento_responsavel: string; telefone_responsavel: string;
  valor_mensalidade: string; meses_contrato: string; inicio_contrato: string; restricoes: string; observacoes: string; face_embeddings: number[][] | null;
} = {
  nome: '', nascimento: '', telefone: '', endereco: '', escola_id: '', turno: 'manha', turma: '', ano: '',
  nome_responsavel: '', cpf_responsavel: '', nascimento_responsavel: '', telefone_responsavel: '',
  valor_mensalidade: '', meses_contrato: '', inicio_contrato: '', restricoes: '', observacoes: '', face_embeddings: null
};

export function Alunos() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Aluno | null>(null);
  const [form, setForm] = useState(initialForm);
  const [expandedSections, setExpandedSections] = useState({ responsavel: true, contrato: false, saude: false, biometria: false });

  useEffect(() => { load(); }, []);

  async function load() {
    const [a, e] = await Promise.all([api.get<Aluno[]>('/alunos'), api.get<Escola[]>('/escolas')]);
    setAlunos(a);
    setEscolas(e);
  }

  function openNew() {
    setEditing(null);
    setForm({ ...initialForm, escola_id: escolas[0]?.id?.toString() || '' });
    setExpandedSections({ responsavel: true, contrato: false, saude: false, biometria: false });
    setModalOpen(true);
  }

  function openEdit(a: Aluno) {
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
    } else {
      await api.post('/alunos', payload);
    }
    setModalOpen(false);
    load();
  }

  async function remove(id: number) {
    if (!confirm('Excluir este aluno?')) return;
    await api.delete(`/alunos/${id}`);
    load();
  }

  function toggleSection(section: keyof typeof expandedSections) {
    setExpandedSections(s => ({ ...s, [section]: !s[section] }));
  }

  const inputClass = "w-full h-12 px-4 bg-surface2 border border-border/50 rounded-xl text-text text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all duration-200";

  return (
    <PageTransition>
    <div>
      <PageHeader title="Alunos" subtitle={`${alunos.length} aluno(s)`}
        action={<button onClick={openNew} className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-text px-4 py-2 rounded-xl text-sm font-medium"><Plus size={18} /> Novo Aluno</button>} />

      {alunos.length === 0 ? <EmptyState icon={Users} message="Nenhum aluno cadastrado" /> : (
        <div className="border border-border/30 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface2 text-left text-sm text-text-muted">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Escola</th>
                <th className="px-4 py-3">Turno</th>
                <th className="px-4 py-3">Turma</th>
                <th className="px-4 py-3">Responsavel</th>
                <th className="px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {alunos.map((a) => (
                <tr key={a.id} className="border-t border-border/30 hover:bg-surface2">
                  <td className="px-4 py-3 text-text">{a.nome}</td>
                  <td className="px-4 py-3 text-text-muted">{a.escola_nome || '-'}</td>
                  <td className="px-4 py-3 text-text-muted capitalize">{a.turno}</td>
                  <td className="px-4 py-3 text-text-muted">{a.turma || '-'}</td>
                  <td className="px-4 py-3 text-text-muted">{a.nome_responsavel || '-'}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => openEdit(a)} className="text-text-muted hover:text-text"><Pencil size={16} /></button>
                    <button onClick={() => remove(a.id)} className="text-text-muted hover:text-red-400"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Aluno' : 'Novo Aluno'} size="lg">
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          {/* Dados Pessoais */}
          <div>
            <h3 className="text-text font-medium mb-3">Dados Pessoais</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm text-text-muted mb-1">Nome Completo *</label>
                  <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={inputClass} /></div>
                <div><label className="block text-sm text-text-muted mb-1">Data de Nascimento</label>
                  <input type="date" value={form.nascimento} onChange={(e) => setForm({ ...form, nascimento: e.target.value })} className={inputClass} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm text-text-muted mb-1">Telefone</label>
                  <input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(00) 00000-0000" className={inputClass} /></div>
                <div><label className="block text-sm text-text-muted mb-1">Endereco *</label>
                  <input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} className={inputClass} /></div>
              </div>
            </div>
          </div>

          {/* Dados Escolares */}
          <div>
            <h3 className="text-text font-medium mb-3">Dados Escolares</h3>
            <div className="grid grid-cols-4 gap-3">
              <div><label className="block text-sm text-text-muted mb-1">Escola *</label>
                <select value={form.escola_id} onChange={(e) => setForm({ ...form, escola_id: e.target.value })} className={inputClass}>
                  {escolas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
                </select></div>
              <div><label className="block text-sm text-text-muted mb-1">Turno *</label>
                <select value={form.turno} onChange={(e) => setForm({ ...form, turno: e.target.value })} className={inputClass}>
                  <option value="manha">Manha</option><option value="tarde">Tarde</option><option value="noite">Noite</option>
                </select></div>
              <div><label className="block text-sm text-text-muted mb-1">Ano</label>
                <input value={form.ano} onChange={(e) => setForm({ ...form, ano: e.target.value })} placeholder="5 ano" className={inputClass} /></div>
              <div><label className="block text-sm text-text-muted mb-1">Turma</label>
                <input value={form.turma} onChange={(e) => setForm({ ...form, turma: e.target.value })} placeholder="A" className={inputClass} /></div>
            </div>
          </div>

          {/* Responsavel - Collapsible */}
          <div className="border border-border/30 rounded-xl overflow-hidden">
            <button type="button" onClick={() => toggleSection('responsavel')} className="w-full flex items-center justify-between px-4 py-3 bg-surface2 text-text font-medium">
              <span>Dados do Responsavel</span>
              {expandedSections.responsavel ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {expandedSections.responsavel && (
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm text-text-muted mb-1">Nome do Responsavel</label>
                    <input value={form.nome_responsavel} onChange={(e) => setForm({ ...form, nome_responsavel: e.target.value })} className={inputClass} /></div>
                  <div><label className="block text-sm text-text-muted mb-1">CPF do Responsavel</label>
                    <input value={form.cpf_responsavel} onChange={(e) => setForm({ ...form, cpf_responsavel: e.target.value })} placeholder="000.000.000-00" className={inputClass} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm text-text-muted mb-1">Nascimento Responsavel</label>
                    <input type="date" value={form.nascimento_responsavel} onChange={(e) => setForm({ ...form, nascimento_responsavel: e.target.value })} className={inputClass} /></div>
                  <div><label className="block text-sm text-text-muted mb-1">Telefone Responsavel</label>
                    <input value={form.telefone_responsavel} onChange={(e) => setForm({ ...form, telefone_responsavel: e.target.value })} placeholder="(00) 00000-0000" className={inputClass} /></div>
                </div>
              </div>
            )}
          </div>

          {/* Contrato - Collapsible */}
          <div className="border border-border/30 rounded-xl overflow-hidden">
            <button type="button" onClick={() => toggleSection('contrato')} className="w-full flex items-center justify-between px-4 py-3 bg-surface2 text-text font-medium">
              <span>Contrato</span>
              {expandedSections.contrato ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {expandedSections.contrato && (
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="block text-sm text-text-muted mb-1">Valor Mensalidade (R$)</label>
                    <input type="number" step="0.01" value={form.valor_mensalidade} onChange={(e) => setForm({ ...form, valor_mensalidade: e.target.value })} placeholder="0.00" className={inputClass} /></div>
                  <div><label className="block text-sm text-text-muted mb-1">Meses de Contrato</label>
                    <input type="number" value={form.meses_contrato} onChange={(e) => setForm({ ...form, meses_contrato: e.target.value })} placeholder="12" className={inputClass} /></div>
                  <div><label className="block text-sm text-text-muted mb-1">Inicio do Contrato</label>
                    <input type="date" value={form.inicio_contrato} onChange={(e) => setForm({ ...form, inicio_contrato: e.target.value })} className={inputClass} /></div>
                </div>
              </div>
            )}
          </div>

          {/* Saude - Collapsible */}
          <div className="border border-border/30 rounded-xl overflow-hidden">
            <button type="button" onClick={() => toggleSection('saude')} className="w-full flex items-center justify-between px-4 py-3 bg-surface2 text-text font-medium">
              <span>Saude e Observacoes</span>
              {expandedSections.saude ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {expandedSections.saude && (
              <div className="p-4 space-y-3">
                <div><label className="block text-sm text-text-muted mb-1">Restricoes (alergias, necessidades especiais)</label>
                  <textarea value={form.restricoes} onChange={(e) => setForm({ ...form, restricoes: e.target.value })} rows={2} className={inputClass} /></div>
                <div><label className="block text-sm text-text-muted mb-1">Observacoes Gerais</label>
                  <textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={2} className={inputClass} /></div>
              </div>
            )}
          </div>

          {/* Biometria Facial - Collapsible */}
          <div className="border border-border/30 rounded-xl overflow-hidden">
            <button type="button" onClick={() => toggleSection('biometria')} className="w-full flex items-center justify-between px-4 py-3 bg-surface2 text-text font-medium">
              <span className="flex items-center gap-2"><Camera size={18} />Biometria Facial</span>
              {expandedSections.biometria ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {expandedSections.biometria && (
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <span className={form.face_embeddings ? 'text-green-400' : 'text-red-400'}>
                    {form.face_embeddings ? 'Cadastrado' : 'Nao cadastrado'}
                  </span>
                </div>
                <p className="text-text-muted text-sm">
                  Capture 5 fotos do rosto do aluno para habilitar check-in por reconhecimento facial.
                </p>
                <button type="button" onClick={() => alert('Funcionalidade de captura facial sera implementada em breve')}
                  className="bg-accent hover:bg-accent/90 text-text px-4 py-2 rounded-xl text-sm">
                  Capturar Fotos
                </button>
              </div>
            )}
          </div>

          <button onClick={save} disabled={!form.nome || !form.endereco || !form.escola_id}
            className="w-full bg-accent hover:bg-accent/90 text-text font-semibold py-3 rounded-xl disabled:opacity-50">
            {editing ? 'Salvar Alteracoes' : 'Cadastrar Aluno'}
          </button>
        </div>
      </Modal>
    </div>
    </PageTransition>
  );
}
