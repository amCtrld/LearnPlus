'use client';

/**
 * Problem Solving Page
 * Core feature: students solve calculus problems step-by-step
 * Validates answers, logs data, and shows conditional AI chat based on mode
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ChevronRight, Home, AlertCircle } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { getProblem, getNextProblemId } from '@/lib/course-data';
import { ProblemStep } from '@/components/problem-step';
import { SurveyModal } from '@/components/survey-modal';
import { ChatPanel } from '@/components/chat-panel';
import { logStepAttempt, startStepTimer, getStepElapsedTime, resetAiInteractionCount, getAiInteractionCount } from '@/lib/logger';
import { firestore } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Session } from '@/lib/types';

export default function ProblemPage() {
  const params = useParams();
  const router = useRouter();
  const { uid, session: authSession, updateSession } = useAuth();

  const problemId = parseInt(params.id as string, 10);
  const problem = getProblem(problemId);

  const [session, setSession] = useState<Session | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showSurvey, setShowSurvey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load session on mount
  useEffect(() => {
    if (!uid) {
      router.push('/access-code');
      return;
    }

    if (!problem) {
      setError('Problem not found');
      setIsLoading(false);
      return;
    }

    const loadSession = async () => {
      try {
        const sessionRef = doc(firestore, 'sessions', uid);
        const sessionDoc = await getDoc(sessionRef);
        if (sessionDoc.exists()) {
          const sessionData = sessionDoc.data() as Session;
          setSession(sessionData);
          
          // Check if problem already completed
          if (sessionData.completedProblems.includes(problemId)) {
            setShowSurvey(false); // Already surveyed
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load session');
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
    startStepTimer(`step-${currentStepIndex}`);

    return () => {
      resetAiInteractionCount(problemId);
    };
  }, [uid, problemId, problem, router, currentStepIndex]);

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading problem...</p>
        </div>
      </main>
    );
  }

  if (!problem || !session) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || 'Problem not found or session error'}
              </AlertDescription>
            </Alert>
            <Button onClick={() => router.push('/dashboard')} className="w-full">
              <Home className="mr-2 h-4 w-4" />
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const currentStep = problem.steps[currentStepIndex];
  const totalSteps = problem.steps.length;
  const isLastStep = currentStepIndex === totalSteps - 1;
  const progressPercent = ((currentStepIndex + 1) / totalSteps) * 100;

  const handleStepSubmit = async (answer: string): Promise<boolean> => {
    try {
      // Validate answer
      const response = await fetch('/api/validate-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId,
          stepId: currentStep.id,
          studentAnswer: answer,
        }),
      });

      const { isCorrect } = await response.json();

      if (isCorrect) {
        const elapsedTime = getStepElapsedTime(`step-${currentStepIndex}`);
        const aiInteractionCount = getAiInteractionCount(problemId);

        // Log the successful step
        await logStepAttempt({
          uid,
          mode: session.mode,
          problemId,
          stepId: currentStep.id,
          isCorrect: true,
          timeSpent: elapsedTime,
          aiInteractionCount,
        });

        // Move to next step or show survey
        if (isLastStep) {
          // Mark problem as completed
          const newCompletedProblems = [...session.completedProblems, problemId];
          const nextId = getNextProblemId(problemId);
          const sessionRef = doc(firestore, 'sessions', uid);

          await updateDoc(sessionRef, {
            completedProblems: newCompletedProblems,
            currentProblemId: nextId || problemId,
          });

          setSession((s) =>
            s ? { ...s, completedProblems: newCompletedProblems } : null
          );

          setShowSurvey(true);
        } else {
          setCurrentStepIndex((i) => i + 1);
          startStepTimer(`step-${currentStepIndex + 1}`);
        }
      }

      return isCorrect;
    } catch (err) {
      console.error('Error submitting step:', err);
      return false;
    }
  };

  const handleSurveySubmit = async (responses: {
    mentalDemand: number;
    confidence: number;
    systemHelpfulness: number;
  }) => {
    try {
      await fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid,
          problemId,
          ...responses,
        }),
      });

      // Redirect to dashboard or next problem
      const nextId = getNextProblemId(problemId);
      if (nextId) {
        router.push(`/problem/${nextId}`);
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Error submitting survey:', err);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className={`max-w-7xl mx-auto ${session.mode === 'ai-assisted' ? 'grid grid-cols-3 gap-4' : ''}`}>
        <div className={session.mode === 'ai-assisted' ? 'col-span-2 space-y-6' : 'max-w-3xl mx-auto space-y-6'}>
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">{problem.title}</h1>
              <p className="text-sm text-muted-foreground font-mono">
                {problem.expression}
              </p>
            </div>
            <Button
              onClick={() => router.push('/dashboard')}
              variant="outline"
              size="sm"
            >
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </div>

          {/* Progress */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Step Progress</span>
                  <span className="text-muted-foreground">
                    {currentStepIndex + 1} of {totalSteps}
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Problem Step */}
          <ProblemStep
            step={currentStep}
            stepIndex={currentStepIndex}
            totalSteps={totalSteps}
            mode={session.mode}
            onSubmit={handleStepSubmit}
            onAskAI={() => {
              console.log('[v0] AI chat panel available');
            }}
          />

          {/* Tips */}
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {session.mode === 'ai-assisted'
                  ? '💡 Need help? Use the AI Tutor panel on the right to get guidance without giving away the answer.'
                  : '💡 Work through each step carefully. Check your answers against the expected result.'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* AI Chat Panel (only in AI-assisted mode) */}
        {session.mode === 'ai-assisted' && (
          <div className="col-span-1 h-[calc(100vh-120px)]">
            <ChatPanel
              uid={uid}
              problemId={problemId}
              currentStep={currentStep}
              mode={session.mode}
            />
          </div>
        )}
      </div>

      {/* Survey Modal */}
      {session && (
        <SurveyModal
          isOpen={showSurvey}
          problemId={problemId}
          mode={session.mode}
          onSubmit={handleSurveySubmit}
        />
      )}
    </main>
  );
}
