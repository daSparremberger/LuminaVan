import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
export function PageHeader({ title, subtitle, action }) {
    return (_jsxs(motion.div, { initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 }, className: "flex items-center justify-between mb-8", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-text", children: title }), subtitle && (_jsx("p", { className: "text-sm text-text-muted mt-1", children: subtitle }))] }), action && _jsx("div", { children: action })] }));
}
