'use client';

/**
 * Landing Page
 * Redirects authenticated users to select-mode
 * Redirects unauthenticated users to access-code
 */

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';

export default function Home() {
  const router = useRouter();
  const { uid, isLoading } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setIsRedirecting(true);
      if (uid) {
        router.push('/select-mode');
      } else {
        router.push('/access-code');
      }
    }
  }, [uid, isLoading, router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
      <div className="text-center space-y-4">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </main>
  );
}
