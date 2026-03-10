/**
 * POST /api/auth/select-mode
 * Sets the study mode for a participant's session
 * 
 * Request body: { uid: string, mode: 'control' | 'ai-assisted' }
 * Response: { success: true } or error
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { uid, mode } = await request.json();

    if (!uid || typeof uid !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request: uid is required' },
        { status: 400 }
      );
    }

    if (mode !== 'control' && mode !== 'ai-assisted') {
      return NextResponse.json(
        { error: 'Invalid request: mode must be "control" or "ai-assisted"' },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const sessionRef = db.collection('sessions').doc(uid);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    await sessionRef.update({ mode });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error setting study mode:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
