import { useEffect, useState } from 'react';
import { Users, Map, Truck, Car, Activity } from 'lucide-react';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { StatCard } from '../components/ui/StatCard';
import { api } from '../lib/api';
import type { DashboardStats, DashboardChartData } from '@rotavans/shared';

// LuminaGO-inspired color palette
const COLORS = ['#F7AF27', '#4285F4', '#22C55E', '#EC4899', '#8B5CF6', '#EF4444'];

const tooltipStyle = {
  contentStyle: { backgroundColor: '#2A241E', border: '1px solid #3D352C', color: '#F7F1E4' },
};

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    veiculos_ativos: 0,
    veiculos_total: 0,
    motoristas_em_acao: 0,
    rotas_hoje: 0,
    alunos_total: 0,
  });
  const [charts, setCharts] = useState<DashboardChartData>({
    rotas_por_dia: [],
    alunos_por_escola: [],
    financeiro_mensal: [],
    atividade_por_turno: [],
  });

  useEffect(() => {
    api.get<DashboardStats>('/dashboard/stats').then(setStats).catch(() => {});
    api.get<DashboardChartData>('/dashboard/charts').then(setCharts).catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-beige">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          label="Veiculos Ativos"
          value={stats.veiculos_ativos}
          icon={Car}
          color="accent2"
        />
        <StatCard
          label="Veiculos Total"
          value={stats.veiculos_total}
          icon={Truck}
          color="accent"
        />
        <StatCard
          label="Motoristas em Acao"
          value={stats.motoristas_em_acao}
          icon={Activity}
          color="warn"
        />
        <StatCard
          label="Rotas Hoje"
          value={stats.rotas_hoje}
          icon={Map}
          color="accent"
        />
        <StatCard
          label="Alunos"
          value={stats.alunos_total}
          icon={Users}
          color="accent2"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Line Chart - Rotas por dia */}
        <div>
          <h2 className="text-beige text-lg font-bold mb-5">Rotas por Dia</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={charts.rotas_por_dia}>
              <XAxis dataKey="data" stroke="#4a453d" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#4a453d" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip {...tooltipStyle} />
              <Line
                type="monotone"
                dataKey="total"
                stroke={COLORS[0]}
                strokeWidth={2}
                dot={{ fill: COLORS[0], r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Alunos por escola */}
        <div>
          <h2 className="text-beige text-lg font-bold mb-5">Alunos por Escola</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={charts.alunos_por_escola}
                dataKey="total"
                nameKey="escola"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name }) => name as string}
                labelLine={{ stroke: '#4a453d' }}
              >
                {charts.alunos_por_escola.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart - Receitas vs Despesas */}
        <div>
          <h2 className="text-beige text-lg font-bold mb-5">Receitas vs Despesas</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={charts.financeiro_mensal}>
              <XAxis dataKey="mes" stroke="#4a453d" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#4a453d" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="receitas" fill={COLORS[2]} name="Receitas" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesas" fill={COLORS[5]} name="Despesas" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Horizontal Bar Chart - Atividade por turno */}
        <div>
          <h2 className="text-beige text-lg font-bold mb-5">Atividade por Turno</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={charts.atividade_por_turno} layout="vertical">
              <XAxis type="number" stroke="#4a453d" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis dataKey="turno" type="category" stroke="#4a453d" width={60} fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="rotas" radius={[0, 4, 4, 0]}>
                {charts.atividade_por_turno.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
