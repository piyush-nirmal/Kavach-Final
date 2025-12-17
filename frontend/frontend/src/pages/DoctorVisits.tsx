import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Stethoscope, Calendar, FileText, Upload, Plus, History as HistoryIcon, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DoctorVisit } from '@/types';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, onSnapshot, orderBy, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';

export default function DoctorVisits() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user } = useAuth();
    const [visits, setVisits] = useState<DoctorVisit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [doctorName, setDoctorName] = useState('');
    const [visitDate, setVisitDate] = useState('');
    const [reason, setReason] = useState('');
    const [notes, setNotes] = useState('');
    const [prescription, setPrescription] = useState<File | null>(null);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'doctorVisits'),
            where('userId', '==', user.id)
            // Note: Composite index required for userId + visitDate ordering. 
            // Sorting client-side for now to avoid blocking on index creation.
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedVisits = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as DoctorVisit[];

            // Sort by date descending
            fetchedVisits.sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());

            setVisits(fetchedVisits);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching visits:", error);
            toast({
                title: "Error",
                description: "Failed to load visit history.",
                variant: "destructive"
            });
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user, toast]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSubmitting(true);

        try {
            // Note: Real app should upload image to Firebase Storage here
            // For now, we'll just skip the image persistence or use a placeholder

            const visitData = {
                userId: user.id, // Scope to parent
                childId: '1',    // TODO: Link to actual selected child
                doctorName,
                visitDate,
                reason,
                notes,
                // prescriptionImages: [], // TODO: Add storage URL
                createdAt: serverTimestamp()
            };

            await addDoc(collection(db, 'doctorVisits'), visitData);

            toast({ title: 'Visit Logged', description: 'Doctor visit saved successfully.' });
            setIsFormOpen(false);
            resetForm();
        } catch (error) {
            console.error("Error saving visit:", error);
            toast({
                title: 'Error',
                description: 'Failed to save visit details.',
                variant: 'destructive'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setDoctorName('');
        setVisitDate('');
        setReason('');
        setNotes('');
        setPrescription(null);
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="gradient-hero px-6 pt-6 pb-16">
                <Button variant="ghost" size="icon" className="text-primary-foreground mb-4" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-display font-bold text-primary-foreground flex items-center gap-2">
                    <Stethoscope className="h-6 w-6" />
                    Doctor Visits
                </h1>
                <p className="text-primary-foreground/80 text-sm">Log checkups and view history</p>
            </div>

            <div className="px-6 -mt-8 space-y-6">
                {/* Add New Visit Card / Button */}
                {!isFormOpen ? (
                    <Card className="p-6 flex flex-col items-center justify-center gap-4 cursor-pointer hover:shadow-lg transition-all" onClick={() => setIsFormOpen(true)}>
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Plus className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="font-semibold text-lg text-primary">Log New Visit</h3>
                        <p className="text-sm text-muted-foreground">Add details of a recent doctor appointment</p>
                    </Card>
                ) : (
                    <Card className="p-6 animate-fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold">New Visit Details</h2>
                            <Button variant="ghost" size="icon" onClick={() => setIsFormOpen(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Doctor Name</Label>
                                <Input value={doctorName} onChange={e => setDoctorName(e.target.value)} placeholder="Dr. Name" required />
                            </div>
                            <div className="space-y-2">
                                <Label>Visit Date</Label>
                                <Input type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Reason</Label>
                                <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Fever, Checkup" required />
                            </div>
                            <div className="space-y-2">
                                <Label>Notes</Label>
                                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Diagnosis, advice..." />
                            </div>

                            {/* Prescription Upload UI */}
                            <div className="space-y-2">
                                <Label>Prescription Image</Label>
                                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors relative">
                                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => e.target.files && setPrescription(e.target.files[0])} accept="image/*" />
                                    {prescription ? (
                                        <div className="text-sm text-primary font-medium flex items-center justify-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            {prescription.name}
                                        </div>
                                    ) : (
                                        <div className="text-sm text-muted-foreground flex flex-col items-center gap-1">
                                            <Upload className="h-4 w-4" />
                                            <span>Upload Prescription</span>
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">Image upload coming soon</p>
                            </div>

                            <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Visit'
                                )}
                            </Button>
                        </form>
                    </Card>
                )}

                {/* History List */}
                <div>
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <HistoryIcon className="h-5 w-5 text-primary" />
                        Visit History
                    </h2>

                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {visits.length === 0 ? (
                                <Card className="p-6 text-center text-muted-foreground">
                                    No visits logged yet.
                                </Card>
                            ) : (
                                visits.map(visit => (
                                    <Card key={visit.id} className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <Stethoscope className="h-4 w-4 text-primary" />
                                                    <h3 className="font-semibold">{visit.doctorName}</h3>
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1">{visit.reason}</p>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full text-foreground/80">
                                                <Calendar className="h-3 w-3" />
                                                {visit.visitDate}
                                            </div>
                                        </div>
                                        {visit.notes && (
                                            <p className="text-sm text-foreground/80 mt-2 bg-muted/30 p-2 rounded-md">
                                                {visit.notes}
                                            </p>
                                        )}
                                        {visit.prescriptionImages && visit.prescriptionImages.length > 0 && (
                                            <div className="mt-3">
                                                <p className="text-xs font-medium text-muted-foreground mb-1">Prescription</p>
                                                <div className="h-16 w-16 rounded-md bg-muted border flex items-center justify-center overflow-hidden">
                                                    <img src={visit.prescriptionImages[0]} alt="Prescription" className="h-full w-full object-cover" />
                                                </div>
                                            </div>
                                        )}
                                    </Card>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
