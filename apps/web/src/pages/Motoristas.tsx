import { useEffect, useState } from 'react';
import { Plus, Pencil, Copy, Truck, ChevronRight, Calendar, MapPin, Users, Navigation } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { api } from '../lib/api';
import type { Motorista, RotaHistorico } from '@rotavans/shared';

interface MotoristaStats {
  motorista: Motorista;
  stats: {
    dias_trabalhados: number;
    total_rotas: number;
    total_alunos: number;
    total_km: number;
  };
  recent_routes: RotaHistorico[];
}

export function Motoristas() {
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [selected, setSelected] = useState<Motorista | null>(null);
  const [selectedStats, setSelectedStats] = useState<MotoristaStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Motorista | null>(null);
  const [form, setForm] = useState({ nome: '', telefone: '' });
  const [conviteUrl, setConviteUrl] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    const data = await api.get<Motorista[]>('/motoristas');
    setMotoristas(data);
  }

  async function selectMotorista(m: Motorista) {
    setSelected(m);
    setLoadingStats(true);
    try {
      const stats = await api.get<MotoristaStats>(`/motoristas/${m.id}/stats`);
      setSelectedStats(stats);
    } catch {
      setSelectedStats(null);
    } finally {
      setLoadingStats(false);
    }
  }

  function openNew() {
    setEditing(null);
    setForm({ nome: '', telefone: '' });
    setConviteUrl('');
    setModalOpen(true);
  }

  function openEdit(m: Motorista, e: React.MouseEvent) {
    e.stopPropagation();
    setEditing(m);
    setForm({ nome: m.nome, telefone: m.telefone || '' });
    setConviteUrl('');
    setModalOpen(true);
  }

  async function save() {
    if (editing) {
      await api.put(`/motoristas/${editing.id}`, form);
      setModalOpen(false);
      // Refresh stats if editing selected motorista
      if (selected?.id === editing.id) {
        selectMotorista(editing);
      }
    } else {
      const res = await api.post<any>('/motoristas', form);
      setConviteUrl(res.convite_url);
    }
    load();
  }

  async function reenviarConvite(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    const res = await api.post<any>(`/motoristas/${id}/reenviar-convite`, {});
    alert(`Link de convite copiado!\n${res.convite_url}`);
    navigator.clipboard.writeText(res.convite_url);
  }

  function copyUrl() {
    navigator.clipboard.writeText(conviteUrl);
    alert('Link copiado!');
  }

  function formatDate(d?: string) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function formatDateTime(d?: string) {
    if (!d) return '-';
    return new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-48px)]">
      {/* Lista de motoristas */}
      <div className="w-80 shrink-0">
        <PageHeader
          title="Motoristas"
          subtitle={`${motoristas.length} motorista(s)`}
          action={
            <button
              onClick={openNew}
              className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-beige px-3 py-2 rounded-xl text-sm font-medium"
            >
              <Plus size={16} />
            </button>
          }
        />

        {motoristas.length === 0 ? (
          <EmptyState icon={Truck} message="Nenhum motorista cadastrado" />
        ) : (
          <div className="space-y-2">
            {motoristas.map((m) => (
              <button
                key={m.id}
                onClick={() => selectMotorista(m)}
                className={`w-full text-left bg-beige/5 border rounded-xl p-4 transition-colors ${
                  selected?.id === m.id
                    ? 'border-accent'
                    : 'border-beige/10 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-beige font-medium truncate">{m.nome}</p>
                      {m.cadastro_completo ? (
                        <span className="text-accent2 text-xs bg-accent2/10 px-2 py-0.5 rounded-full shrink-0">Ativo</span>
                      ) : (
                        <span className="text-warn text-xs bg-warn/10 px-2 py-0.5 rounded-full shrink-0">Pendente</span>
                      )}
                    </div>
                    <p className="text-beige/40 text-xs mt-1">{m.telefone || 'Sem telefone'}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => openEdit(m, e)}
                      className="text-beige/40 hover:text-beige p-1"
                    >
                      <Pencil size={14} />
                    </button>
                    {!m.cadastro_completo && (
                      <button
                        onClick={(e) => reenviarConvite(m.id, e)}
                        className="text-beige/40 hover:text-accent p-1"
                        title="Reenviar convite"
                      >
                        <Copy size={14} />
                      </button>
                    )}
                    <ChevronRight size={18} className="text-beige/30" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Perfil do motorista */}
      <div className="flex-1 p-6 overflow-y-auto">
        {selected && selectedStats ? (
          <div className="space-y-6">
            {/* Header com foto e info basica */}
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-full bg-beige/5 flex items-center justify-center overflow-hidden shrink-0">
                {selectedStats.motorista.foto_url ? (
                  <img
                    src={selectedStats.motorista.foto_url}
                    alt={selectedStats.motorista.nome}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Truck size={32} className="text-beige/30" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-beige">{selectedStats.motorista.nome}</h2>
                <p className="text-beige/40 text-sm mt-1">{selectedStats.motorista.telefone || 'Sem telefone'}</p>
                <div className="flex items-center gap-3 mt-2">
                  {selectedStats.motorista.cadastro_completo ? (
                    <span className="text-accent2 text-xs bg-accent2/10 px-3 py-1 rounded-full">Ativo</span>
                  ) : (
                    <span className="text-warn text-xs bg-warn/10 px-3 py-1 rounded-full">Pendente</span>
                  )}
                  <span className="text-beige/30 text-xs">
                    Desde {formatDate(selectedStats.motorista.criado_em)}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-xl p-4 border border-beige/10">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={16} className="text-accent" />
                  <p className="text-beige/40 text-xs">Dias Trabalhados</p>
                </div>
                <p className="text-2xl font-bold text-beige">{selectedStats.stats.dias_trabalhados}</p>
              </div>
              <div className="rounded-xl p-4 border border-beige/10">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={16} className="text-accent2" />
                  <p className="text-beige/40 text-xs">Rotas Realizadas</p>
                </div>
                <p className="text-2xl font-bold text-beige">{selectedStats.stats.total_rotas}</p>
              </div>
              <div className="rounded-xl p-4 border border-beige/10">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={16} className="text-warn" />
                  <p className="text-beige/40 text-xs">Alunos Transportados</p>
                </div>
                <p className="text-2xl font-bold text-beige">{selectedStats.stats.total_alunos}</p>
              </div>
              <div className="rounded-xl p-4 border border-beige/10">
                <div className="flex items-center gap-2 mb-2">
                  <Navigation size={16} className="text-purple-400" />
                  <p className="text-beige/40 text-xs">KM Percorridos</p>
                </div>
                <p className="text-2xl font-bold text-beige">{selectedStats.stats.total_km.toFixed(1)}</p>
              </div>
            </div>

            {/* Rotas recentes */}
            <div>
              <h3 className="text-sm text-beige/40 mb-3">Rotas Recentes</h3>
              {selectedStats.recent_routes.length > 0 ? (
                <div className="space-y-2">
                  {selectedStats.recent_routes.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between rounded-xl p-4 border border-beige/10"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                          <MapPin size={18} className="text-accent" />
                        </div>
                        <div>
                          <p className="text-beige text-sm font-medium">{r.rota_nome || 'Rota sem nome'}</p>
                          <p className="text-beige/40 text-xs">{formatDateTime(r.data_inicio)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <div className="text-center">
                          <p className="text-accent2 font-medium">{r.alunos_embarcados}</p>
                          <p className="text-beige/30">alunos</p>
                        </div>
                        {r.km_total && (
                          <div className="text-center">
                            <p className="text-purple-400 font-medium">{r.km_total.toFixed(1)}</p>
                            <p className="text-beige/30">km</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl p-4 border border-beige/10 text-center text-beige/30 text-sm">
                  Nenhuma rota realizada ainda
                </div>
              )}
            </div>
          </div>
        ) : loadingStats ? (
          <div className="flex items-center justify-center h-full text-beige/30">
            <p>Carregando...</p>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-beige/30">
            <p>Selecione um motorista para ver detalhes</p>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Motorista' : 'Novo Motorista'}>
        {conviteUrl ? (
          <div className="space-y-4">
            <p className="text-beige/40 text-sm">Motorista criado! Envie o link abaixo para ele completar o cadastro:</p>
            <div className="rounded-xl p-4 border border-beige/10 flex items-center gap-2">
              <input value={conviteUrl} readOnly className="flex-1 bg-transparent text-beige text-sm focus:outline-none" />
              <button onClick={copyUrl} className="text-accent hover:text-accent/80"><Copy size={18} /></button>
            </div>
            <button onClick={() => setModalOpen(false)} className="w-full bg-accent hover:bg-accent/90 text-beige font-semibold py-3 rounded-xl">Fechar</button>
          </div>
        ) : (
          <div className="space-y-4">
            <div><label className="block text-sm text-beige/40 mb-1">Nome</label>
              <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="w-full bg-beige/5 border border-beige/10 rounded-xl px-4 py-3 text-beige text-sm focus:outline-none focus:border-accent" /></div>
            <div><label className="block text-sm text-beige/40 mb-1">Telefone</label>
              <input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} className="w-full bg-beige/5 border border-beige/10 rounded-xl px-4 py-3 text-beige text-sm focus:outline-none focus:border-accent" /></div>
            <button onClick={save} className="w-full bg-accent hover:bg-accent/90 text-beige font-semibold py-3 rounded-xl">{editing ? 'Salvar' : 'Criar e Gerar Convite'}</button>
          </div>
        )}
      </Modal>
    </div>
  );
}
