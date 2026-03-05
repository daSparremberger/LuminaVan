import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Users, Map, Truck, Car, Activity } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, } from 'recharts';
import { StatCard } from '../components/ui/StatCard';
import { api } from '../lib/api';
// LuminaGO-inspired color palette
const COLORS = ['#F7AF27', '#4285F4', '#22C55E', '#EC4899', '#8B5CF6', '#EF4444'];
const tooltipStyle = {
    contentStyle: { backgroundColor: '#2A241E', border: '1px solid #3D352C', color: '#F7F1E4' },
};
export function Dashboard() {
    const [stats, setStats] = useState({
        veiculos_ativos: 0,
        veiculos_total: 0,
        motoristas_em_acao: 0,
        rotas_hoje: 0,
        alunos_total: 0,
    });
    const [charts, setCharts] = useState({
        rotas_por_dia: [],
        alunos_por_escola: [],
        financeiro_mensal: [],
        atividade_por_turno: [],
    });
    useEffect(() => {
        api.get('/dashboard/stats').then(setStats).catch(() => { });
        api.get('/dashboard/charts').then(setCharts).catch(() => { });
    }, []);
    return (_jsxs("div", { className: "space-y-8", children: [_jsx("h1", { className: "text-3xl font-bold text-beige", children: "Dashboard" }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4", children: [_jsx(StatCard, { label: "Veiculos Ativos", value: stats.veiculos_ativos, icon: Car, color: "accent2" }), _jsx(StatCard, { label: "Veiculos Total", value: stats.veiculos_total, icon: Truck, color: "accent" }), _jsx(StatCard, { label: "Motoristas em Acao", value: stats.motoristas_em_acao, icon: Activity, color: "warn" }), _jsx(StatCard, { label: "Rotas Hoje", value: stats.rotas_hoje, icon: Map, color: "accent" }), _jsx(StatCard, { label: "Alunos", value: stats.alunos_total, icon: Users, color: "accent2" })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-beige text-lg font-bold mb-5", children: "Rotas por Dia" }), _jsx(ResponsiveContainer, { width: "100%", height: 240, children: _jsxs(LineChart, { data: charts.rotas_por_dia, children: [_jsx(XAxis, { dataKey: "data", stroke: "#4a453d", fontSize: 11, tickLine: false, axisLine: false }), _jsx(YAxis, { stroke: "#4a453d", fontSize: 11, tickLine: false, axisLine: false }), _jsx(Tooltip, { ...tooltipStyle }), _jsx(Line, { type: "monotone", dataKey: "total", stroke: COLORS[0], strokeWidth: 2, dot: { fill: COLORS[0], r: 3 } })] }) })] }), _jsxs("div", { children: [_jsx("h2", { className: "text-beige text-lg font-bold mb-5", children: "Alunos por Escola" }), _jsx(ResponsiveContainer, { width: "100%", height: 240, children: _jsxs(PieChart, { children: [_jsx(Pie, { data: charts.alunos_por_escola, dataKey: "total", nameKey: "escola", cx: "50%", cy: "50%", outerRadius: 80, label: ({ name }) => name, labelLine: { stroke: '#4a453d' }, children: charts.alunos_por_escola.map((_, index) => (_jsx(Cell, { fill: COLORS[index % COLORS.length] }, `cell-${index}`))) }), _jsx(Tooltip, { ...tooltipStyle })] }) })] }), _jsxs("div", { children: [_jsx("h2", { className: "text-beige text-lg font-bold mb-5", children: "Receitas vs Despesas" }), _jsx(ResponsiveContainer, { width: "100%", height: 240, children: _jsxs(BarChart, { data: charts.financeiro_mensal, children: [_jsx(XAxis, { dataKey: "mes", stroke: "#4a453d", fontSize: 11, tickLine: false, axisLine: false }), _jsx(YAxis, { stroke: "#4a453d", fontSize: 11, tickLine: false, axisLine: false }), _jsx(Tooltip, { ...tooltipStyle }), _jsx(Bar, { dataKey: "receitas", fill: COLORS[2], name: "Receitas", radius: [4, 4, 0, 0] }), _jsx(Bar, { dataKey: "despesas", fill: COLORS[5], name: "Despesas", radius: [4, 4, 0, 0] })] }) })] }), _jsxs("div", { children: [_jsx("h2", { className: "text-beige text-lg font-bold mb-5", children: "Atividade por Turno" }), _jsx(ResponsiveContainer, { width: "100%", height: 240, children: _jsxs(BarChart, { data: charts.atividade_por_turno, layout: "vertical", children: [_jsx(XAxis, { type: "number", stroke: "#4a453d", fontSize: 11, tickLine: false, axisLine: false }), _jsx(YAxis, { dataKey: "turno", type: "category", stroke: "#4a453d", width: 60, fontSize: 11, tickLine: false, axisLine: false }), _jsx(Tooltip, { ...tooltipStyle }), _jsx(Bar, { dataKey: "rotas", radius: [0, 4, 4, 0], children: charts.atividade_por_turno.map((_, index) => (_jsx(Cell, { fill: COLORS[index % COLORS.length] }, `cell-${index}`))) })] }) })] })] })] }));
}
