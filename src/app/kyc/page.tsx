"use client";

import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Upload, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { doc, updateDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export default function KYCPage() {
  const { user, userData } = useAuth();
  const [step, setStep] = useState(userData?.kycStatus === 'pending' || userData?.kycStatus === 'verified' ? 3 : 1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleNext = () => setStep(s => s + 1);

  const handleSubmit = () => {
    if (!user) return;
    setLoading(true);
    
    const userRef = doc(db, 'users', user.uid);
    const updates = {
      kycStatus: 'pending',
      kycSubmittedAt: new Date().toISOString(),
      kycVerified: false,
      kycRejectionReason: null
    };

    updateDoc(userRef, updates)
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: userRef.path, operation: 'update', requestResourceData: updates }));
      });
    
    addDoc(collection(db, 'users', user.uid, 'notifications'), {
      title: "⏳ KYC Under Review",
      message: "Your documents have been submitted successfully. We will notify you once review is complete.",
      type: 'kyc_submitted',
      isRead: false,
      createdAt: serverTimestamp()
    });

    setStep(3);
    toast({
      title: "Documents Submitted",
      description: "Your KYC application is now being reviewed.",
    });
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Navigation />
      <main className="flex-1 p-8">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-headline font-bold mb-1 text-white">Verify Your Identity</h1>
          <p className="text-muted-foreground">KYC verification is required for all withdrawals.</p>
        </header>

        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-8 relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-secondary -z-10" />
            <StepIndicator currentStep={step} step={1} label="Identity" />
            <StepIndicator currentStep={step} step={2} label="Address" />
            <StepIndicator currentStep={step} step={3} label="Confirmation" />
          </div>

          <Card className="border-primary/20 bg-card/40 backdrop-blur-sm shadow-2xl">
            {step === 1 && (
              <>
                <CardHeader>
                  <CardTitle className="text-white text-xl">Step 1: Proof of Identity</CardTitle>
                  <CardDescription>Upload a valid government-issued ID.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-12 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center bg-background/30 hover:border-primary/50 transition-colors cursor-pointer group">
                    <Upload className="w-12 h-12 text-muted-foreground mb-4 group-hover:text-primary transition-colors" />
                    <p className="text-sm font-bold text-white">Click to upload or drag & drop</p>
                  </div>
                  <Button className="w-full font-bold h-12 rounded-xl bg-primary hover:bg-primary/90 cursor-pointer" onClick={handleNext}>Next Step</Button>
                </CardContent>
              </>
            )}

            {step === 2 && (
              <>
                <CardHeader>
                  <CardTitle className="text-white text-xl">Step 2: Proof of Address</CardTitle>
                  <CardDescription>A utility bill or bank statement (last 3 months).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-12 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center bg-background/30 hover:border-primary/50 transition-colors cursor-pointer group">
                    <Upload className="w-12 h-12 text-muted-foreground mb-4 group-hover:text-primary transition-colors" />
                    <p className="text-sm font-bold text-white">Upload proof of address</p>
                  </div>
                  <div className="flex gap-4">
                    <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold cursor-pointer" onClick={() => setStep(1)}>Back</Button>
                    <Button className="flex-1 font-bold h-12 rounded-xl bg-primary hover:bg-primary/90 cursor-pointer" onClick={handleSubmit} disabled={loading}>
                      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Submit for Review
                    </Button>
                  </div>
                </CardContent>
              </>
            )}

            {step === 3 && (
              <CardContent className="pt-12 pb-12 flex flex-col items-center text-center">
                {userData?.kycVerified ? (
                  <>
                    <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center mb-8 cyan-box-glow">
                      <CheckCircle2 className="w-12 h-12 text-accent" />
                    </div>
                    <h3 className="text-3xl font-headline font-bold mb-3 text-white">Identity Verified!</h3>
                    <p className="text-muted-foreground max-w-sm mb-10 leading-relaxed">
                      Your identity has been successfully verified. Payouts are now unlocked.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-8">
                      <Clock className="w-12 h-12 text-primary" />
                    </div>
                    <h3 className="text-3xl font-headline font-bold mb-3 text-white">Application Received</h3>
                    <p className="text-muted-foreground max-w-sm mb-10 leading-relaxed">
                      Verification typically takes 12-24 hours. We'll alert you once processed.
                    </p>
                  </>
                )}
                <Button className="w-full h-14 rounded-xl font-bold text-lg cursor-pointer" asChild>
                  <a href="/dashboard">Return to Dashboard</a>
                </Button>
              </CardContent>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}

function StepIndicator({ currentStep, step, label }: { currentStep: number, step: number, label: string }) {
  const isActive = currentStep === step;
  const isCompleted = currentStep > step;

  return (
    <div className="flex flex-col items-center gap-2 bg-background px-4">
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
        isActive ? "border-primary bg-primary text-primary-foreground shadow-[0_0_20px_rgba(17,179,245,0.4)]" : 
        isCompleted ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary text-muted-foreground"
      )}>
        {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <span className="font-bold">{step}</span>}
      </div>
      <span className={cn("text-[10px] uppercase font-black tracking-[0.2em]", isActive ? "text-primary" : "text-muted-foreground")}>
        {label}
      </span>
    </div>
  );
}