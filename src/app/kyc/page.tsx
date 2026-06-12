"use client";

import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function KYCPage() {
  const [step, setStep] = useState(1);
  const { toast } = useToast();

  const handleNext = () => setStep(s => s + 1);

  return (
    <div className="flex min-h-screen bg-background">
      <Navigation />
      <main className="flex-1 p-8">
        <header className="mb-10">
          <h1 className="text-3xl font-headline font-bold mb-1">Verify Your Identity</h1>
          <p className="text-muted-foreground">KYC verification is required for all withdrawals and funded accounts.</p>
        </header>

        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-8 relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-secondary -z-10" />
            <StepIndicator currentStep={step} step={1} label="Identity" />
            <StepIndicator currentStep={step} step={2} label="Address" />
            <StepIndicator currentStep={step} step={3} label="Confirmation" />
          </div>

          <Card className="border-primary/20 bg-primary/5">
            {step === 1 && (
              <>
                <CardHeader>
                  <CardTitle>Step 1: Proof of Identity</CardTitle>
                  <CardDescription>Upload a valid government-issued ID (Passport, ID Card, or Driver's License).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4">
                    <div className="p-8 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center bg-background/50 hover:border-primary/50 transition-colors cursor-pointer">
                      <Upload className="w-10 h-10 text-muted-foreground mb-4" />
                      <p className="text-sm font-medium">Click to upload or drag & drop</p>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG or PDF up to 10MB</p>
                    </div>
                  </div>
                  <Button className="w-full font-bold" onClick={handleNext}>Next Step</Button>
                </CardContent>
              </>
            )}

            {step === 2 && (
              <>
                <CardHeader>
                  <CardTitle>Step 2: Proof of Address</CardTitle>
                  <CardDescription>A utility bill or bank statement issued in the last 3 months.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4">
                    <div className="p-8 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center bg-background/50 hover:border-primary/50 transition-colors cursor-pointer">
                      <Upload className="w-10 h-10 text-muted-foreground mb-4" />
                      <p className="text-sm font-medium">Upload document</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                    <Button className="flex-1 font-bold" onClick={handleNext}>Submit for Review</Button>
                  </div>
                </CardContent>
              </>
            )}

            {step === 3 && (
              <CardContent className="pt-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                  <Clock className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-headline font-bold mb-2">Documents Submitted</h3>
                <p className="text-muted-foreground max-w-sm mb-8 leading-relaxed">
                  Our compliance team is currently reviewing your documents. Verification typically takes 12-24 hours.
                </p>
                <Button className="w-full" asChild>
                  <a href="/dashboard">Return to Dashboard</a>
                </Button>
              </CardContent>
            )}
          </Card>

          <div className="mt-8 flex items-start gap-3 p-4 bg-secondary/50 rounded-lg border border-border">
            <ShieldCheck className="text-primary w-5 h-5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your documents are encrypted and stored securely. We use bank-level security to protect your sensitive personal information.
            </p>
          </div>
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
        "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all",
        isActive ? "border-primary bg-primary text-primary-foreground shadow-[0_0_15px_rgba(245,158,11,0.5)]" : 
        isCompleted ? "border-primary bg-primary text-primary-foreground" : "border-border bg-secondary text-muted-foreground"
      )}>
        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : step}
      </div>
      <span className={cn("text-[10px] uppercase font-bold tracking-widest", isActive ? "text-primary" : "text-muted-foreground")}>
        {label}
      </span>
    </div>
  );
}