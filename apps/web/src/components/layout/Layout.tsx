import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

export function Layout() {
  const location = useLocation();

  return (
    <div className="app-container">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <div key={location.pathname}>
              <Outlet />
            </div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
