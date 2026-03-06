import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
export function EmptyState({ icon: Icon, message, action }) {
    return (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay: 0.1 }, className: "flex flex-col items-center justify-center py-20", children: [_jsx("div", { className: "w-16 h-16 rounded-2xl bg-surface2 flex items-center justify-center mb-4", children: _jsx(Icon, { size: 28, className: "text-text-muted/50" }) }), _jsx("p", { className: "text-text-muted text-center max-w-xs", children: message }), action && _jsx("div", { className: "mt-4", children: action })] }));
}
