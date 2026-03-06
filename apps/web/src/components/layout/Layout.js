import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
export function Layout() {
    const location = useLocation();
    return (_jsxs("div", { className: "app-container", children: [_jsx(Sidebar, {}), _jsxs("div", { className: "flex-1 flex flex-col overflow-hidden", children: [_jsx(Header, {}), _jsx("main", { className: "flex-1 overflow-y-auto p-6", children: _jsx(AnimatePresence, { mode: "wait", children: _jsx("div", { children: _jsx(Outlet, {}) }, location.pathname) }) })] })] }));
}
