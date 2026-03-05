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
  const [conviteLink, setConviteLink] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit) {
      fetch(`${API_URL}/admin/tenants/${id}`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(d => setForm({ nome: d.nome, cidade: d.cidade, estado: d.estado }));
    }
  }, [id, token, isEdit]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(isEdit ? `${API_URL}/admin/tenants/${id}` : `${API_URL}/admin/tenants`, {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form)
    });
    if (res.ok && !isEdit) { const d = await res.json(); navigate(`/admin/tenants/${d.id}`); }
    setLoading(false);
  }

  async function handleGerarConvite() {
    const res = await fetch(`${API_URL}/admin/tenants/${id}/convite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ dias_validade: 7 })
    });
    if (res.ok) { const d = await res.json(); setConviteLink(`${window.location.origin}/convite/${d.token}`); }
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-white mb-6">{isEdit ? 'Editar Regiao' : 'Nova Regiao'}</h2>
      <form onSubmit={handleSubmit} className="bg-zinc-900 rounded-lg p-6 space-y-4">
        <div><label className="block text-zinc-400 mb-1">Nome da Prefeitura</label>
          <input type="text" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2 text-white" required /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-zinc-400 mb-1">Cidade</label>
            <input type="text" value={form.cidade} onChange={e => setForm({...form, cidade: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2 text-white" required /></div>
          <div><label className="block text-zinc-400 mb-1">Estado</label>
            <input type="text" value={form.estado} onChange={e => setForm({...form, estado: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded px-4 py-2 text-white" maxLength={2} required /></div>
        </div>
        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50">{loading ? 'Salvando...' : 'Salvar'}</button>
      </form>
      {isEdit && (
        <div className="bg-zinc-900 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-bold text-white mb-4">Convite para Gestor</h3>
          {conviteLink ? (
            <div className="bg-zinc-800 p-4 rounded">
              <p className="text-zinc-400 text-sm mb-2">Link (valido 7 dias):</p>
              <div className="flex gap-2">
                <input type="text" value={conviteLink} readOnly className="flex-1 bg-zinc-700 border border-zinc-600 rounded px-4 py-2 text-white" />
                <button onClick={() => navigator.clipboard.writeText(conviteLink)} className="bg-zinc-700 text-white px-4 py-2 rounded">Copiar</button>
              </div>
            </div>
          ) : <button onClick={handleGerarConvite} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Gerar Link de Convite</button>}
        </div>
      )}
    </div>
  );
}
