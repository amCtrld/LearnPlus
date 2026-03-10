/**
 * GET /api/admin/export-data
 * Exports all research data to CSV format
 * Used for offline analysis
 * 
 * Security: Requires admin API key authentication
 * Rate limit: 10 requests per hour
 * 
 * Returns: CSV data with all logs, surveys, and sessions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { validateAdminRequest } from '@/lib/admin-auth';
import { checkRateLimit, getClientIP, createRateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';

function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const rows = data.map((item) =>
    headers.map((header) => {
      const value = item[header];
      // Escape CSV values
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      return value;
    })
  );

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

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
      `admin-export:${clientIP}`,
      RATE_LIMITS.ADMIN_GENERATE_CODES
    );

    if (rateLimitResult.isLimited) {
      return createRateLimitResponse(rateLimitResult.resetTime);
    }

    const db = getAdminFirestore();
    if (!db) {
      throw new Error('Firebase Admin not initialized');
    }

    // Fetch all data collections
    const [logsSnapshot, surveysSnapshot, sessionsSnapshot, codesSnapshot] = await Promise.all([
      db.collection('logEntries').get(),
      db.collection('surveys').get(),
      db.collection('sessions').get(),
      db.collection('accessCodes').get(),
    ]);

    // Convert to arrays with timestamps
    const logs = logsSnapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        ...data,
        timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp,
      };
    });

    const surveys = surveysSnapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        ...data,
        timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp,
      };
    });

    const sessions = sessionsSnapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        ...data,
        startTime: data.startTime?.toDate?.()?.toISOString() || data.startTime,
        endTime: data.endTime?.toDate?.()?.toISOString() || data.endTime,
      };
    });

    const codes = codesSnapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        ...data,
        created: data.created?.toDate?.()?.toISOString() || data.created,
        usedAt: data.usedAt?.toDate?.()?.toISOString() || data.usedAt,
      };
    });

    // Create separate CSV files content
    const logsCSV = convertToCSV(logs);
    const surveysCSV = convertToCSV(surveys);
    const sessionsCSV = convertToCSV(sessions);
    const codesCSV = convertToCSV(codes);

    // Combine into a single response with sections
    const combinedData = `# LMS Research Data Export
Generated: ${new Date().toISOString()}

## LOG ENTRIES (${logs.length} records)
${logsCSV}

## SURVEYS (${surveys.length} records)
${surveysCSV}

## SESSIONS (${sessions.length} records)
${sessionsCSV}

## ACCESS CODES (${codes.length} records)
${codesCSV}
`;

    return new NextResponse(combinedData, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="lms_data_export_${new Date().toISOString().split('T')[0]}.txt"`,
      },
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
