'use client';

/**
 * Global error page for Next.js application
 * Catches and displays errors that occur during rendering
 */

import { useEffect } from 'react';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { reportError } from '@/lib/error-tracker';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Report error to tracking system
    reportError(error, {
      component: 'GlobalErrorPage',
      digest: error.digest,
    });
  }, [error]);

  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-gray-50 to-gray-100">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <CardTitle>Something went wrong</CardTitle>
          </div>
          <CardDescription>
            We encountered an error while loading this page
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Details</AlertTitle>
            <AlertDescription>
              {error.message || 'An unexpected error occurred'}
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Don't worry - your progress has been saved. Here's what you can do:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Try refreshing the page</li>
              <li>Go back to the home page</li>
              <li>Clear your browser cache and cookies</li>
              <li>Contact support if the problem persists</li>
            </ul>
          </div>

          {isDevelopment && error.stack && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium mb-2">
                Technical Details (Development Only)
              </summary>
              <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-64">
                {error.stack}
              </pre>
              {error.digest && (
                <p className="text-xs text-muted-foreground mt-2">
                  Error Digest: {error.digest}
                </p>
              )}
            </details>
          )}
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button onClick={reset} variant="default">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button onClick={() => window.location.href = '/'} variant="outline">
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
