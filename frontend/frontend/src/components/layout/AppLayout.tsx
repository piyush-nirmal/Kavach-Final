import { Outlet } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { MobileNav } from './MobileNav';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="pb-20">
        <Outlet />
      </main>
      <MobileNav />
    </div>
  );
}
