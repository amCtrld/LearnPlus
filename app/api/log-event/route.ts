/**
 * POST /api/log-event
 * Enhanced logging endpoint with server-side timestamps
 * Logs comprehensive research data to Firestore
 * 
 * Supports multiple event types:
 * - step_attempt: Student attempts a step (correct or incorrect)
 * - validation: Validation result details
 * - problem_start: Student begins a problem
 * - problem_completion: Student completes all steps
 * 
 * Request body varies by eventType but always includes:
 * - eventType: string
 * - uid: string
 * - clientTimestamp: string (ISO format)
 * 
 * Response: { success: true, serverId: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventType, uid, clientTimestamp } = body;

    // Validate required fields
    if (!eventType || !uid || !clientTimestamp) {
      return NextResponse.json(
        { error: 'Missing required fields: eventType, uid, clientTimestamp' },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    if (!db) {
      throw new Error('Firebase Admin not initialized');
    }

    // Add server-side timestamp for accuracy
    const serverTimestamp = FieldValue.serverTimestamp();
    const clientTime = new Date(clientTimestamp);

    let logEntry: any = {
      eventType,
      uid,
      clientTimestamp: clientTime,
      serverTimestamp,
    };

    // Handle different event types
    switch (eventType) {
      case 'step_attempt': {
        const { mode, problemId, stepId, studentAnswer, isCorrect, attemptNumber, timeSpent, aiInteractionCount, validationMessage } = body;
        
        if (!mode || typeof problemId !== 'number' || !stepId || typeof isCorrect !== 'boolean') {
          return NextResponse.json(
            { error: 'Missing required fields for step_attempt' },
            { status: 400 }
          );
        }

        logEntry = {
          ...logEntry,
          mode,
          problemId,
          stepId,
          studentAnswer: studentAnswer || '',
          isCorrect,
          attemptNumber: attemptNumber || 1,
          timeSpent: timeSpent || 0,
          aiInteractionCount: aiInteractionCount || 0,
          validationMessage: validationMessage || null,
        };
        break;
      }

      case 'validation': {
        const { problemId, stepId, studentAnswer, expectedAnswer, isCorrect, validationMessage } = body;
        
        if (typeof problemId !== 'number' || !stepId) {
          return NextResponse.json(
            { error: 'Missing required fields for validation' },
            { status: 400 }
          );
        }

        logEntry = {
          ...logEntry,
          problemId,
          stepId,
          studentAnswer: studentAnswer || '',
          expectedAnswer: expectedAnswer || '',
          isCorrect: isCorrect || false,
          validationMessage: validationMessage || null,
        };
        break;
      }

      case 'problem_start': {
        const { mode, problemId } = body;
        
        if (!mode || typeof problemId !== 'number') {
          return NextResponse.json(
            { error: 'Missing required fields for problem_start' },
            { status: 400 }
          );
        }

        logEntry = {
          ...logEntry,
          mode,
          problemId,
        };
        break;
      }

      case 'problem_completion': {
        const { mode, problemId, totalTimeSpent, totalAttempts, totalAiInteractions } = body;
        
        if (!mode || typeof problemId !== 'number') {
          return NextResponse.json(
            { error: 'Missing required fields for problem_completion' },
            { status: 400 }
          );
        }

        logEntry = {
          ...logEntry,
          mode,
          problemId,
          totalTimeSpent: totalTimeSpent || 0,
          totalAttempts: totalAttempts || 0,
          totalAiInteractions: totalAiInteractions || 0,
        };
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unknown event type: ${eventType}` },
          { status: 400 }
        );
    }

    // Add log entry to Firestore
    const docRef = await db.collection('logEntries').add(logEntry);

    return NextResponse.json(
      { success: true, serverId: docRef.id },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error logging event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

