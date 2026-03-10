/**
 * POST /api/survey
 * Stores cognitive load survey responses to Firestore
 * 
 * Request body: {
 *   uid: string
 *   problemId: number
 *   mentalDemand: number (1-7)
 *   confidence: number (1-7)
 *   systemHelpfulness: number (0 for control, 1-7 for AI-assisted)
 * }
 * Response: { success: true }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, problemId, mentalDemand, confidence, systemHelpfulness } = body;

    // Validate input
    if (!uid || typeof problemId !== 'number' || typeof mentalDemand !== 'number' || typeof confidence !== 'number') {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    if (!db) {
      throw new Error('Firebase Admin not initialized');
    }

    // Add survey response to Firestore
    await db.collection('surveys').add({
      uid,
      problemId,
      timestamp: new Date(),
      mentalDemand,
      confidence,
      systemHelpfulness: systemHelpfulness || 0,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error submitting survey:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
