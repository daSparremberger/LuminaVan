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
import { PageTransition, staggerContainer, staggerItem } from '../components/ui/PageTransition';
import { api } from '../lib/api';
import { motion } from 'framer-motion';
import type { DashboardStats, DashboardChartData } from '@rotavans/shared';

const COLORS = ['#D4A574', '#4285F4', '#22C55E', '#EC4899', '#8B5CF6', '#EF4444'];

const tooltipStyle = {
  contentStyle: {
    backgroundColor: 'var(--color-surface2)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text)',
    borderRadius: '12px',
  },
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
    <PageTransition>
      <h1 className="text-2xl font-bold text-text mb-8">Dashboard</h1>

      {/* Stat Cards */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8"
      >
        <StatCard label="Veiculos Ativos" value={stats.veiculos_ativos} icon={Car} />
        <StatCard label="Veiculos Total" value={stats.veiculos_total} icon={Truck} />
        <StatCard label="Motoristas em Acao" value={stats.motoristas_em_acao} icon={Activity} />
        <StatCard label="Rotas Hoje" value={stats.rotas_hoje} icon={Map} />
        <StatCard label="Alunos" value={stats.alunos_total} icon={Users} />
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <motion.div
          variants={staggerItem}
          initial="initial"
          animate="animate"
          className="bg-surface2 border border-border/30 rounded-2xl p-6"
        >
          <h2 className="text-text font-semibold mb-4">Rotas por Dia</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={charts.rotas_por_dia}>
              <XAxis dataKey="data" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="total" stroke={COLORS[0]} strokeWidth={2} dot={{ fill: COLORS[0], r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Pie Chart */}
        <motion.div
          variants={staggerItem}
          initial="initial"
          animate="animate"
          className="bg-surface2 border border-border/30 rounded-2xl p-6"
        >
          <h2 className="text-text font-semibold mb-4">Alunos por Escola</h2>
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
                labelLine={{ stroke: 'var(--color-text-muted)' }}
              >
                {charts.alunos_por_escola.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Bar Chart */}
        <motion.div
          variants={staggerItem}
          initial="initial"
          animate="animate"
          className="bg-surface2 border border-border/30 rounded-2xl p-6"
        >
          <h2 className="text-text font-semibold mb-4">Receitas vs Despesas</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={charts.financeiro_mensal}>
              <XAxis dataKey="mes" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="receitas" fill={COLORS[2]} name="Receitas" radius={[6, 6, 0, 0]} />
              <Bar dataKey="despesas" fill={COLORS[5]} name="Despesas" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Horizontal Bar Chart */}
        <motion.div
          variants={staggerItem}
          initial="initial"
          animate="animate"
          className="bg-surface2 border border-border/30 rounded-2xl p-6"
        >
          <h2 className="text-text font-semibold mb-4">Atividade por Turno</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={charts.atividade_por_turno} layout="vertical">
              <XAxis type="number" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis dataKey="turno" type="category" stroke="var(--color-text-muted)" width={60} fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="rotas" radius={[0, 6, 6, 0]}>
                {charts.atividade_por_turno.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </PageTransition>
  );
}
