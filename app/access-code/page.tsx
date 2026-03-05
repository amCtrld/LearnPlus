'use client';

/**
 * Access Code Entry Page
 * Entry point for the study - users enter their one-time access code here
 * After successful verification, they're redirected to mode selection
 */

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AccessCodeInput } from '@/components/access-code-input';
import { useAuth } from '@/components/auth-provider';

export default function AccessCodePage() {
  const router = useRouter();
  const { uid, isLoading } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // If already authenticated, redirect to mode selection
  useEffect(() => {
    if (!isLoading && uid) {
      setIsRedirecting(true);
      router.push('/select-mode');
    }
  }, [uid, isLoading, router]);

  const handleSuccess = (newUid: string) => {
    setIsRedirecting(true);
    router.push('/select-mode');
  };

  if (isLoading || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Calculus Learning Study</h1>
          <p className="text-muted-foreground">
            Interactive research study on calculus learning with and without AI assistance
          </p>
        </div>

        <AccessCodeInput onSuccess={handleSuccess} />

        <div className="rounded-lg bg-secondary/30 border border-secondary/50 p-4 space-y-2 text-sm">
          <p className="font-medium">About This Study</p>
          <p className="text-muted-foreground">
            This research study investigates how AI assistance affects learning outcomes in calculus. 
            You'll solve differentiation problems in one of two modes. Your progress and interactions 
            will be recorded for analysis.
          </p>
        </div>
      </div>
    </main>
  );
}
