import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
import { staggerItem } from './PageTransition';
export function StatCard({ label, value, icon: Icon, trend }) {
    return (_jsxs(motion.div, { variants: staggerItem, whileHover: { scale: 1.02, y: -2 }, transition: { duration: 0.2 }, className: "bg-surface2 border border-border/30 rounded-2xl p-5\n                 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5\n                 transition-all duration-300", children: [_jsxs("div", { className: "flex items-start justify-between mb-3", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-accent-muted flex items-center justify-center", children: _jsx(Icon, { size: 20, className: "text-accent" }) }), trend && (_jsxs("span", { className: `text-xs font-medium px-2 py-1 rounded-lg ${trend.positive
                            ? 'bg-green-500/10 text-green-500'
                            : 'bg-red-500/10 text-red-500'}`, children: [trend.positive ? '+' : '', trend.value, "%"] }))] }), _jsx("p", { className: "text-2xl font-bold text-text mb-1", children: value }), _jsx("p", { className: "text-sm text-text-muted", children: label })] }));
}
