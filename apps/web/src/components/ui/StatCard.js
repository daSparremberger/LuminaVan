import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
import { staggerItem } from './PageTransition';
export function StatCard({ label, value, icon: Icon, trend, subtitle }) {
    return (_jsxs(motion.div, { variants: staggerItem, whileHover: { y: -2 }, transition: { duration: 0.15 }, className: "bg-surface border border-border/50 rounded-2xl p-5\n                 hover:shadow-md transition-all duration-200", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx(Icon, { size: 18, strokeWidth: 1.5, className: "text-text-muted" }), _jsx("span", { className: "text-sm font-medium text-text-muted", children: label })] }), _jsxs("div", { className: "flex items-end justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-3xl font-semibold text-text tracking-tight", children: value }), subtitle && (_jsx("p", { className: "text-xs text-text-muted mt-1", children: subtitle }))] }), trend && (_jsxs("div", { className: `flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${trend.positive
                            ? 'bg-success-muted text-success'
                            : 'bg-danger-muted text-danger'}`, children: [_jsx("span", { children: trend.positive ? '↑' : '↓' }), _jsxs("span", { children: [Math.abs(trend.value), "%"] })] }))] })] }));
}
