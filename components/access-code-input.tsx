'use client';

/**
 * Access Code Input Component
 * Form for entering one-time study access code
 * Handles code verification and UID creation
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

interface AccessCodeInputProps {
  onSuccess: (uid: string) => void;
}

export function AccessCodeInput({ onSuccess }: AccessCodeInputProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/verify-access-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Invalid access code');
      }

      const { uid } = await response.json();

      // Store UID in sessionStorage
      sessionStorage.setItem('lms_uid', uid);

      // Notify parent
      onSuccess(uid);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Research Study Access</CardTitle>
        <CardDescription>
          Enter your access code to begin the study
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="code" className="text-sm font-medium">
              Access Code
            </label>
            <Input
              id="code"
              placeholder="e.g., AB1C2D3E4F5G"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              disabled={isLoading}
              maxLength={12}
              className="font-mono text-lg tracking-widest"
            />
            <p className="text-xs text-muted-foreground">
              12-character code provided by the researcher
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={!code || isLoading}
            className="w-full"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Verifying...' : 'Begin Study'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
