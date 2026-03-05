/**
 * POST /api/admin/generate-access-codes
 * Generates and stores bulk access codes
 * 
 * Security: Requires admin API key authentication
 * Rate limit: 10 requests per hour
 * 
 * Request headers: { Authorization: "Bearer YOUR_API_KEY" }
 * Request body: { count: number }
 * Response: { codes: string[], count: number }
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateAccessCodes, storeAccessCodes } from '@/lib/auth';
import { validateAdminRequest } from '@/lib/admin-auth';
import { checkRateLimit, getClientIP, createRateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authError = validateAdminRequest(request);
    if (authError) {
      return authError;
    }

    // Apply rate limiting
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(
      `admin-generate:${clientIP}`,
      RATE_LIMITS.ADMIN_GENERATE_CODES
    );

    if (rateLimitResult.isLimited) {
      return createRateLimitResponse(rateLimitResult.resetTime);
    }

    const { count } = await request.json();

    if (!count || typeof count !== 'number' || count < 1 || count > 1000) {
      return NextResponse.json(
        { error: 'Invalid request: count must be between 1 and 1000' },
        { status: 400 }
      );
    }

    // Generate codes
    const codes = generateAccessCodes(count);

    // Store in Firestore
    await storeAccessCodes(codes);

    return NextResponse.json(
      {
        codes,
        count: codes.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error generating access codes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
