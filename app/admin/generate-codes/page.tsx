'use client';

/**
 * Admin: Generate Access Codes Page
 * Allows researchers to generate and download unique access codes
 * for study participants
 * 
 * Note: In production, this should require authentication and authorization
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Download, Copy, Loader2, CheckCircle2 } from 'lucide-react';

export default function GenerateCodesPage() {
  const [count, setCount] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codes, setCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setError(null);
    setCodes([]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/generate-access-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate codes');
      }

      const { codes: generatedCodes } = await response.json();
      setCodes(generatedCodes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (codes.length === 0) return;

    const csv = 'access_code\n' + codes.map((c) => c).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `access_codes_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyAll = () => {
    const text = codes.join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen p-4 bg-gradient-to-br from-background to-secondary/20">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Generate Access Codes</h1>
          <p className="text-muted-foreground">
            Create unique one-time access codes for study participants
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Generation Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Create New Codes</CardTitle>
              <CardDescription>
                Generate a batch of unique access codes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="count" className="text-sm font-medium">
                  Number of Codes
                </label>
                <Input
                  id="count"
                  type="number"
                  min="1"
                  max="1000"
                  value={count}
                  onChange={(e) => setCount(Math.min(1000, Math.max(1, parseInt(e.target.value) || 1)))}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Generate between 1 and 1000 codes at a time
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleGenerate}
                disabled={isLoading || count < 1}
                className="w-full"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Generating...' : `Generate ${count} Codes`}
              </Button>
            </CardContent>
          </Card>

          {/* Results Panel */}
          {codes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Codes Generated
                </CardTitle>
                <CardDescription>
                  {codes.length} unique access codes created
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    onClick={handleDownloadCSV}
                    variant="outline"
                    className="flex-1"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download CSV
                  </Button>
                  <Button
                    onClick={handleCopyAll}
                    variant="outline"
                    className="flex-1"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    {copied ? 'Copied!' : 'Copy All'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Codes Display */}
        {codes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Generated Codes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto rounded-lg border bg-secondary/30 p-4">
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                  {codes.map((code, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-background rounded border border-border text-sm font-mono text-center hover:bg-accent transition-colors"
                    >
                      {code}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100">Instructions</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
            <p>
              1. Generate the number of access codes you need for your study participants
            </p>
            <p>
              2. Download the CSV file or copy the codes and distribute to participants
            </p>
            <p>
              3. Each code can only be used once - after use it's linked to a participant UID
            </p>
            <p>
              4. Each participant gets their own UID ensuring one-to-one data mapping
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
