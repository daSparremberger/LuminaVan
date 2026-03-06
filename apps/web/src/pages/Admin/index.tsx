import { Outlet, NavLink } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth';

export function AdminLayout() {
  const { user, logout } = useAuthStore();
  return (
    <div className="app-container gap-4 p-4">
      <aside className="flex w-64 flex-col rounded-[28px] border border-border bg-surface2">
        <div className="border-b border-border px-5 py-5">
          <h1 className="font-heading text-xl font-bold text-text">RotaVans Admin</h1>
          <p className="mt-1 text-sm text-text-muted">{user?.email}</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `block rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-surface text-text' : 'text-text-muted hover:bg-surface hover:text-text'
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/admin/tenants"
            className={({ isActive }) =>
              `block rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-surface text-text' : 'text-text-muted hover:bg-surface hover:text-text'
              }`
            }
          >
            Regioes
          </NavLink>
        </nav>
        <div className="border-t border-border p-4">
          <button onClick={logout} className="ui-btn-secondary w-full">
            Sair
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 rounded-[28px] border border-border bg-surface p-6 shadow-[0_24px_48px_rgba(16,18,20,0.08)]">
        <Outlet />
      </main>
    </div>
  );
}





