import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Baby,
  Syringe,
  Calendar,
  Bell,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { mockNotifications, vaccinationSchedule } from '@/data/mockData';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';


export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State for real data
  const [children, setChildren] = useState<any[]>([]);
  const [vaccinationRecords, setVaccinationRecords] = useState<any[]>([]);
  // Use mock notifications for now, or fetch if you have a collection
  const [notifications] = useState(mockNotifications);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // 1. Fetch Children
        const childrenQ = query(collection(db, 'children'), where('parentId', '==', user.id));
        const childrenSnapshot = await getDocs(childrenQ);
        const childrenData = childrenSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setChildren(childrenData);

        // 2. Fetch Vaccination Records (if any children exist)
        if (childrenData.length > 0) {
          // For simplicity in Dashboard, just fetch records for the FIRST child
          // In a real app, you might aggregate all or let user switch children
          const firstChildId = childrenData[0].id;
          const recordsQ = query(collection(db, 'vaccination_records'), where('childId', '==', firstChildId));
          const recordsSnapshot = await getDocs(recordsQ);
          const recordsData = recordsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setVaccinationRecords(recordsData);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Use the first child found, or null
  const child = children.length > 0 ? children[0] : null;

  // Calculate days until next vaccine based on REAL records
  const administeredNames = new Set(vaccinationRecords.map((v: any) => v.vaccineName));
  const birthDate = child ? new Date(child.dateOfBirth) : new Date();
  const today = new Date();
  const ageInDays = child ? Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

  const nextVaccine = vaccinationSchedule.find(
    (v) => !administeredNames.has(v.vaccineName) && v.ageInDays >= ageInDays
  );

  const daysUntilNext = nextVaccine
    ? Math.max(0, nextVaccine.ageInDays - ageInDays)
    : null;

  const unreadNotifications = notifications.filter(n => !n.isRead).length;

  // Calculate child's age
  const ageMonths = Math.floor(ageInDays / 30);
  const ageDays = ageInDays % 30;

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }


  return (
    <div className="px-4 py-6 space-y-6">
      {/* Welcome Section */}
      <div className="animate-fade-in">
        <h1 className="text-2xl font-display font-bold text-foreground">
          Hello, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-muted-foreground">
          Here's your child's health overview
        </p>
      </div>

      {/* Child Card */}
      {child ? (
        <Card className="p-4 animate-slide-up">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Baby className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{child.name}</h3>
              <p className="text-sm text-muted-foreground">
                {ageMonths} months, {ageDays} days old
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-6 text-center animate-slide-up">
          <Baby className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold text-foreground mb-2">No Child Registered</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Register your child to start tracking vaccinations
          </p>
          <Button onClick={() => navigate('/register-child')} className="gradient-primary text-primary-foreground">
            <Plus className="h-4 w-4 mr-2" />
            Register Child
          </Button>
        </Card>
      )}

      {/* Next Vaccine Card */}
      {nextVaccine && (
        <Card className="p-4 border-l-4 border-l-primary animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Syringe className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Next Vaccine</p>
              <h3 className="font-semibold text-foreground">{nextVaccine.vaccineName}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium text-accent">
                  {daysUntilNext === 0 ? 'Due today!' : `Due in ${daysUntilNext} days`}
                </span>
              </div>
            </div>
            {daysUntilNext !== null && daysUntilNext <= 7 && (
              <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                Soon
              </Badge>
            )}
          </div>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow animate-slide-up"
          style={{ animationDelay: '0.15s' }}
          onClick={() => navigate('/vaccinations')}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{vaccinationRecords.length}</p>
              <p className="text-xs text-muted-foreground">Vaccines Done</p>
            </div>
          </div>
        </Card>

        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow animate-slide-up"
          style={{ animationDelay: '0.2s' }}
          onClick={() => navigate('/notifications')}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center relative">
              <Bell className="h-5 w-5 text-warning" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium">
                  {unreadNotifications}
                </span>
              )}
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{unreadNotifications}</p>
              <p className="text-xs text-muted-foreground">Pending Alerts</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Vaccination Schedule */}
      <div className="animate-slide-up" style={{ animationDelay: '0.25s' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-foreground">Upcoming Schedule</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/vaccinations')}>
            View All
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        <div className="space-y-3">
          {vaccinationSchedule
            .filter(v => !administeredNames.has(v.vaccineName))
            .slice(0, 3)
            .map((vaccine, index) => {
              const dueDays = vaccine.ageInDays - ageInDays;
              const isPast = dueDays < 0;
              return (
                <Card key={vaccine.id} className="p-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${isPast ? 'bg-destructive/10' : 'bg-muted'
                      }`}>
                      <Calendar className={`h-5 w-5 ${isPast ? 'text-destructive' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground text-sm">{vaccine.vaccineName}</h4>
                      <p className="text-xs text-muted-foreground">{vaccine.recommendedAge}</p>
                    </div>
                    <Badge variant={isPast ? 'destructive' : 'secondary'} className="text-xs">
                      {isPast ? 'Overdue' : dueDays === 0 ? 'Today' : `${dueDays}d`}
                    </Badge>
                  </div>
                </Card>
              );
            })}
        </div>
      </div>
    </div>
  );
}
