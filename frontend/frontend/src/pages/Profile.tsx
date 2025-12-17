import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Baby,
  Phone,
  Mail,
  LogOut,
  ChevronRight,
  Edit,
  Shield,
  Bell,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { mockChildren } from '@/data/mockData';

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const child = mockChildren[0];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { icon: Baby, label: 'My Children', onClick: () => navigate('/register-child') },
    { icon: Bell, label: 'Notification Settings', onClick: () => {} },
    { icon: Shield, label: 'Privacy & Security', onClick: () => {} },
    { icon: FileText, label: 'Terms of Service', onClick: () => {} },
    { icon: HelpCircle, label: 'Help & Support', onClick: () => {} },
  ];

  // Calculate child's age
  const birthDate = new Date(child?.dateOfBirth || '');
  const today = new Date();
  const ageInDays = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
  const ageMonths = Math.floor(ageInDays / 30);

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Profile Card */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
              {user?.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-xl font-display font-bold text-foreground">
              {user?.name}
            </h2>
            <p className="text-sm text-muted-foreground capitalize">
              {user?.role === 'parent' ? 'Parent / Guardian' : 'Healthcare Provider'}
            </p>
          </div>
          <Button variant="ghost" size="icon">
            <Edit className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>

        <Separator className="my-4" />

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">{user?.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">{user?.phone || '+91 98765 43210'}</span>
          </div>
        </div>
      </Card>

      {/* Child Card */}
      {child && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-foreground">My Child</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/register-child')}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
              <Baby className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">{child.name}</h4>
              <p className="text-sm text-muted-foreground">
                {ageMonths} months old • {child.gender.charAt(0).toUpperCase() + child.gender.slice(1)}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Menu Items */}
      <Card className="divide-y divide-border">
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
            className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
          >
            <item.icon className="h-5 w-5 text-muted-foreground" />
            <span className="flex-1 text-left text-foreground">{item.label}</span>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        ))}
      </Card>

      {/* Logout Button */}
      <Button
        variant="outline"
        className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </Button>

      {/* App Version */}
      <p className="text-center text-xs text-muted-foreground">
        Kavach v1.0.0
      </p>
    </div>
  );
}
