import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { clsx } from 'clsx';
export function StatCard({ label, value, icon: Icon, color = 'accent' }) {
    const c = {
        accent: 'text-accent',
        accent2: 'text-accent2',
        warn: 'text-warn',
    };
    return (_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: clsx('p-3 rounded-lg bg-beige/5', c[color]), children: _jsx(Icon, { size: 20 }) }), _jsxs("div", { children: [_jsx("p", { className: "text-beige/30 text-xs uppercase tracking-wider", children: label }), _jsx("p", { className: "text-beige text-2xl font-bold", children: value })] })] }));
}
