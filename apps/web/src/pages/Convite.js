import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export function ConvitePage() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [convite, setConvite] = useState(null);
    useEffect(() => {
        async function validateConvite() {
            try {
                const res = await fetch(`${API_URL}/auth/convite/${token}`);
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || 'Convite invalido');
                }
                const data = await res.json();
                setConvite(data);
            }
            catch (err) {
                setError(err.message);
            }
            finally {
                setLoading(false);
            }
        }
        if (token) {
            validateConvite();
        }
    }, [token]);
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-zinc-950 flex items-center justify-center", children: _jsx("p", { className: "text-zinc-400", children: "Validando convite..." }) }));
    }
    if (error) {
        return (_jsx("div", { className: "min-h-screen bg-zinc-950 flex items-center justify-center", children: _jsxs("div", { className: "bg-zinc-900 p-8 rounded-lg max-w-md w-full text-center", children: [_jsx("h1", { className: "text-xl font-bold text-red-500 mb-4", children: "Convite Invalido" }), _jsx("p", { className: "text-zinc-400", children: error })] }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-zinc-950 flex items-center justify-center", children: _jsxs("div", { className: "bg-zinc-900 p-8 rounded-lg max-w-md w-full", children: [_jsx("h1", { className: "text-2xl font-bold text-white mb-2", children: "Convite Recebido" }), _jsxs("p", { className: "text-zinc-400 mb-6", children: ["Voce foi convidado para ser", ' ', _jsx("span", { className: "text-blue-400 font-medium", children: convite?.tipo === 'gestor' ? 'Gestor' : 'Motorista' }), ' ', "em ", _jsx("span", { className: "text-white font-medium", children: convite?.tenant.nome }), convite?.tenant.cidade && ` - ${convite.tenant.cidade}`] }), convite?.email_restrito && (_jsxs("p", { className: "text-zinc-500 text-sm mb-4", children: ["Este convite e restrito ao email: ", convite.email_restrito] })), _jsx("button", { onClick: () => navigate(`/login?convite=${token}`), className: "w-full bg-blue-600 text-white py-3 px-4 rounded font-medium hover:bg-blue-700", children: "Aceitar Convite" })] }) }));
}
