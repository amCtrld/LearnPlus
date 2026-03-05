'use client';

/**
 * Dashboard Page
 * Shows problem list, progress, and navigation to problems
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, LogOut, ArrowRight } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { PROBLEMS, getTotalProblems } from '@/lib/course-data';
import { firestore } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Session } from '@/lib/types';

export default function DashboardPage() {
  const router = useRouter();
  const { uid, logout, updateSession } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      router.push('/access-code');
      return;
    }

    // Load session from Firestore
    const loadSession = async () => {
      try {
        const sessionRef = doc(firestore, 'sessions', uid);
        const sessionDoc = await getDoc(sessionRef);
        if (sessionDoc.exists()) {
          const sessionData = sessionDoc.data() as Session;
          setSession(sessionData);
        } else {
          throw new Error('Session not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load session');
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, [uid, router]);

  const handleStartProblem = (problemId: number) => {
    router.push(`/problem/${problemId}`);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    logout();
    router.push('/access-code');
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {error || 'Failed to load your session. Please try again.'}
            </p>
            <Button onClick={() => router.push('/access-code')} className="w-full">
              Return to Access Code
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const completedCount = session.completedProblems.length;
  const totalCount = getTotalProblems();
  const progressPercent = (completedCount / totalCount) * 100;
  const nextProblemId = session.currentProblemId;

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Study Mode: <span className="font-semibold capitalize">{session.mode?.replace('-', ' ')}</span>
            </p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Exit Study
          </Button>
        </div>

        {/* Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
            <CardDescription>
              {completedCount} of {totalCount} problems completed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={progressPercent} className="h-3" />
            <p className="text-sm text-muted-foreground text-right">
              {Math.round(progressPercent)}%
            </p>
          </CardContent>
        </Card>

        {/* Problems List */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Problems</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {PROBLEMS.map((problem) => {
              const isCompleted = session.completedProblems.includes(problem.id);
              const isCurrent = problem.id === nextProblemId;
              const isLocked = problem.id > nextProblemId;

              return (
                <Card
                  key={problem.id}
                  className={`transition-all ${
                    isCurrent ? 'ring-2 ring-primary' : ''
                  } ${isLocked ? 'opacity-50' : ''}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{problem.title}</CardTitle>
                        <CardDescription className="font-mono text-xs">
                          {problem.expression}
                        </CardDescription>
                      </div>
                      {isCompleted && (
                        <span className="text-green-600 text-2xl">✓</span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {problem.steps.length} step{problem.steps.length !== 1 ? 's' : ''}
                      </p>
                      <Button
                        onClick={() => handleStartProblem(problem.id)}
                        disabled={isLocked}
                        className="w-full"
                        variant={isCurrent ? 'default' : 'outline'}
                      >
                        {isCompleted ? 'Review' : 'Start'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Info */}
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100">Tips</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
            <p>
              • Start with the first problem and progress sequentially
            </p>
            <p>
              • Each problem has multiple steps - answer them carefully
            </p>
            {session.mode === 'ai-assisted' && (
              <p>
                • You can ask the AI for hints at any time during problem solving
              </p>
            )}
            <p>
              • After completing each problem, you'll answer a brief survey about your experience
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
