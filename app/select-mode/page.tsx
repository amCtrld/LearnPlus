'use client';

/**
 * Mode Selection Page
 * Users choose between Control (no AI) or AI-Assisted modes
 * This choice determines their entire study experience
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, Brain, BookOpen } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { firestore } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { StudyMode } from '@/lib/types';

export default function SelectModePage() {
  const router = useRouter();
  const { uid, updateSession } = useAuth();
  const [selectedMode, setSelectedMode] = useState<StudyMode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    if (!selectedMode || !uid) return;

    setError(null);
    setIsLoading(true);

    try {
      // Update session in Firestore with selected mode
      const sessionRef = doc(firestore, 'sessions', uid);
      await updateDoc(sessionRef, {
        mode: selectedMode,
      });

      // Update local auth context
      updateSession({ mode: selectedMode });

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save mode selection');
      setIsLoading(false);
    }
  };

  if (!uid) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
        <p className="text-muted-foreground">Redirecting...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Choose Your Study Mode</h1>
          <p className="text-muted-foreground">
            Select how you'd like to work through the calculus problems
          </p>
        </div>

        <RadioGroup value={selectedMode || ''} onValueChange={(value) => setSelectedMode(value as StudyMode)}>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Control Mode */}
            <Label
              htmlFor="control"
              className="cursor-pointer"
            >
              <Card className={`h-full transition-all ${selectedMode === 'control' ? 'ring-2 ring-primary' : ''}`}>
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Control Mode
                      </CardTitle>
                      <CardDescription>
                        Work independently
                      </CardDescription>
                    </div>
                    <RadioGroupItem value="control" id="control" className="mt-1" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">✓</span>
                      <span>Solve problems on your own</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">✓</span>
                      <span>No AI assistance available</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">✓</span>
                      <span>Test your knowledge independently</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </Label>

            {/* AI-Assisted Mode */}
            <Label
              htmlFor="ai-assisted"
              className="cursor-pointer"
            >
              <Card className={`h-full transition-all ${selectedMode === 'ai-assisted' ? 'ring-2 ring-primary' : ''}`}>
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        AI-Assisted Mode
                      </CardTitle>
                      <CardDescription>
                        Learn with AI support
                      </CardDescription>
                    </div>
                    <RadioGroupItem value="ai-assisted" id="ai-assisted" className="mt-1" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">✓</span>
                      <span>Ask for hints and explanations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">✓</span>
                      <span>AI tutor provides step-by-step guidance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">✓</span>
                      <span>Learn calculus concepts interactively</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </Label>
          </div>
        </RadioGroup>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleContinue}
          disabled={!selectedMode || isLoading}
          size="lg"
          className="w-full"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Starting Study...' : 'Begin Study'}
        </Button>

        <div className="rounded-lg bg-secondary/30 border border-secondary/50 p-4 space-y-2 text-sm">
          <p className="font-medium">Important</p>
          <p className="text-muted-foreground">
            Your study mode cannot be changed once you begin. Choose the mode that best suits your learning style.
          </p>
        </div>
      </div>
    </main>
  );
}
