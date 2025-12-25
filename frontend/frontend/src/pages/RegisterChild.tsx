import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, ArrowRight, Baby, User, FileText, Check, Upload, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, collection, addDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';

type Step = 1 | 2 | 3;

export default function RegisterChild() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const childId = searchParams.get('childId');
  const isEditing = !!childId;

  const [step, setStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);

  // Child data
  const [childName, setChildName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');

  // Parent data
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');

  // Document
  const [birthCertificate, setBirthCertificate] = useState<File | null>(null);

  // Fetch existing data if editing
  useEffect(() => {
    const fetchChildData = async () => {
      if (!childId || !user) return;
      setIsLoading(true);
      try {
        const docRef = doc(db, 'children', childId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setChildName(data.name || '');
          setDateOfBirth(data.dateOfBirth || '');
          setGender(data.gender || 'male');

          // Ideally parent info should also be fetched/pre-filled if available in child doc or user doc
          // For now, pre-fill with user data if available
          setParentName(user.name || '');
          setParentPhone(user.phone || '');
          setParentEmail(user.email || '');
        } else {
          toast({
            title: "Error",
            description: "Child record not found.",
            variant: "destructive"
          });
          navigate('/dashboard');
        }
      } catch (error) {
        console.error("Error fetching child data:", error);
        toast({
          title: "Error",
          description: "Failed to load child data.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isEditing) {
      fetchChildData();
    } else if (user) {
      // Pre-fill parent info from logged in user for new registrations too
      setParentName(user.name || '');
      setParentPhone(user.phone || '');
      setParentEmail(user.email || '');
    }
  }, [childId, user, toast, navigate, isEditing]);


  const steps = [
    { number: 1, title: 'Child Info', icon: Baby },
    { number: 2, title: 'Parent Info', icon: User },
    { number: 3, title: 'Documents', icon: FileText },
  ];

  const handleNext = () => {
    if (step < 3) setStep((step + 1) as Step);
  };

  const handleBack = () => {
    if (step > 1) setStep((step - 1) as Step);
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const childData = {
        name: childName,
        dateOfBirth: dateOfBirth,
        gender: gender,
        parentId: user.id,
        // Only update createdAt if new? No, usually keep original.
        // UpdatedAt could be added.
        ...(isEditing ? { updatedAt: new Date().toISOString() } : { createdAt: new Date().toISOString() }),
        ...(isEditing ? { updatedAt: new Date().toISOString() } : { createdAt: new Date().toISOString() }),
      };

      if (birthCertificate) {
        try {
          const storageRef = ref(storage, `birth_certificates/${user.id}/${Date.now()}_${birthCertificate.name}`);
          const snapshot = await uploadBytes(storageRef, birthCertificate);
          const url = await getDownloadURL(snapshot.ref);
          // @ts-ignore
          childData.birthCertificateUrl = url;
        } catch (uploadError) {
          console.error("Error uploading file:", uploadError);
          toast({
            title: "Upload Failed",
            description: "Failed to upload birth certificate, but continuing with registration.",
            variant: "destructive"
          });
        }
      }

      if (isEditing && childId) {
        await updateDoc(doc(db, 'children', childId), childData);
        toast({
          title: 'Child Updated!',
          description: `${childName}'s information has been updated.`,
        });
      } else {
        await addDoc(collection(db, 'children'), childData);
        toast({
          title: 'Child Registered!',
          description: `${childName} has been successfully registered.`,
        });
      }

      navigate('/dashboard');
    } catch (error) {
      console.error("Error saving document: ", error);
      toast({
        title: 'Error',
        description: `Failed to ${isEditing ? 'update' : 'register'} child. Please try again.`,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBirthCertificate(e.target.files[0]);
    }
  };

  if (isLoading && isEditing && step === 1 && !childName) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-hero px-6 pt-6 pb-16">
        <Button
          variant="ghost"
          size="icon"
          className="text-primary-foreground mb-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-display font-bold text-primary-foreground">
          {isEditing ? 'Edit Child' : 'Register Child'}
        </h1>
        <p className="text-primary-foreground/80 text-sm">
          {isEditing ? 'Update your child\'s information' : 'Add your newborn\'s information'}
        </p>
      </div>

      {/* Progress Steps */}
      <div className="px-6 -mt-8 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            {steps.map((s, index) => (
              <div key={s.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${step >= s.number
                      ? 'gradient-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                      }`}
                  >
                    {step > s.number ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <s.icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className={`text-xs mt-1 ${step >= s.number ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                    {s.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 w-12 mx-2 ${step > s.number ? 'bg-primary' : 'bg-muted'
                      }`}
                  />
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Form Content */}
      <div className="px-6 pb-8">
        <Card className="p-6 animate-fade-in">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-display font-bold text-foreground mb-4">
                Child Information
              </h2>

              <div className="space-y-2">
                <Label htmlFor="childName">Child's Full Name</Label>
                <Input
                  id="childName"
                  placeholder="Enter child's name"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Gender</Label>
                <RadioGroup
                  value={gender}
                  onValueChange={(value) => setGender(value as 'male' | 'female' | 'other')}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male" className="font-normal cursor-pointer">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female" className="font-normal cursor-pointer">Female</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="other" />
                    <Label htmlFor="other" className="font-normal cursor-pointer">Other</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-display font-bold text-foreground mb-4">
                Parent/Guardian Information
              </h2>

              <div className="space-y-2">
                <Label htmlFor="parentName">Parent's Full Name</Label>
                <Input
                  id="parentName"
                  placeholder="Enter your name"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentPhone">Contact Number</Label>
                <Input
                  id="parentPhone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentEmail">Email Address</Label>
                <Input
                  id="parentEmail"
                  type="email"
                  placeholder="parent@email.com"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-display font-bold text-foreground mb-4">
                Birth Certificate (Optional)
              </h2>

              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
                {birthCertificate ? (
                  <div className="space-y-2">
                    <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                      <Check className="h-6 w-6 text-success" />
                    </div>
                    <p className="font-medium text-foreground">{birthCertificate.name}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setBirthCertificate(null)}
                      className="text-destructive"
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Upload birth certificate (PDF, JPG, PNG)
                    </p>
                    <label htmlFor="file-upload">
                      <Button variant="outline" className="cursor-pointer" asChild>
                        <span>Choose File</span>
                      </Button>
                    </label>
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                    />
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground text-center">
                You can skip this step and upload later
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <Button variant="outline" onClick={handleBack} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button
                onClick={handleNext}
                className="flex-1 gradient-primary text-primary-foreground"
                disabled={
                  (step === 1 && (!childName || !dateOfBirth)) ||
                  (step === 2 && (!parentName || !parentPhone || !parentEmail))
                }
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                className="flex-1 gradient-primary text-primary-foreground"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isEditing ? 'Updating...' : 'Registering...'}
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    {isEditing ? 'Update Child' : 'Complete Registration'}
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
