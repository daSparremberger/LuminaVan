import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function TenantsPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const token = useAuthStore((s) => s.token);
  useEffect(() => {
    fetch(`${API_URL}/admin/tenants`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(setTenants);
  }, [token]);
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Regioes</h2>
        <Link to="/admin/tenants/novo" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Nova Regiao</Link>
      </div>
      <div className="bg-zinc-900 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-zinc-800"><tr>
            <th className="text-left p-4 text-zinc-400">Nome</th>
            <th className="text-left p-4 text-zinc-400">Cidade</th>
            <th className="text-left p-4 text-zinc-400">Estado</th>
            <th className="text-left p-4 text-zinc-400">Gestores</th>
            <th className="text-left p-4 text-zinc-400">Status</th>
            <th className="text-left p-4 text-zinc-400">Acoes</th>
          </tr></thead>
          <tbody>
            {tenants.map((t) => (
              <tr key={t.id} className="border-t border-zinc-800">
                <td className="p-4 text-white">{t.nome}</td>
                <td className="p-4 text-zinc-400">{t.cidade}</td>
                <td className="p-4 text-zinc-400">{t.estado}</td>
                <td className="p-4 text-zinc-400">{t.total_gestores}</td>
                <td className="p-4"><span className={`px-2 py-1 rounded text-xs ${t.ativo ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>{t.ativo ? 'Ativo' : 'Inativo'}</span></td>
                <td className="p-4"><Link to={`/admin/tenants/${t.id}`} className="text-blue-500 hover:underline">Ver</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
