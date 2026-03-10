/**
 * GET /api/admin/research-stats
 * Returns aggregated research statistics for the admin dashboard
 * 
 * Security: Requires admin API key authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateAdminRequest } from '@/lib/admin-auth';
import { getAdminFirestore } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  const authError = validateAdminRequest(request);
  if (authError) {
    return authError;
  }

  try {
    const db = getAdminFirestore();

    const [sessionDocs, logDocs, surveyDocs] = await Promise.all([
      db.collection('sessions').get(),
      db.collection('logEntries').get(),
      db.collection('surveys').get(),
    ]);

    const sessions = sessionDocs.docs.map((d: any) => d.data());
    const logs = logDocs.docs.map((d: any) => d.data());
    const surveys = surveyDocs.docs.map((d: any) => d.data());

    const totalParticipants = sessions.length;
    const controlParticipants = sessions.filter((s: any) => s.mode === 'control').length;
    const aiAssistedParticipants = sessions.filter((s: any) => s.mode === 'ai-assisted').length;

    const completedProblemsPerParticipant = sessions.map(
      (s: any) => s.completedProblems?.length || 0
    );
    const averageCompletionRate =
      completedProblemsPerParticipant.length > 0
        ? completedProblemsPerParticipant.reduce((a: number, b: number) => a + b, 0) / completedProblemsPerParticipant.length
        : 0;

    const averageMentalDemand =
      surveys.length > 0
        ? surveys.reduce((sum: number, s: any) => sum + (s.mentalDemand || 0), 0) / surveys.length
        : 0;

    const averageConfidence =
      surveys.length > 0
        ? surveys.reduce((sum: number, s: any) => sum + (s.confidence || 0), 0) / surveys.length
        : 0;

    const aiSurveys = surveys.filter((s: any) => s.systemHelpfulness > 0);
    const averageSystemHelpfulness =
      aiSurveys.length > 0
        ? aiSurveys.reduce((sum: number, s: any) => sum + (s.systemHelpfulness || 0), 0) / aiSurveys.length
        : 0;

    return NextResponse.json({
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
  } catch (error) {
    console.error('Failed to fetch research stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch research statistics' },
      { status: 500 }
    );
  }
}
