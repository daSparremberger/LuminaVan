import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

export function Layout() {
  const location = useLocation();

  return (
    <div className="app-container gap-3 p-3 md:gap-4 md:p-4">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden rounded-[28px] border border-border bg-surface shadow-[0_30px_60px_rgba(16,18,20,0.07)]">
          <Header />
          <main className="flex-1 overflow-y-auto px-4 pb-4 md:px-6 md:pb-6">
            <AnimatePresence mode="wait">
              <div key={location.pathname}>
                <Outlet />
              </div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}


