import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState, useRef } from 'react';
import { MessageCircle, Send, User } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { api } from '../lib/api';
import { useAuth } from '../stores/auth';
import { clsx } from 'clsx';
export function Mensagens() {
    const { profile } = useAuth();
    const [conversas, setConversas] = useState([]);
    const [motoristas, setMotoristas] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    useEffect(() => {
        loadConversas();
        loadMotoristas();
    }, []);
    useEffect(() => {
        if (selectedConversation) {
            loadMessages(selectedConversation);
        }
    }, [selectedConversation]);
    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    async function loadConversas() {
        try {
            const data = await api.get('/mensagens/conversas');
            setConversas(data);
        }
        catch (err) {
            console.error('Erro ao carregar conversas:', err);
        }
        finally {
            setLoading(false);
        }
    }
    async function loadMotoristas() {
        try {
            const data = await api.get('/motoristas');
            setMotoristas(data.filter(m => m.cadastro_completo && m.ativo));
        }
        catch (err) {
            console.error('Erro ao carregar motoristas:', err);
        }
    }
    async function loadMessages(conversa) {
        try {
            const data = await api.get(`/mensagens/conversa/${conversa.participante_tipo}/${conversa.participante_id}`);
            setMessages(data);
        }
        catch (err) {
            console.error('Erro ao carregar mensagens:', err);
        }
    }
    function scrollToBottom() {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    async function sendMessage() {
        if (!newMessage.trim() || !selectedConversation || sending)
            return;
        setSending(true);
        try {
            const mensagem = await api.post('/mensagens', {
                destinatario_id: selectedConversation.participante_id,
                destinatario_tipo: selectedConversation.participante_tipo,
                conteudo: newMessage.trim(),
            });
            setMessages([...messages, mensagem]);
            setNewMessage('');
            // Update conversation list
            loadConversas();
        }
        catch (err) {
            console.error('Erro ao enviar mensagem:', err);
        }
        finally {
            setSending(false);
        }
    }
    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }
    function startConversation(motorista) {
        const existing = conversas.find(c => c.participante_id === motorista.id && c.participante_tipo === 'motorista');
        if (existing) {
            setSelectedConversation(existing);
        }
        else {
            setSelectedConversation({
                participante_id: motorista.id,
                participante_tipo: 'motorista',
                participante_nome: motorista.nome,
                nao_lidas: 0,
            });
            setMessages([]);
        }
    }
    // Motoristas without active conversations
    const motoristasWithoutConvo = motoristas.filter(m => !conversas.some(c => c.participante_id === m.id && c.participante_tipo === 'motorista'));
    function formatTime(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        if (isToday) {
            return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
    return (_jsxs("div", { className: "h-[calc(100vh-2rem)]", children: [_jsx(PageHeader, { title: "Mensagens", subtitle: "Comunicacao com motoristas" }), _jsxs("div", { className: "flex gap-6 h-[calc(100%-5rem)]", children: [_jsxs("div", { className: "w-80 border border-beige/10 rounded-xl flex flex-col overflow-hidden", children: [_jsx("div", { className: "p-4 border-b border-beige/10", children: _jsx("h2", { className: "text-sm font-semibold text-beige", children: "Conversas" }) }), _jsx("div", { className: "flex-1 overflow-y-auto", children: loading ? (_jsx("div", { className: "p-4 text-center text-beige/30 text-sm", children: "Carregando..." })) : conversas.length === 0 && motoristasWithoutConvo.length === 0 ? (_jsx("div", { className: "p-4 text-center text-beige/30 text-sm", children: "Nenhuma conversa ou motorista disponivel" })) : (_jsxs(_Fragment, { children: [conversas.map((conversa) => (_jsxs("button", { onClick: () => setSelectedConversation(conversa), className: clsx('w-full p-4 flex items-start gap-3 hover:bg-beige/5/50 transition-colors text-left border-b border-beige/10', selectedConversation?.participante_id === conversa.participante_id &&
                                                selectedConversation?.participante_tipo === conversa.participante_tipo &&
                                                'bg-beige/5'), children: [_jsx("div", { className: "w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0", children: _jsx(User, { size: 18, className: "text-accent" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("span", { className: "text-beige text-sm font-medium truncate", children: conversa.participante_nome }), conversa.nao_lidas > 0 && (_jsx("span", { className: "bg-accent text-beige text-xs px-2 py-0.5 rounded-full shrink-0", children: conversa.nao_lidas }))] }), conversa.ultima_mensagem && (_jsx("p", { className: "text-beige/30 text-xs mt-1 truncate", children: conversa.ultima_mensagem })), conversa.ultima_mensagem_data && (_jsx("p", { className: "text-gray-600 text-xs mt-0.5", children: formatTime(conversa.ultima_mensagem_data) }))] })] }, `${conversa.participante_tipo}-${conversa.participante_id}`))), motoristasWithoutConvo.length > 0 && (_jsxs(_Fragment, { children: [_jsx("div", { className: "px-4 py-2 bg-beige/5/30 text-xs text-beige/30 font-medium", children: "Iniciar nova conversa" }), motoristasWithoutConvo.map((motorista) => (_jsxs("button", { onClick: () => startConversation(motorista), className: "w-full p-4 flex items-center gap-3 hover:bg-beige/5/50 transition-colors text-left border-b border-beige/10", children: [_jsx("div", { className: "w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center shrink-0", children: _jsx(User, { size: 18, className: "text-beige/40" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("span", { className: "text-gray-300 text-sm truncate", children: motorista.nome }), _jsx("p", { className: "text-gray-600 text-xs mt-0.5", children: "Clique para iniciar" })] })] }, `new-${motorista.id}`)))] }))] })) })] }), _jsx("div", { className: "flex-1 border border-beige/10 rounded-xl flex flex-col overflow-hidden", children: selectedConversation ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "p-4 border-b border-beige/10 flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center", children: _jsx(User, { size: 18, className: "text-accent" }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-beige font-medium", children: selectedConversation.participante_nome }), _jsx("p", { className: "text-beige/30 text-xs capitalize", children: selectedConversation.participante_tipo })] })] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-4 space-y-4", children: [messages.length === 0 ? (_jsx("div", { className: "h-full flex items-center justify-center", children: _jsx("p", { className: "text-beige/30 text-sm", children: "Nenhuma mensagem ainda" }) })) : (messages.map((msg) => {
                                            const isFromMe = msg.remetente_tipo === 'gestor' && msg.remetente_id === profile?.id;
                                            return (_jsx("div", { className: clsx('flex', isFromMe ? 'justify-end' : 'justify-start'), children: _jsxs("div", { className: clsx('max-w-[70%] px-4 py-2 rounded-2xl', isFromMe
                                                        ? 'bg-accent text-beige rounded-br-sm'
                                                        : 'bg-beige/5 text-gray-200 rounded-bl-sm'), children: [_jsx("p", { className: "text-sm whitespace-pre-wrap break-words", children: msg.conteudo }), _jsx("p", { className: clsx('text-xs mt-1', isFromMe ? 'text-beige/60' : 'text-beige/30'), children: formatTime(msg.criado_em) })] }) }, msg.id));
                                        })), _jsx("div", { ref: messagesEndRef })] }), _jsx("div", { className: "p-4 border-t border-beige/10", children: _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "text", value: newMessage, onChange: (e) => setNewMessage(e.target.value), onKeyDown: handleKeyDown, placeholder: "Digite sua mensagem...", className: "flex-1 bg-beige/5 border border-beige/10 rounded-xl px-4 py-3 text-beige text-sm focus:outline-none focus:border-accent placeholder-gray-500" }), _jsx("button", { onClick: sendMessage, disabled: !newMessage.trim() || sending, className: clsx('px-4 py-3 rounded-xl transition-colors', newMessage.trim() && !sending
                                                    ? 'bg-accent hover:bg-accent/90 text-beige'
                                                    : 'bg-beige/5 text-beige/30 cursor-not-allowed'), children: _jsx(Send, { size: 18 }) })] }) })] })) : (_jsx(EmptyState, { icon: MessageCircle, message: "Selecione uma conversa para comecar" })) })] })] }));
}
