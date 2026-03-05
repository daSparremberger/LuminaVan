import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuthStore } from '../stores/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);

  const conviteToken = searchParams.get('convite');

  async function handleGoogleLogin() {
    setLoading(true);
    setError(null);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      if (conviteToken) {
        const res = await fetch(`${API_URL}/auth/convite/${conviteToken}/aceitar`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${idToken}` }
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Erro ao aceitar convite');
        }
        const data = await res.json();
        setAuth(data.user, data.role, idToken);
        navigate('/');
        return;
      }

      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro no login');
      }
      const data = await res.json();
      setAuth(data.user, data.role, idToken);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Erro no login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="bg-zinc-900 p-8 rounded-lg shadow-xl max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">RotaVans</h1>
        {conviteToken && (
          <p className="text-zinc-400 text-center mb-4">
            Voce foi convidado para acessar o sistema. Faca login para continuar.
          </p>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4">{error}</div>
        )}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white text-black py-3 px-4 rounded font-medium hover:bg-zinc-100 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? 'Entrando...' : 'Entrar com Google'}
        </button>
      </div>
    </div>
  );
}
