import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Shield, Users, Stethoscope } from 'lucide-react';

export default function UserTypeSelect() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <div className="gradient-hero px-6 pt-12 pb-16 text-center">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-2xl bg-primary-foreground/20 flex items-center justify-center animate-scale-in">
            <Shield className="h-10 w-10 text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-3xl font-display font-bold text-primary-foreground mb-2 animate-fade-in">
          Kavach
        </h1>
        <p className="text-primary-foreground/80 text-sm animate-fade-in">
          Protecting Your Child's Health Journey
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 -mt-8">
        <div className="bg-card rounded-2xl shadow-lg p-6 animate-slide-up">
          <h2 className="text-xl font-display font-bold text-foreground text-center mb-2">
            Welcome!
          </h2>
          <p className="text-muted-foreground text-center text-sm mb-6">
            Please select your role to continue
          </p>

          <div className="space-y-4">
            <Card
              className="p-4 cursor-pointer border-2 border-transparent hover:border-primary transition-all duration-200 hover:shadow-md"
              onClick={() => navigate('/login?role=parent')}
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Parent / Guardian</h3>
                  <p className="text-sm text-muted-foreground">
                    Track your child's vaccinations
                  </p>
                </div>
              </div>
            </Card>

            <Card
              className="p-4 cursor-pointer border-2 border-transparent hover:border-primary transition-all duration-200 hover:shadow-md"
              onClick={() => navigate('/login?role=provider')}
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Stethoscope className="h-6 w-6 text-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Healthcare Provider</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage patient records
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Button
              variant="link"
              className="p-0 h-auto text-primary"
              onClick={() => navigate('/signup')}
            >
              Sign up
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}
