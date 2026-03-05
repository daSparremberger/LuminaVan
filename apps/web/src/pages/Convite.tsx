import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ConviteInfo {
  tipo: 'gestor' | 'motorista';
  tenant: { id: number; nome: string; cidade?: string };
  email_restrito?: string;
  motorista?: { id: number; nome: string };
}

export function ConvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [convite, setConvite] = useState<ConviteInfo | null>(null);

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
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (token) {
      validateConvite();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-400">Validando convite...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="bg-zinc-900 p-8 rounded-lg max-w-md w-full text-center">
          <h1 className="text-xl font-bold text-red-500 mb-4">Convite Invalido</h1>
          <p className="text-zinc-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="bg-zinc-900 p-8 rounded-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-2">Convite Recebido</h1>
        <p className="text-zinc-400 mb-6">
          Voce foi convidado para ser{' '}
          <span className="text-blue-400 font-medium">
            {convite?.tipo === 'gestor' ? 'Gestor' : 'Motorista'}
          </span>{' '}
          em <span className="text-white font-medium">{convite?.tenant.nome}</span>
          {convite?.tenant.cidade && ` - ${convite.tenant.cidade}`}
        </p>
        {convite?.email_restrito && (
          <p className="text-zinc-500 text-sm mb-4">
            Este convite e restrito ao email: {convite.email_restrito}
          </p>
        )}
        <button
          onClick={() => navigate(`/login?convite=${token}`)}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded font-medium hover:bg-blue-700"
        >
          Aceitar Convite
        </button>
      </div>
    </div>
  );
}
