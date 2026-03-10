/**
 * GET /api/auth/session?uid=xxx
 * Fetches a participant's session data
 * 
 * POST /api/auth/session
 * Updates a participant's session data
 * 
 * Request body: { uid: string, updates: Partial<Session> }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const uid = request.nextUrl.searchParams.get('uid');

    if (!uid) {
      return NextResponse.json(
        { error: 'uid is required' },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const sessionDoc = await db.collection('sessions').doc(uid).get();

    if (!sessionDoc.exists) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ session: sessionDoc.data() }, { status: 200 });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { uid, updates } = await request.json();

    if (!uid || !updates) {
      return NextResponse.json(
        { error: 'uid and updates are required' },
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

    await sessionRef.update(updates);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
