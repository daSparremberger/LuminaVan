import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './stores/auth';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
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

function Guard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-gray-400">Carregando...</div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Guard><Layout /></Guard>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
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
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
