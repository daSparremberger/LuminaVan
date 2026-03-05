import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function PageHeader({ title, subtitle, action }) {
    return (_jsxs("div", { className: "flex items-start justify-between mb-8", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-beige", children: title }), subtitle && _jsx("p", { className: "text-beige/40 text-sm mt-2", children: subtitle })] }), action] }));
}
