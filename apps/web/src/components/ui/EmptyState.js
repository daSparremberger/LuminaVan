import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function EmptyState({ icon: Icon, message }) {
    return (_jsxs("div", { className: "flex flex-col items-center justify-center py-20 text-beige/40", children: [_jsx(Icon, { size: 40, className: "mb-3 opacity-30" }), _jsx("p", { className: "text-sm", children: message })] }));
}
