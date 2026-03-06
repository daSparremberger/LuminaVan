import { jsx as _jsx } from "react/jsx-runtime";
import { Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { useThemeStore } from '../../stores/theme';
export function ThemeToggle() {
    const { theme, toggleTheme } = useThemeStore();
    return (_jsx("button", { onClick: toggleTheme, className: "relative w-10 h-10 rounded-xl bg-surface2 hover:bg-surface3\n                 flex items-center justify-center transition-colors duration-200", "aria-label": theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro', children: _jsx(motion.div, { initial: false, animate: {
                rotate: theme === 'dark' ? 0 : 180,
                scale: [1, 0.8, 1],
            }, transition: { duration: 0.3 }, children: theme === 'dark' ? (_jsx(Moon, { size: 18, className: "text-text-muted" })) : (_jsx(Sun, { size: 18, className: "text-accent" })) }) }));
}
