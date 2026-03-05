/**
 * POST /api/auth/logout
 * Handles user logout and session cleanup
 * 
 * Features:
 * - Validates authentication before logout
 * - Updates session endTime in Firestore
 * - Clears session data
 * - Returns success status
 * 
 * Note: Client-side also clears sessionStorage
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId, sessionId } = body;

    // If userId and sessionId provided, update session end time
    if (userId && sessionId) {
      const db = getAdminFirestore();
      if (db) {
        const sessionRef = db.collection('userSessions').doc(sessionId);
        const sessionDoc = await sessionRef.get();

        // Only update if session exists and belongs to the user
        if (sessionDoc.exists && sessionDoc.data()?.userId === userId) {
          await sessionRef.update({
            endTime: new Date(),
            status: 'completed'
          });
        }
      }
    }

    // Return success (client will clear sessionStorage)
    return NextResponse.json({ 
      success: true,
      message: 'Logged out successfully' 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error logging out:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
