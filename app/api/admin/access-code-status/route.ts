/**
 * GET /api/admin/access-code-status
 * Returns status of access codes (used vs unused count)
 * 
 * Security: Requires admin API key authentication
 * Rate limit: 10 requests per hour
 * 
 * Response: { total: number, used: number, unused: number, codes: Array }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAccessCodeStatus } from '@/lib/auth';
import { validateAdminRequest } from '@/lib/admin-auth';
import { checkRateLimit, getClientIP, createRateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authError = validateAdminRequest(request);
    if (authError) {
      return authError;
    }

    // Apply rate limiting
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(
      `admin-status:${clientIP}`,
      RATE_LIMITS.ADMIN_GENERATE_CODES
    );

    if (rateLimitResult.isLimited) {
      return createRateLimitResponse(rateLimitResult.resetTime);
    }

    const status = await getAccessCodeStatus();
    return NextResponse.json(status, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching access code status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
