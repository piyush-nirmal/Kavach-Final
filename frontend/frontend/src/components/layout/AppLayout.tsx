import { Outlet } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { MobileNav } from './MobileNav';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Subtle decorative elements for the main app */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-20%] w-[600px] h-[600px] bg-blue-100/20 rounded-full blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-20%] w-[500px] h-[500px] bg-teal-100/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <AppHeader />
        <main className="pb-24 pt-4 container max-w-md mx-auto md:max-w-2xl lg:max-w-4xl">
          <Outlet />
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
