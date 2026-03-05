import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };
export function Modal({ open, onClose, title, children, size = 'md' }) {
    return (_jsx(AnimatePresence, { children: open && (_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4", children: [_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "absolute inset-0 bg-black/60 backdrop-blur-sm", onClick: onClose }), _jsxs(motion.div, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 }, className: `relative bg-bg border border-beige/10 rounded-2xl w-full ${sizes[size]} p-6 shadow-2xl shadow-black/60`, children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsx("h2", { className: "text-xl font-bold text-beige", children: title }), _jsx("button", { onClick: onClose, className: "text-beige/30 hover:text-accent transition-colors", children: _jsx(X, { size: 20 }) })] }), children] })] })) }));
}
