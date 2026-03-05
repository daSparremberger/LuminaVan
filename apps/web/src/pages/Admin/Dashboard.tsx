import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/auth';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const token = useAuthStore((s) => s.token);
  useEffect(() => {
    fetch(`${API_URL}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(setStats);
  }, [token]);
  const cards = [
    { label: 'Regioes', value: stats?.total_tenants || 0 },
    { label: 'Gestores', value: stats?.total_gestores || 0 },
    { label: 'Motoristas', value: stats?.total_motoristas || 0 },
    { label: 'Alunos', value: stats?.total_alunos || 0 },
  ];
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Dashboard</h2>
      <div className="grid grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-zinc-900 rounded-lg p-6">
            <p className="text-zinc-500 text-sm">{card.label}</p>
            <p className="text-3xl font-bold text-white mt-1">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
