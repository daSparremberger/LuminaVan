# RotaVans Premium Design Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the RotaVans web app into a premium, polished experience with floating container layout, expandable sidebar, page animations, and light/dark theme support.

**Architecture:** CSS variables for theming, Zustand store for theme state, Framer Motion for animations, reorganized sidebar with categories. All components will read theme from CSS variables, making the theme toggle instant.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Framer Motion, Zustand, Lucide Icons

---

## Task 1: Update Tailwind Config with Premium Color Palette

**Files:**
- Modify: `apps/web/tailwind.config.ts`

**Step 1: Update tailwind config with new colors**

```typescript
import type { Config } from 'tailwindcss';
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Premium Design System - uses CSS variables for theming
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        surface2: 'var(--color-surface2)',
        surface3: 'var(--color-surface3)',
        border: 'var(--color-border)',
        text: 'var(--color-text)',
        'text-muted': 'var(--color-text-muted)',
        accent: 'var(--color-accent)',
        'accent-hover': 'var(--color-accent-hover)',
        'accent-muted': 'var(--color-accent-muted)',
      },
      fontFamily: {
        sans: ['Satoshi', 'system-ui', 'sans-serif'],
        heading: ['Plus Jakarta Sans', 'Satoshi', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      transitionDuration: {
        '350': '350ms',
      },
    },
  },
  plugins: [],
} satisfies Config;
```

**Step 2: Verify config is valid**

Run: `cd apps/web && npx tailwindcss --help`
Expected: No syntax errors

**Step 3: Commit**

```bash
git add apps/web/tailwind.config.ts
git commit -m "feat(web): update tailwind config with CSS variable-based theming"
```

---

## Task 2: Update Base CSS with Theme Variables

**Files:**
- Modify: `apps/web/src/index.css`

**Step 1: Replace index.css with theme-aware styles**

```css
@import url('https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

* { box-sizing: border-box; }

/* Dark Theme (Warm Espresso) - Default */
:root {
  --color-bg: #1A1613;
  --color-surface: #2D2520;
  --color-surface2: #3D352C;
  --color-surface3: #4A3F35;
  --color-border: #4A3F35;
  --color-text: #F7F1E4;
  --color-text-muted: #A89F94;
  --color-accent: #D4A574;
  --color-accent-hover: #C9963C;
  --color-accent-muted: rgba(212, 165, 116, 0.2);
}

/* Light Theme (Cream Elegante) */
.light {
  --color-bg: #FAF8F5;
  --color-surface: #FFFFFF;
  --color-surface2: #F5F0E8;
  --color-surface3: #EDE6DA;
  --color-border: #E5DDD0;
  --color-text: #2D2520;
  --color-text-muted: #6B5D4D;
  --color-accent: #D4A574;
  --color-accent-hover: #C9963C;
  --color-accent-muted: rgba(212, 165, 116, 0.15);
}

body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: 'Satoshi', system-ui, sans-serif;
  margin: 0;
  min-height: 100vh;
  transition: background-color 0.3s ease, color 0.3s ease;
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'Plus Jakarta Sans', 'Satoshi', system-ui, sans-serif;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--color-text);
}

/* Premium scrollbar */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: var(--color-surface3);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--color-accent);
}

/* Focus ring */
*:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* Floating app container */
.app-container {
  margin: 16px;
  height: calc(100vh - 32px);
  background: var(--color-surface);
  border-radius: 1rem;
  overflow: hidden;
  display: flex;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
}

.light .app-container {
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}
```

**Step 2: Commit**

```bash
git add apps/web/src/index.css
git commit -m "feat(web): add CSS variables for dark/light theme support"
```

---

## Task 3: Create Theme Store

**Files:**
- Create: `apps/web/src/stores/theme.ts`

**Step 1: Create theme store with Zustand**

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'dark' | 'light';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      setTheme: (theme) => {
        set({ theme });
        updateDocumentTheme(theme);
      },
      toggleTheme: () => {
        const newTheme = get().theme === 'dark' ? 'light' : 'dark';
        set({ theme: newTheme });
        updateDocumentTheme(newTheme);
      },
    }),
    {
      name: 'rotavans-theme',
      onRehydrateStorage: () => (state) => {
        if (state) {
          updateDocumentTheme(state.theme);
        }
      },
    }
  )
);

function updateDocumentTheme(theme: Theme) {
  if (theme === 'light') {
    document.documentElement.classList.add('light');
  } else {
    document.documentElement.classList.remove('light');
  }
}
```

**Step 2: Commit**

```bash
git add apps/web/src/stores/theme.ts
git commit -m "feat(web): add theme store with persistence"
```

---

## Task 4: Create Page Transition Component

**Files:**
- Create: `apps/web/src/components/ui/PageTransition.tsx`

**Step 1: Create animated page wrapper**

```tsx
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
    },
  },
};

export function PageTransition({ children, className = '' }: PageTransitionProps) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Stagger container for child animations
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};
```

**Step 2: Commit**

```bash
git add apps/web/src/components/ui/PageTransition.tsx
git commit -m "feat(web): add PageTransition component with framer-motion"
```

---

## Task 5: Create SearchBar Component

**Files:**
- Create: `apps/web/src/components/ui/SearchBar.tsx`

**Step 1: Create search bar component**

```tsx
import { Search } from 'lucide-react';
import { useState } from 'react';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
}

export function SearchBar({ placeholder = 'Pesquisar...', onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch?.(value);
  };

  return (
    <div className="relative w-full max-w-md">
      <Search
        size={18}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
      />
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full h-11 pl-11 pr-4 bg-surface2 border border-border/50 rounded-xl
                   text-text text-sm placeholder:text-text-muted/60
                   focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30
                   transition-all duration-200"
      />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/components/ui/SearchBar.tsx
git commit -m "feat(web): add SearchBar component"
```

---

## Task 6: Create ThemeToggle Component

**Files:**
- Create: `apps/web/src/components/ui/ThemeToggle.tsx`

**Step 1: Create theme toggle**

```tsx
import { Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { useThemeStore } from '../../stores/theme';

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className="relative w-10 h-10 rounded-xl bg-surface2 hover:bg-surface3
                 flex items-center justify-center transition-colors duration-200"
      aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
    >
      <motion.div
        initial={false}
        animate={{
          rotate: theme === 'dark' ? 0 : 180,
          scale: [1, 0.8, 1],
        }}
        transition={{ duration: 0.3 }}
      >
        {theme === 'dark' ? (
          <Moon size={18} className="text-text-muted" />
        ) : (
          <Sun size={18} className="text-accent" />
        )}
      </motion.div>
    </button>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/components/ui/ThemeToggle.tsx
git commit -m "feat(web): add ThemeToggle component with animation"
```

---

## Task 7: Create Header Component

**Files:**
- Create: `apps/web/src/components/layout/Header.tsx`

**Step 1: Create fixed header with search**

```tsx
import { Bell, User } from 'lucide-react';
import { SearchBar } from '../ui/SearchBar';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useAuthStore } from '../../stores/auth';

export function Header() {
  const { user } = useAuthStore();

  return (
    <header className="h-16 px-6 flex items-center justify-between border-b border-border/30 bg-surface/80 backdrop-blur-sm">
      {/* Left spacer */}
      <div className="w-32" />

      {/* Center - Search */}
      <SearchBar placeholder="Pesquisar alunos, rotas, veiculos..." />

      {/* Right - Actions */}
      <div className="flex items-center gap-3">
        <ThemeToggle />

        <button className="relative w-10 h-10 rounded-xl bg-surface2 hover:bg-surface3
                          flex items-center justify-center transition-colors duration-200">
          <Bell size={18} className="text-text-muted" />
          {/* Notification dot */}
          <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full" />
        </button>

        <button className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-surface2 transition-colors duration-200">
          <div className="w-8 h-8 rounded-lg bg-accent-muted flex items-center justify-center">
            <User size={16} className="text-accent" />
          </div>
          <span className="text-sm text-text-muted hidden lg:block max-w-24 truncate">
            {user?.nome?.split(' ')[0]}
          </span>
        </button>
      </div>
    </header>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/components/layout/Header.tsx
git commit -m "feat(web): add Header component with search and theme toggle"
```

---

## Task 8: Redesign Sidebar Component

**Files:**
- Modify: `apps/web/src/components/layout/Sidebar.tsx`

**Step 1: Complete sidebar redesign**

```tsx
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, School, Users, Truck, Car, Map, History,
  DollarSign, Radio, MessageCircle, LogOut, Settings, UserCircle
} from 'lucide-react';
import { useAuthStore } from '../../stores/auth';
import { clsx } from 'clsx';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface NavCategory {
  label: string;
  items: {
    to: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    label: string;
  }[];
}

const categories: NavCategory[] = [
  {
    label: 'Principal',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'Cadastros',
    items: [
      { to: '/escolas', icon: School, label: 'Escolas' },
      { to: '/alunos', icon: Users, label: 'Alunos' },
      { to: '/motoristas', icon: Truck, label: 'Motoristas' },
      { to: '/veiculos', icon: Car, label: 'Veiculos' },
    ],
  },
  {
    label: 'Operacoes',
    items: [
      { to: '/rotas', icon: Map, label: 'Rotas' },
      { to: '/rastreamento', icon: Radio, label: 'Ao Vivo' },
      { to: '/historico', icon: History, label: 'Historico' },
    ],
  },
  {
    label: 'Gestao',
    items: [
      { to: '/financeiro', icon: DollarSign, label: 'Financeiro' },
      { to: '/mensagens', icon: MessageCircle, label: 'Mensagens' },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { to: '/configuracoes', icon: Settings, label: 'Configuracoes' },
      { to: '/perfil', icon: UserCircle, label: 'Perfil' },
    ],
  },
];

export function Sidebar() {
  const { logout, user } = useAuthStore();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.aside
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      animate={{ width: isExpanded ? 240 : 72 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="relative flex flex-col h-full bg-surface shrink-0 border-r border-border/30"
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-border/30">
        <motion.div
          animate={{ opacity: isExpanded ? 1 : 0, width: isExpanded ? 'auto' : 0 }}
          transition={{ duration: 0.15 }}
          className="overflow-hidden"
        >
          <span className="font-heading font-bold text-accent text-xl whitespace-nowrap">
            RotaVans
          </span>
        </motion.div>
        {!isExpanded && (
          <span className="font-heading font-bold text-accent text-xl">R</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto overflow-x-hidden">
        {categories.map((category, idx) => (
          <div key={category.label} className={clsx(idx > 0 && 'mt-4')}>
            {/* Category label */}
            <motion.span
              animate={{ opacity: isExpanded ? 1 : 0, height: isExpanded ? 'auto' : 0 }}
              transition={{ duration: 0.15 }}
              className="block px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted/50 overflow-hidden"
            >
              {category.label}
            </motion.span>

            {/* Category items */}
            <div className="space-y-1">
              {category.items.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-accent-muted text-accent'
                        : 'text-text-muted hover:text-text hover:bg-surface2'
                    )
                  }
                >
                  <Icon size={20} className="shrink-0" />
                  <motion.span
                    animate={{ opacity: isExpanded ? 1 : 0, width: isExpanded ? 'auto' : 0 }}
                    transition={{ duration: 0.15 }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    {label}
                  </motion.span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-border/30">
        <motion.div
          animate={{ opacity: isExpanded ? 1 : 0, height: isExpanded ? 'auto' : 0 }}
          transition={{ duration: 0.15 }}
          className="px-3 pb-2 text-xs text-text-muted/50 truncate overflow-hidden"
        >
          {user?.nome}
        </motion.div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium
                     text-text-muted hover:text-text hover:bg-surface2 transition-all duration-200"
        >
          <LogOut size={20} className="shrink-0" />
          <motion.span
            animate={{ opacity: isExpanded ? 1 : 0, width: isExpanded ? 'auto' : 0 }}
            transition={{ duration: 0.15 }}
            className="whitespace-nowrap overflow-hidden"
          >
            Sair
          </motion.span>
        </button>
      </div>
    </motion.aside>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/components/layout/Sidebar.tsx
git commit -m "feat(web): redesign Sidebar with categories and hover expansion"
```

---

## Task 9: Update Layout Component

**Files:**
- Modify: `apps/web/src/components/layout/Layout.tsx`

**Step 1: Update layout with floating container and header**

```tsx
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

export function Layout() {
  const location = useLocation();

  return (
    <div className="app-container">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <div key={location.pathname}>
              <Outlet />
            </div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/components/layout/Layout.tsx
git commit -m "feat(web): update Layout with Header and AnimatePresence"
```

---

## Task 10: Update UI Components - StatCard

**Files:**
- Modify: `apps/web/src/components/ui/StatCard.tsx`

**Step 1: Read current file**

Run: Read `apps/web/src/components/ui/StatCard.tsx`

**Step 2: Update StatCard with premium styling**

```tsx
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerItem } from './PageTransition';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
}

export function StatCard({ label, value, icon: Icon, trend }: StatCardProps) {
  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
      className="bg-surface2 border border-border/30 rounded-2xl p-5
                 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5
                 transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-accent-muted flex items-center justify-center">
          <Icon size={20} className="text-accent" />
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
            trend.positive
              ? 'bg-green-500/10 text-green-500'
              : 'bg-red-500/10 text-red-500'
          }`}>
            {trend.positive ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-text mb-1">{value}</p>
      <p className="text-sm text-text-muted">{label}</p>
    </motion.div>
  );
}
```

**Step 3: Commit**

```bash
git add apps/web/src/components/ui/StatCard.tsx
git commit -m "feat(web): update StatCard with premium styling and animations"
```

---

## Task 11: Update UI Components - Modal

**Files:**
- Modify: `apps/web/src/components/ui/Modal.tsx`

**Step 1: Read current file**

Run: Read `apps/web/src/components/ui/Modal.tsx`

**Step 2: Update Modal with premium styling**

```tsx
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode, useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={`relative w-full ${sizeClasses[size]} bg-surface border border-border/50
                       rounded-2xl shadow-2xl overflow-hidden`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
              <h2 className="text-lg font-bold text-text">{title}</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center
                          text-text-muted hover:text-text hover:bg-surface2
                          transition-colors duration-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
```

**Step 3: Commit**

```bash
git add apps/web/src/components/ui/Modal.tsx
git commit -m "feat(web): update Modal with backdrop blur and animations"
```

---

## Task 12: Update UI Components - PageHeader and EmptyState

**Files:**
- Modify: `apps/web/src/components/ui/PageHeader.tsx`
- Modify: `apps/web/src/components/ui/EmptyState.tsx`

**Step 1: Update PageHeader**

```tsx
import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-between mb-8"
    >
      <div>
        <h1 className="text-2xl font-bold text-text">{title}</h1>
        {subtitle && (
          <p className="text-sm text-text-muted mt-1">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </motion.div>
  );
}
```

**Step 2: Update EmptyState**

```tsx
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, message, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="flex flex-col items-center justify-center py-20"
    >
      <div className="w-16 h-16 rounded-2xl bg-surface2 flex items-center justify-center mb-4">
        <Icon size={28} className="text-text-muted/50" />
      </div>
      <p className="text-text-muted text-center max-w-xs">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}
```

**Step 3: Commit**

```bash
git add apps/web/src/components/ui/PageHeader.tsx apps/web/src/components/ui/EmptyState.tsx
git commit -m "feat(web): update PageHeader and EmptyState with animations"
```

---

## Task 13: Create Perfil Page

**Files:**
- Create: `apps/web/src/pages/Perfil.tsx`

**Step 1: Create profile page**

```tsx
import { useState } from 'react';
import { Camera, MapPin, Save } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { PageTransition } from '../components/ui/PageTransition';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/auth';

const regioes = [
  'Sul',
  'Sudeste',
  'Centro-Oeste',
  'Nordeste',
  'Norte',
];

const estados = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export function Perfil() {
  const { user } = useAuthStore();
  const [form, setForm] = useState({
    nome: user?.nome || '',
    email: user?.email || '',
    cidade: '',
    estado: 'SP',
    regiao: 'Sudeste',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // TODO: Implement save
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false);
  };

  const inputClass = "w-full h-12 px-4 bg-surface2 border border-border/50 rounded-xl text-text text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all duration-200";

  return (
    <PageTransition>
      <PageHeader title="Perfil" subtitle="Gerencie suas informacoes pessoais" />

      <div className="max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface2 border border-border/30 rounded-2xl p-6 mb-6"
        >
          {/* Avatar */}
          <div className="flex items-center gap-6 mb-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-accent-muted flex items-center justify-center">
                <span className="text-3xl font-bold text-accent">
                  {form.nome.charAt(0).toUpperCase()}
                </span>
              </div>
              <button className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-accent flex items-center justify-center hover:bg-accent-hover transition-colors">
                <Camera size={14} className="text-surface" />
              </button>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text">{form.nome}</h3>
              <p className="text-sm text-text-muted">{form.email}</p>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-text-muted mb-2">Nome completo</label>
                <input
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm text-text-muted mb-2">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Localizacao */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface2 border border-border/30 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent-muted flex items-center justify-center">
              <MapPin size={18} className="text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-text">Localizacao</h3>
              <p className="text-sm text-text-muted">Regiao de operacao</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-text-muted mb-2">Cidade</label>
              <input
                value={form.cidade}
                onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                placeholder="Sua cidade"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-2">Estado</label>
              <select
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value })}
                className={inputClass}
              >
                {estados.map(uf => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-2">Regiao</label>
              <select
                value={form.regiao}
                onChange={(e) => setForm({ ...form, regiao: e.target.value })}
                className={inputClass}
              >
                {regioes.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Save button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 w-full h-12 bg-accent hover:bg-accent-hover
                     text-surface font-semibold rounded-xl transition-colors duration-200 disabled:opacity-50"
        >
          <Save size={18} />
          {saving ? 'Salvando...' : 'Salvar alteracoes'}
        </motion.button>
      </div>
    </PageTransition>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/pages/Perfil.tsx
git commit -m "feat(web): add Perfil page"
```

---

## Task 14: Create Configuracoes Page

**Files:**
- Create: `apps/web/src/pages/Configuracoes.tsx`

**Step 1: Create settings page**

```tsx
import { Moon, Sun, Globe, Calendar, ChevronRight } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { PageTransition } from '../components/ui/PageTransition';
import { motion } from 'framer-motion';
import { useThemeStore } from '../stores/theme';
import { useState } from 'react';

const idiomas = [
  { code: 'pt-BR', label: 'Portugues (Brasil)' },
  { code: 'en-US', label: 'English (US)' },
  { code: 'es', label: 'Espanol' },
];

const formatosData = [
  { code: 'DD/MM/YYYY', label: '31/12/2026' },
  { code: 'MM/DD/YYYY', label: '12/31/2026' },
  { code: 'YYYY-MM-DD', label: '2026-12-31' },
];

export function Configuracoes() {
  const { theme, toggleTheme } = useThemeStore();
  const [idioma, setIdioma] = useState('pt-BR');
  const [formatoData, setFormatoData] = useState('DD/MM/YYYY');

  const selectClass = "w-full h-12 px-4 bg-surface2 border border-border/50 rounded-xl text-text text-sm focus:outline-none focus:border-accent appearance-none cursor-pointer";

  return (
    <PageTransition>
      <PageHeader title="Configuracoes" subtitle="Personalize sua experiencia" />

      <div className="max-w-2xl space-y-6">
        {/* Aparencia */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface2 border border-border/30 rounded-2xl p-6"
        >
          <h3 className="font-semibold text-text mb-6">Aparencia</h3>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent-muted flex items-center justify-center">
                {theme === 'dark' ? (
                  <Moon size={18} className="text-accent" />
                ) : (
                  <Sun size={18} className="text-accent" />
                )}
              </div>
              <div>
                <p className="font-medium text-text">Tema</p>
                <p className="text-sm text-text-muted">
                  {theme === 'dark' ? 'Escuro' : 'Claro'}
                </p>
              </div>
            </div>

            {/* Toggle */}
            <button
              onClick={toggleTheme}
              className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${
                theme === 'light' ? 'bg-accent' : 'bg-surface3'
              }`}
            >
              <motion.div
                animate={{ x: theme === 'light' ? 24 : 4 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
              />
            </button>
          </div>
        </motion.div>

        {/* Idioma */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-surface2 border border-border/30 rounded-2xl p-6"
        >
          <h3 className="font-semibold text-text mb-6">Idioma e Regiao</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent-muted flex items-center justify-center">
                  <Globe size={18} className="text-accent" />
                </div>
                <div>
                  <p className="font-medium text-text">Idioma</p>
                  <p className="text-sm text-text-muted">Idioma da interface</p>
                </div>
              </div>
              <select
                value={idioma}
                onChange={(e) => setIdioma(e.target.value)}
                className="w-48 h-10 px-3 bg-surface3 border border-border/50 rounded-xl text-text text-sm focus:outline-none focus:border-accent cursor-pointer"
              >
                {idiomas.map(i => (
                  <option key={i.code} value={i.code}>{i.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent-muted flex items-center justify-center">
                  <Calendar size={18} className="text-accent" />
                </div>
                <div>
                  <p className="font-medium text-text">Formato de data</p>
                  <p className="text-sm text-text-muted">Como exibir datas</p>
                </div>
              </div>
              <select
                value={formatoData}
                onChange={(e) => setFormatoData(e.target.value)}
                className="w-48 h-10 px-3 bg-surface3 border border-border/50 rounded-xl text-text text-sm focus:outline-none focus:border-accent cursor-pointer"
              >
                {formatosData.map(f => (
                  <option key={f.code} value={f.code}>{f.label}</option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Futuras Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-surface2 border border-border/30 rounded-2xl p-6"
        >
          <h3 className="font-semibold text-text mb-2">Em breve</h3>
          <p className="text-sm text-text-muted mb-6">Novas funcionalidades em desenvolvimento</p>

          <div className="space-y-3">
            {['Notificacoes', 'Integrações', 'Backup de dados', 'API Access'].map((feature) => (
              <div
                key={feature}
                className="flex items-center justify-between p-4 bg-surface3/50 rounded-xl opacity-50"
              >
                <span className="text-text-muted">{feature}</span>
                <ChevronRight size={18} className="text-text-muted/50" />
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/pages/Configuracoes.tsx
git commit -m "feat(web): add Configuracoes page with theme toggle"
```

---

## Task 15: Update App.tsx with New Routes

**Files:**
- Modify: `apps/web/src/App.tsx`

**Step 1: Add new page imports and routes**

```tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth';
import { Layout } from './components/layout/Layout';
import { LoginPage as Login } from './pages/Login';
import { ConvitePage } from './pages/Convite';
import { Dashboard } from './pages/Dashboard';
import { Escolas } from './pages/Escolas';
import { Alunos } from './pages/Alunos';
import { Motoristas } from './pages/Motoristas';
import { Rotas } from './pages/Rotas';
import { Veiculos } from './pages/Veiculos';
import { Historico } from './pages/Historico';
import { Financeiro } from './pages/Financeiro';
import { Rastreamento } from './pages/Rastreamento';
import { Mensagens } from './pages/Mensagens';
import { Perfil } from './pages/Perfil';
import { Configuracoes } from './pages/Configuracoes';
import { AdminLayout } from './pages/Admin';
import { AdminDashboard } from './pages/Admin/Dashboard';
import { TenantsPage } from './pages/Admin/Tenants';
import { TenantFormPage } from './pages/Admin/TenantForm';
import { useEffect } from 'react';
import { useThemeStore } from './stores/theme';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { role } = useAuthStore();
  if (!role) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function RootRedirect() {
  const { role } = useAuthStore();
  if (!role) return <Navigate to="/login" replace />;
  if (role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  // Initialize theme on mount
  const { theme } = useThemeStore();

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/convite/:token" element={<ConvitePage />} />

      {/* Root redirect based on role */}
      <Route path="/" element={<RootRedirect />} />

      {/* Admin routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="tenants" element={<TenantsPage />} />
        <Route path="tenants/:id" element={<TenantFormPage />} />
      </Route>

      {/* Gestor routes */}
      <Route element={
        <ProtectedRoute allowedRoles={['gestor']}>
          <Layout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="escolas" element={<Escolas />} />
        <Route path="alunos" element={<Alunos />} />
        <Route path="motoristas" element={<Motoristas />} />
        <Route path="rotas" element={<Rotas />} />
        <Route path="veiculos" element={<Veiculos />} />
        <Route path="historico" element={<Historico />} />
        <Route path="financeiro" element={<Financeiro />} />
        <Route path="rastreamento" element={<Rastreamento />} />
        <Route path="mensagens" element={<Mensagens />} />
        <Route path="perfil" element={<Perfil />} />
        <Route path="configuracoes" element={<Configuracoes />} />
      </Route>

      {/* Catch all - redirect to root */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/App.tsx
git commit -m "feat(web): add Perfil and Configuracoes routes, initialize theme"
```

---

## Task 16: Update Dashboard Page

**Files:**
- Modify: `apps/web/src/pages/Dashboard.tsx`

**Step 1: Update Dashboard with PageTransition and stagger animations**

```tsx
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
```

**Step 2: Commit**

```bash
git add apps/web/src/pages/Dashboard.tsx
git commit -m "feat(web): update Dashboard with premium styling and animations"
```

---

## Task 17: Update Remaining Pages with PageTransition

**Files:**
- Modify: `apps/web/src/pages/Alunos.tsx`
- Modify: `apps/web/src/pages/Escolas.tsx`
- Modify: `apps/web/src/pages/Motoristas.tsx`
- Modify: `apps/web/src/pages/Veiculos.tsx`
- Modify: `apps/web/src/pages/Rotas.tsx`
- Modify: `apps/web/src/pages/Rastreamento.tsx`
- Modify: `apps/web/src/pages/Historico.tsx`
- Modify: `apps/web/src/pages/Financeiro.tsx`
- Modify: `apps/web/src/pages/Mensagens.tsx`

**Step 1: For each page, wrap content with PageTransition and update styles**

Pattern to apply to each page:
1. Import `PageTransition` from `'../components/ui/PageTransition'`
2. Wrap the root `<div>` with `<PageTransition>`
3. Update color classes: `text-beige` -> `text-text`, `text-beige/40` -> `text-text-muted`, `bg-surface2` stays, `border-beige/10` -> `border-border/30`
4. Update button styles to use `accent` and `accent-hover`
5. Add `rounded-2xl` to cards and containers

Example for Alunos.tsx (apply similar pattern to all):

Add at top:
```tsx
import { PageTransition } from '../components/ui/PageTransition';
```

Wrap return:
```tsx
return (
  <PageTransition>
    <div>
      {/* existing content with updated classes */}
    </div>
  </PageTransition>
);
```

Update input class:
```tsx
const inputClass = "w-full h-12 px-4 bg-surface2 border border-border/50 rounded-xl text-text text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all duration-200";
```

**Step 2: Commit after updating all pages**

```bash
git add apps/web/src/pages/Alunos.tsx apps/web/src/pages/Escolas.tsx apps/web/src/pages/Motoristas.tsx apps/web/src/pages/Veiculos.tsx apps/web/src/pages/Rotas.tsx apps/web/src/pages/Rastreamento.tsx apps/web/src/pages/Historico.tsx apps/web/src/pages/Financeiro.tsx apps/web/src/pages/Mensagens.tsx
git commit -m "feat(web): update all pages with PageTransition and premium styling"
```

---

## Task 18: Delete Old JS Files

**Files:**
- Delete: All `.js` files in `apps/web/src/` that have `.tsx` equivalents

**Step 1: Remove duplicate JS files**

```bash
cd apps/web/src && find . -name "*.js" -type f -delete
```

**Step 2: Commit**

```bash
git add -A apps/web/src/
git commit -m "chore(web): remove duplicate JS files, keep only TSX"
```

---

## Task 19: Final Build Test

**Step 1: Run build to verify no errors**

```bash
cd apps/web && npm run build
```

Expected: Build completes without errors

**Step 2: Final commit**

```bash
git add -A
git commit -m "feat(web): complete premium design redesign"
```

---

## Summary

Total tasks: 19
Estimated time: 2-3 hours

Key deliverables:
- Floating container layout with margins
- Expandable sidebar with categories
- Dark/Light theme support with persistence
- Page transition animations
- Premium color palette (Warm Espresso / Cream Elegante)
- New Perfil and Configuracoes pages
- Updated all existing pages with consistent styling
