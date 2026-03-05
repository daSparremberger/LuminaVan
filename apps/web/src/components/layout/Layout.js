import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
export function Layout() {
    return (_jsxs("div", { className: "flex h-screen overflow-hidden bg-bg", children: [_jsx(Sidebar, {}), _jsx("main", { className: "flex-1 overflow-y-auto p-6", children: _jsx(Outlet, {}) })] }));
}
