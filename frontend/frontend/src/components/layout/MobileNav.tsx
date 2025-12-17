import { NavLink, useLocation } from 'react-router-dom';
import { Home, Syringe, Bell, MapPin, User, Stethoscope } from 'lucide-react';

import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/vaccinations', icon: Syringe, label: 'Vaccines' },
  { to: '/notifications', icon: Bell, label: 'Alerts' },
  { to: '/centers', icon: MapPin, label: 'Centers' },
  { to: '/doctor-visits', icon: Stethoscope, label: 'Visits' },
  { to: '/profile', icon: User, label: 'Profile' },

];

export function MobileNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
