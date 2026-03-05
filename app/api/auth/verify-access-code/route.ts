/**
 * POST /api/auth/verify-access-code
 * Verifies one-time access code and creates user session
 * 
 * Security:
 * - Rate limited to prevent brute force attacks (5 attempts per 15 minutes per IP)
 * - Uses Firestore transaction to prevent race conditions
 * 
 * Request body: { code: string }
 * Response: { uid: string } or error
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAndActivateAccessCode } from '@/lib/auth';
import { checkRateLimit, getClientIP, createRateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting to prevent brute force attacks
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(
      `verify-code:${clientIP}`,
      RATE_LIMITS.ACCESS_CODE_VERIFY
    );

    if (rateLimitResult.isLimited) {
      return createRateLimitResponse(rateLimitResult.resetTime);
    }

    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request: code is required' },
        { status: 400 }
      );
    }

    // Normalize code (uppercase)
    const normalizedCode = code.toUpperCase().trim();

    // Verify and activate the code (uses transaction to prevent race condition)
    const uid = await verifyAndActivateAccessCode(normalizedCode);

    return NextResponse.json({ uid }, { status: 200 });
  } catch (error: any) {
    console.error('Error verifying access code:', error);

    if (error.message.includes('Invalid or already used')) {
      return NextResponse.json(
        { error: 'Invalid or already used access code' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
