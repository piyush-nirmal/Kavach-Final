import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, User, Phone, Baby, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Child, User as UserType } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export default function ProviderDashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<{ parent: UserType; children: Child[] } | null>(null);
    const [error, setError] = useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        setError('');
        setSearchResults(null);

        try {
            // 1. Determine search type
            const usersRef = collection(db, 'users');
            let q;

            if (searchQuery.includes('@')) {
                // Search by Email
                q = query(usersRef, where('email', '==', searchQuery));
            } else {
                // Search by Phone - Try to be smart about formatting
                // Create variations: exact match, and stripped of spaces/special chars
                const stripped = searchQuery.replace(/\D/g, '');
                const variations = [
                    searchQuery,
                    stripped,
                    `+${stripped}`,
                    `+91${stripped}`, // Assuming India context as common default
                    `${stripped.slice(-10)}` // Last 10 digits
                ];
                // Remove duplicates
                const uniqueVariations = Array.from(new Set(variations)).filter(v => v.length > 5); // Filter out too short

                if (uniqueVariations.length === 0) {
                    setError('Please enter a valid phone number or email.');
                    setIsSearching(false);
                    return;
                }

                q = query(usersRef, where('phone', 'in', uniqueVariations.slice(0, 10))); // Limit to 10 for Firestore
            }

            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setError('No parent found. Please check the email/phone exactly matching their registration.');
                setIsSearching(false);
                return;
            }

            // Assuming phone number is unique and we get one parent
            const parentDoc = querySnapshot.docs[0];
            const parentData = { id: parentDoc.id, ...(parentDoc.data() as UserType) };

            // 2. Fetch Children for this Parent
            const childrenRef = collection(db, 'children');
            const childrenQ = query(childrenRef, where('parentId', '==', parentData.id));
            const childrenSnapshot = await getDocs(childrenQ);

            const childrenData = childrenSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Child[];

            setSearchResults({
                parent: parentData,
                children: childrenData
            });

        } catch (err) {
            console.error("Search error:", err);
            setError('An error occurred while searching. Make sure the phone number matches exactly.');
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="gradient-hero px-6 pt-8 pb-16">
                <h1 className="text-2xl font-display font-bold text-primary-foreground">
                    Doctor Portal
                </h1>
                <p className="text-primary-foreground/80 text-sm">
                    Find patient records by parent's phone
                </p>
            </div>

            <div className="px-6 -mt-8 space-y-6">
                {/* Search Card */}
                <Card className="p-6 animate-slide-up">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Parent's Phone or Email</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Enter phone number or email address"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Button
                            type="submit"
                            className="w-full gradient-primary text-primary-foreground"
                            disabled={isSearching}
                        >
                            {isSearching ? 'Searching...' : 'Search Records'}
                            {!isSearching && <Search className="ml-2 h-4 w-4" />}
                        </Button>
                    </form>
                </Card>

                {/* Error Message */}
                {error && (
                    <div className="bg-destructive/10 text-destructive p-4 rounded-xl flex items-center gap-2 text-sm animate-fade-in">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                    </div>
                )}

                {/* Results */}
                {searchResults && (
                    <div className="animate-fade-in space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-bold text-lg">Search Results</h2>
                            <Badge variant="outline">{searchResults.children.length} Children Found</Badge>
                        </div>

                        {/* Parent Info */}
                        <Card className="p-4 bg-muted/50">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">{searchResults.parent.name}</h3>
                                    <p className="text-sm text-muted-foreground">{searchResults.parent.email}</p>
                                </div>
                            </div>
                        </Card>

                        {/* Children List */}
                        <div className="grid gap-4">
                            {searchResults.children.map((child) => (
                                <Card key={child.id} className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
                                            <Baby className="h-6 w-6 text-accent" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">{child.name}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Born: {new Date(child.dateOfBirth).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="secondary" onClick={() => navigate(`/vaccinations?childId=${child.id}`)}>
                                            View Vaccines
                                        </Button>
                                        <Button size="sm" onClick={() => navigate(`/doctor-visits?childId=${child.id}`)}>
                                            Clinical Notes
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {searchResults.children.length === 0 && (
                            <div className="text-center p-8 bg-muted/20 rounded-xl">
                                <p className="text-muted-foreground">No children registered for this parent.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
