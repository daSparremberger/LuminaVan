import { Fragment, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, School, X, Users } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { PageTransition } from '../components/ui/PageTransition';
import { api } from '../lib/api';
import type { Escola, EscolaContato } from '@rotavans/shared';

interface ContatoForm {
  id?: number;
  cargo: string;
  nome: string;
  telefone: string;
}

const CARGO_OPTIONS = ['Diretor', 'Coordenador', 'Secretario', 'Outro'] as const;

export function Escolas() {
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Escola | null>(null);
  const [form, setForm] = useState({ nome: '', endereco: '', turno_manha: false, turno_tarde: false, turno_noite: false });
  const [contatos, setContatos] = useState<ContatoForm[]>([]);
  const [originalContatos, setOriginalContatos] = useState<EscolaContato[]>([]);
  const [expandedSchool, setExpandedSchool] = useState<number | null>(null);
  const [schoolContatos, setSchoolContatos] = useState<EscolaContato[]>([]);

  useEffect(() => { load(); }, []);

  async function load() {
    const data = await api.get<Escola[]>('/escolas');
    setEscolas(data);
  }

  function openNew() {
    setEditing(null);
    setForm({ nome: '', endereco: '', turno_manha: false, turno_tarde: false, turno_noite: false });
    setContatos([]);
    setOriginalContatos([]);
    setModalOpen(true);
  }

  async function openEdit(e: Escola) {
    setEditing(e);
    setForm({ nome: e.nome, endereco: e.endereco, turno_manha: e.turno_manha, turno_tarde: e.turno_tarde, turno_noite: e.turno_noite });
    // Load contacts for this school
    try {
      const escola = await api.get<Escola>(`/escolas/${e.id}`);
      const contatosData = escola.contatos || [];
      setOriginalContatos(contatosData);
      setContatos(contatosData.map(c => ({ id: c.id, cargo: c.cargo, nome: c.nome, telefone: c.telefone || '' })));
    } catch {
      setContatos([]);
      setOriginalContatos([]);
    }
    setModalOpen(true);
  }

  function addContato() {
    setContatos([...contatos, { cargo: 'Diretor', nome: '', telefone: '' }]);
  }

  function removeContato(index: number) {
    setContatos(contatos.filter((_, i) => i !== index));
  }

  function updateContato(index: number, field: keyof ContatoForm, value: string) {
    setContatos(contatos.map((c, i) => i === index ? { ...c, [field]: value } : c));
  }

  async function save() {
    let escolaId: number;

    if (editing) {
      await api.put(`/escolas/${editing.id}`, form);
      escolaId = editing.id;
    } else {
      const newEscola = await api.post<Escola>('/escolas', form);
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
        } else {
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

  async function remove(id: number) {
    if (!confirm('Excluir esta escola?')) return;
    await api.delete(`/escolas/${id}`);
    load();
  }

  async function toggleContatos(escolaId: number) {
    if (expandedSchool === escolaId) {
      setExpandedSchool(null);
      setSchoolContatos([]);
    } else {
      try {
        const escola = await api.get<Escola>(`/escolas/${escolaId}`);
        setSchoolContatos(escola.contatos || []);
        setExpandedSchool(escolaId);
      } catch {
        setSchoolContatos([]);
        setExpandedSchool(escolaId);
      }
    }
  }

  return (
    <PageTransition>
    <div>
      <PageHeader
        title="Escolas"
        subtitle={`${escolas.length} escola(s) cadastrada(s)`}
        action={
          <button onClick={openNew} className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-surface px-4 py-2 rounded-xl text-sm font-medium">
            <Plus size={18} /> Nova Escola
          </button>
        }
      />

      {escolas.length === 0 ? (
        <EmptyState icon={School} message="Nenhuma escola cadastrada" />
      ) : (
        <div className="ui-table-wrap">
          <table className="w-full">
            <thead className="ui-table-head">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Endereço</th>
                <th className="px-4 py-3">Turnos</th>
                <th className="px-4 py-3">Contatos</th>
                <th className="px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {escolas.map((e) => (
                <Fragment key={e.id}>
                  <tr className="ui-table-row">
                    <td className="px-4 py-3 text-text">{e.nome}</td>
                    <td className="px-4 py-3 text-text-muted">{e.endereco}</td>
                    <td className="px-4 py-3 text-text-muted">
                      {[e.turno_manha && 'M', e.turno_tarde && 'T', e.turno_noite && 'N'].filter(Boolean).join(', ') || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleContatos(e.id)}
                        className="flex items-center gap-1 text-text-muted hover:text-accent"
                      >
                        <Users size={16} />
                        <span className="text-xs">Ver</span>
                      </button>
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      <button onClick={() => openEdit(e)} className="text-text-muted hover:text-text"><Pencil size={16} /></button>
                      <button onClick={() => remove(e.id)} className="text-text-muted hover:text-red-400"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                  {expandedSchool === e.id && (
                    <tr className="bg-surface2/30">
                      <td colSpan={5} className="px-4 py-3">
                        {schoolContatos.length === 0 ? (
                          <p className="text-text-muted text-sm">Nenhum contato cadastrado</p>
                        ) : (
                          <div className="space-y-2">
                            {schoolContatos.map((c) => (
                              <div key={c.id} className="flex items-center gap-4 text-sm">
                                <span className="bg-accent/20 text-accent px-2 py-0.5 rounded text-xs font-medium">{c.cargo}</span>
                                <span className="text-text">{c.nome}</span>
                                {c.telefone && <span className="text-text-muted">{c.telefone}</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Escola' : 'Nova Escola'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-text-muted mb-1">Nome</label>
            <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })}
              className="w-full ui-input" />
          </div>
          <div>
            <label className="block text-sm text-text-muted mb-1">Endereço</label>
            <input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })}
              className="w-full ui-input" />
          </div>
          <div>
            <label className="block text-sm text-text-muted mb-2">Turnos</label>
            <div className="flex gap-4">
              {(['manha', 'tarde', 'noite'] as const).map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm text-text-muted">
                  <input type="checkbox" checked={form[`turno_${t}`]} onChange={(e) => setForm({ ...form, [`turno_${t}`]: e.target.checked })}
                    className="rounded bg-surface2 border-border/30" />
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </label>
              ))}
            </div>
          </div>

          {/* Contatos section */}
          <div>
            <label className="block text-sm text-text-muted mb-2">Contatos</label>
            <div className="space-y-2">
              {contatos.map((c, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select
                    value={c.cargo}
                    onChange={(e) => updateContato(i, 'cargo', e.target.value)}
                    className="bg-surface2 border border-border/30 rounded-xl px-3 py-2 text-text text-sm focus:border-success focus:outline-none"
                  >
                    {CARGO_OPTIONS.map((cargo) => (
                      <option key={cargo} value={cargo}>{cargo}</option>
                    ))}
                  </select>
                  <input
                    placeholder="Nome"
                    value={c.nome}
                    onChange={(e) => updateContato(i, 'nome', e.target.value)}
                    className="flex-1 bg-surface2 border border-border/30 rounded-xl px-3 py-2 text-text text-sm focus:border-success focus:outline-none"
                  />
                  <input
                    placeholder="Telefone"
                    value={c.telefone}
                    onChange={(e) => updateContato(i, 'telefone', e.target.value)}
                    className="w-32 bg-surface2 border border-border/30 rounded-xl px-3 py-2 text-text text-sm focus:border-success focus:outline-none"
                  />
                  <button
                    onClick={() => removeContato(i)}
                    className="text-text-muted hover:text-red-400 p-1"
                    type="button"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
              <button
                onClick={addContato}
                type="button"
                className="flex items-center gap-1 text-accent hover:text-accent/80 text-sm font-medium"
              >
                <Plus size={16} /> Adicionar Contato
              </button>
            </div>
          </div>

          <button onClick={save} className="w-full bg-accent hover:bg-accent-hover text-surface font-semibold py-3 rounded-xl">
            {editing ? 'Salvar' : 'Criar'}
          </button>
        </div>
      </Modal>
    </div>
    </PageTransition>
  );
}






