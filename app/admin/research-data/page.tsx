'use client';

/**
 * Admin: Research Data Dashboard
 * View and export research data collected from study participants
 * Provides overview of:
 * - Number of participants
 * - Completion rates
 * - Cognitive load metrics
 * - Mode comparisons
 */

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Download, Loader2, BarChart3 } from 'lucide-react';
import { getAdminFirestore } from '@/lib/firebase';

interface ResearchStats {
  totalParticipants: number;
  controlParticipants: number;
  aiAssistedParticipants: number;
  totalLogEntries: number;
  totalSurveyResponses: number;
  averageCompletionRate: number;
  averageMentalDemand: number;
  averageConfidence: number;
  averageSystemHelpfulness: number;
}

export default function ResearchDataPage() {
  const [stats, setStats] = useState<ResearchStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const db = getAdminFirestore();
        if (!db) {
          throw new Error('Firebase not initialized');
        }

        // Fetch data
        const [sessionDocs, logDocs, surveyDocs] = await Promise.all([
          db.collection('sessions').get(),
          db.collection('logEntries').get(),
          db.collection('surveys').get(),
        ]);

        const sessions = sessionDocs.docs.map((d) => d.data());
        const logs = logDocs.docs.map((d) => d.data());
        const surveys = surveyDocs.docs.map((d) => d.data());

        // Calculate statistics
        const totalParticipants = sessions.length;
        const controlParticipants = sessions.filter((s: any) => s.mode === 'control').length;
        const aiAssistedParticipants = sessions.filter((s: any) => s.mode === 'ai-assisted').length;

        const completedProblemsPerParticipant = sessions.map(
          (s: any) => s.completedProblems?.length || 0
        );
        const averageCompletionRate =
          completedProblemsPerParticipant.length > 0
            ? completedProblemsPerParticipant.reduce((a, b) => a + b, 0) / completedProblemsPerParticipant.length
            : 0;

        const surveysWithData = surveys as any[];
        const averageMentalDemand =
          surveysWithData.length > 0
            ? surveysWithData.reduce((sum, s) => sum + (s.mentalDemand || 0), 0) / surveysWithData.length
            : 0;

        const averageConfidence =
          surveysWithData.length > 0
            ? surveysWithData.reduce((sum, s) => sum + (s.confidence || 0), 0) / surveysWithData.length
            : 0;

        const aiSurveys = surveysWithData.filter((s) => s.systemHelpfulness > 0);
        const averageSystemHelpfulness =
          aiSurveys.length > 0
            ? aiSurveys.reduce((sum, s) => sum + (s.systemHelpfulness || 0), 0) / aiSurveys.length
            : 0;

        setStats({
          totalParticipants,
          controlParticipants,
          aiAssistedParticipants,
          totalLogEntries: logs.length,
          totalSurveyResponses: surveys.length,
          averageCompletionRate,
          averageMentalDemand,
          averageConfidence,
          averageSystemHelpfulness,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load research data');
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/admin/export-data');
      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lms_research_data_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading research data...</p>
        </div>
      </main>
    );
  }

  if (!stats) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error || 'Failed to load research data'}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Research Data Dashboard
          </h1>
          <p className="text-muted-foreground">
            Overview of cognitive load research study data
          </p>
        </div>

        {/* Export Button */}
        <div className="flex justify-end">
          <Button onClick={handleExport} disabled={isExporting} size="lg">
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export All Data (CSV)
              </>
            )}
          </Button>
        </div>

        {/* Participant Overview */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalParticipants}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Unique study participants
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Control Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.controlParticipants}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalParticipants > 0 &&
                  `${Math.round((stats.controlParticipants / stats.totalParticipants) * 100)}% of total`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">AI-Assisted Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.aiAssistedParticipants}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalParticipants > 0 &&
                  `${Math.round((stats.aiAssistedParticipants / stats.totalParticipants) * 100)}% of total`}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Data Collection Metrics */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Data Collection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Log Entries</span>
                <span className="font-semibold">{stats.totalLogEntries}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Survey Responses</span>
                <span className="font-semibold">{stats.totalSurveyResponses}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Average Problems Completed</span>
                <span className="font-semibold">
                  {stats.averageCompletionRate.toFixed(2)} / 5
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cognitive Load Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Mental Demand (Avg)</span>
                <span className="font-semibold">
                  {stats.averageMentalDemand.toFixed(2)} / 7
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Confidence (Avg)</span>
                <span className="font-semibold">
                  {stats.averageConfidence.toFixed(2)} / 7
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">System Helpfulness (Avg)</span>
                <span className="font-semibold">
                  {stats.averageSystemHelpfulness.toFixed(2)} / 7
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info */}
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100">Data Export</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
            <p>
              Click "Export All Data" to download a comprehensive dataset including:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>All step attempt logs (correctness, time spent, AI interactions)</li>
              <li>All cognitive load survey responses</li>
              <li>All participant session records</li>
              <li>Access code usage tracking</li>
            </ul>
            <p className="mt-4">
              Data is exported in a structured format suitable for statistical analysis and research publication.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
