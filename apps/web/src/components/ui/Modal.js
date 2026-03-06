import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
};
export function Modal({ open, onClose, title, children, size = 'md' }) {
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        }
        else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);
    return (_jsx(AnimatePresence, { children: open && (_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4", children: [_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.2 }, onClick: onClose, className: "absolute inset-0 bg-black/60 backdrop-blur-sm" }), _jsxs(motion.div, { initial: { opacity: 0, scale: 0.95, y: 20 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.95, y: 20 }, transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }, className: `relative w-full ${sizeClasses[size]} bg-surface border border-border/50
                       rounded-2xl shadow-2xl overflow-hidden`, children: [_jsxs("div", { className: "flex items-center justify-between px-6 py-4 border-b border-border/30", children: [_jsx("h2", { className: "text-lg font-bold text-text", children: title }), _jsx("button", { onClick: onClose, className: "w-8 h-8 rounded-lg flex items-center justify-center\n                          text-text-muted hover:text-text hover:bg-surface2\n                          transition-colors duration-200", children: _jsx(X, { size: 18 }) })] }), _jsx("div", { className: "p-6", children: children })] })] })) }));
}
