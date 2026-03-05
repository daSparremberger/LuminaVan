import { Outlet, NavLink } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth';

export function AdminLayout() {
  const { user, logout } = useAuthStore();
  return (
    <div className="min-h-screen bg-zinc-950 flex">
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-800">
          <h1 className="text-xl font-bold text-white">RotaVans Admin</h1>
          <p className="text-zinc-500 text-sm">{user?.email}</p>
        </div>
        <nav className="p-2 flex-1">
          <NavLink to="/admin" end className={({ isActive }) => `block px-4 py-2 rounded ${isActive ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:bg-zinc-800'}`}>Dashboard</NavLink>
          <NavLink to="/admin/tenants" className={({ isActive }) => `block px-4 py-2 rounded ${isActive ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:bg-zinc-800'}`}>Regioes</NavLink>
        </nav>
        <div className="p-4 border-t border-zinc-800">
          <button onClick={logout} className="text-zinc-400 hover:text-white">Sair</button>
        </div>
      </aside>
      <main className="flex-1 p-6"><Outlet /></main>
    </div>
  );
}
