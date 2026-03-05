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
import { AdminLayout } from './pages/Admin';
import { AdminDashboard } from './pages/Admin/Dashboard';
import { TenantsPage } from './pages/Admin/Tenants';
import { TenantFormPage } from './pages/Admin/TenantForm';

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
        </Route>

        {/* Catch all - redirect to root */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
  );
}
