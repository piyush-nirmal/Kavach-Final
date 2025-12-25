import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ProviderDashboard from './ProviderDashboard';
import {
  Baby,
  Syringe,
  Calendar,
  Bell,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle2,
  Loader2,
  Sparkles
} from 'lucide-react';
import { mockNotifications, vaccinationSchedule } from '@/data/mockData';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';


export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect or Show Provider Dashboard
  if (user?.role === 'provider') {
    return <ProviderDashboard />;
  }

  // State for real data
  const [children, setChildren] = useState<any[]>([]);
  const [vaccinationRecords, setVaccinationRecords] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // 1. Fetch Children
        const childrenQ = query(collection(db, 'children'), where('parentId', '==', user.id));
        const childrenSnapshot = await getDocs(childrenQ);
        const childrenData = childrenSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setChildren(childrenData);

        const childIds = childrenData.map(c => c.id);
        const alerts: any[] = [];
        let appointmentsToday: any[] = [];

        // 2. Fetch Data if children exist
        if (childIds.length > 0) {
          // A. Fetch Appointments for ALL children (for notifications)
          // Limit to 10 for 'in' query
          const apptQ = query(collection(db, 'appointments'), where('childId', 'in', childIds.slice(0, 10)));
          const apptSnap = await getDocs(apptQ);

          apptSnap.forEach(doc => {
            const data = doc.data();
            const todayStr = new Date().toISOString().split('T')[0];

            // Check for today's appointments
            if (data.date === todayStr) {
              appointmentsToday.push({ ...data, id: doc.id });
            }

            // Add to alerts if future or today
            const endOfDay = new Date(data.date + 'T23:59:59');
            if (endOfDay >= new Date()) {
              alerts.push({
                id: doc.id,
                isRead: false
              });
            }
          });

          // B. Fetch Vaccination Records for ALL children (for notifications)
          const allRecordsQ = query(collection(db, 'vaccination_records'), where('childId', 'in', childIds.slice(0, 10)));
          const allRecordsSnap = await getDocs(allRecordsQ);
          const allRecords = allRecordsSnap.docs.map(doc => ({ ...doc.data() }));

          // Calculate Vaccine Alerts
          childrenData.forEach((child: any) => {
            const childRecords = allRecords.filter((r: any) => r.childId === child.id);
            const administered = new Set(childRecords.map((r: any) => r.vaccineName));
            const birthDate = new Date(child.dateOfBirth);
            const today = new Date();
            const ageInDays = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));

            vaccinationSchedule.forEach(vaccine => {
              if (administered.has(vaccine.vaccineName)) return;
              const daysUntilDue = vaccine.ageInDays - ageInDays;
              // Overdue or due within 30 days
              if (daysUntilDue <= 30) {
                alerts.push({ id: `${child.id}-${vaccine.id}`, isRead: false });
              }
            });
          });

          // C. Set Vaccination Records for the FIRST child (for Dashboard UI stats)
          if (childrenData.length > 0) {
            const firstChildId = childrenData[0].id;
            const childRecords = allRecords.filter((r: any) => r.childId === firstChildId);
            setVaccinationRecords(childRecords);
          }
        }

        setNotifications(alerts);

        // Notify for today's appointments
        if (appointmentsToday.length > 0) {
          appointmentsToday.forEach(appt => {
            toast({
              title: "Appointment Today!",
              description: `You have a visit with ${appt.doctorName} at ${appt.time}.`,
              duration: 5000,
            });
          });
        }

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, toast]);

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
    <div className="px-4 py-6 space-y-8">
      {/* Welcome Section */}
      <div className="animate-fade-in relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 to-indigo-600 p-8 text-white shadow-lg">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-yellow-300" />
            <span className="text-indigo-100 font-medium text-sm has-tooltip" title="Current Status">Health Overview</span>
          </div>
          <h1 className="text-3xl font-display font-bold mb-2">
            Hello, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-indigo-100 max-w-sm">
            Everything looks on track. Check your upcoming schedule below.
          </p>
        </div>
      </div>

      {/* Child Card */}
      {child ? (
        <Card className="p-5 animate-slide-up border-0 shadow-md bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 group">
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <Baby className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{child.name}</h3>
              <p className="text-sm text-slate-500 font-medium mt-1">
                {ageMonths} months, {ageDays} days old
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => navigate('/profile')} className="rounded-full hover:bg-blue-50">
              <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600" />
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-8 text-center animate-slide-up border-dashed border-2 bg-slate-50/50">
          <div className="h-16 w-16 rounded-full bg-white mx-auto mb-4 flex items-center justify-center shadow-sm">
            <Baby className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-2">No Child Registered</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
            Register your child profile to get personalized vaccination schedules and reminders.
          </p>
          <Button onClick={() => navigate('/register-child')} className="rounded-full px-6 shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Register Child
          </Button>
        </Card>
      )}

      {/* Next Vaccine Card */}
      {nextVaccine && (
        <Card className="p-5 border-l-4 border-l-orange-500 animate-slide-up shadow-md bg-white/90" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
              <Syringe className="h-6 w-6 text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-orange-500 uppercase tracking-wider mb-1">Up Next</p>
              <h3 className="font-bold text-slate-900 truncate">{nextVaccine.vaccineName}</h3>
              <div className="flex items-center gap-2 mt-2">
                <Clock className="h-4 w-4 text-slate-400" />
                <span className={`text-sm font-medium ${daysUntilNext !== null && daysUntilNext <= 7 ? 'text-orange-600' : 'text-slate-600'}`}>
                  {daysUntilNext === 0 ? 'Due today!' : `Due in ${daysUntilNext} days`}
                </span>
              </div>
            </div>
            {daysUntilNext !== null && daysUntilNext <= 7 && (
              <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-0">
                Action Needed
              </Badge>
            )}
          </div>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card
          className="p-5 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-slide-up border-0 shadow-md bg-gradient-to-br from-emerald-50 to-teal-50"
          style={{ animationDelay: '0.15s' }}
          onClick={() => navigate('/vaccinations')}
        >
          <div className="flex flex-col items-center text-center gap-3">
            <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-sm">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-3xl font-bold text-emerald-900">{vaccinationRecords.length}</p>
              <p className="text-xs font-medium text-emerald-600/80 uppercase tracking-wide mt-1">Vaccines Done</p>
            </div>
          </div>
        </Card>

        <Card
          className="p-5 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-slide-up border-0 shadow-md bg-gradient-to-br from-amber-50 to-orange-50"
          style={{ animationDelay: '0.2s' }}
          onClick={() => navigate('/notifications')}
        >
          <div className="flex flex-col items-center text-center gap-3">
            <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-sm relative">
              <Bell className="h-6 w-6 text-amber-500" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold border-2 border-white">
                  {unreadNotifications}
                </span>
              )}
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-900">{unreadNotifications}</p>
              <p className="text-xs font-medium text-amber-600/80 uppercase tracking-wide mt-1">Alerts</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Vaccination Schedule */}
      <div className="animate-slide-up" style={{ animationDelay: '0.25s' }}>
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-lg font-bold text-slate-900">Upcoming Schedule</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/vaccinations')} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
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
                <Card key={vaccine.id} className="p-4 border-slate-100 hover:border-blue-100 hover:shadow-sm transition-all duration-200">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${isPast ? 'bg-red-50' : 'bg-slate-50'
                      }`}>
                      <Calendar className={`h-5 w-5 ${isPast ? 'text-red-500' : 'text-slate-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-900 text-sm truncate">{vaccine.vaccineName}</h4>
                      <p className="text-xs text-slate-500 mt-1">Recommended age: {vaccine.recommendedAge}</p>
                    </div>
                    <Badge variant={isPast ? 'destructive' : 'secondary'} className={`shrink-0 ${!isPast ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : ''}`}>
                      {isPast ? 'Overdue' : dueDays === 0 ? 'Today' : `${dueDays} days`}
                    </Badge>
                  </div>
                </Card>
              );
            })}

          {vaccinationSchedule.filter(v => !administeredNames.has(v.vaccineName)).length === 0 && (
            <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-slate-500 text-sm">No upcoming vaccines scheduled</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
