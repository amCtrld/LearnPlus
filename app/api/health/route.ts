/**
 * GET /api/health
 * Health check endpoint for monitoring system status
 * 
 * Checks:
 * - API responsiveness
 * - Firebase connectivity
 * - OpenAI API status
 * - Database accessibility
 * 
 * Returns: System health status and component availability
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase';

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    api: { status: string; responseTime?: number };
    database: { status: string; responseTime?: number; error?: string };
    openai: { status: string; configured: boolean };
    firebase: { status: string; configured: boolean };
  };
  version?: string;
}

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<{
  status: string;
  responseTime?: number;
  error?: string;
}> {
  const startTime = performance.now();
  
  try {
    const db = getAdminFirestore();
    if (!db) {
      return { status: 'unavailable', error: 'Firebase Admin not initialized' };
    }
    
    // Try to read a collection (lightweight operation)
    await db.collection('accessCodes').limit(1).get();
    
    const responseTime = performance.now() - startTime;
    return { status: 'healthy', responseTime };
  } catch (error: any) {
    const responseTime = performance.now() - startTime;
    return {
      status: 'unhealthy',
      responseTime,
      error: error.message || 'Unknown database error',
    };
  }
}

/**
 * Check OpenAI configuration
 */
function checkOpenAI(): { status: string; configured: boolean } {
  const configured = !!process.env.OPENAI_API_KEY;
  return {
    status: configured ? 'configured' : 'not_configured',
    configured,
  };
}

/**
 * Check Firebase configuration
 */
function checkFirebase(): { status: string; configured: boolean } {
  const configured = !!(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.FIREBASE_CLIENT_EMAIL
  );
  return {
    status: configured ? 'configured' : 'not_configured',
    configured,
  };
}

/**
 * Get system uptime (in seconds)
 */
function getUptime(): number {
  if (typeof process !== 'undefined' && process.uptime) {
    return Math.floor(process.uptime());
  }
  return 0;
}

export async function GET(request: NextRequest) {
  const startTime = performance.now();
  
  try {
    // Run health checks
    const [databaseCheck] = await Promise.all([
      checkDatabase(),
    ]);
    
    const openaiCheck = checkOpenAI();
    const firebaseCheck = checkFirebase();
    
    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (databaseCheck.status === 'unhealthy') {
      overallStatus = 'unhealthy';
    } else if (
      databaseCheck.status === 'unavailable' ||
      !openaiCheck.configured ||
      !firebaseCheck.configured
    ) {
      overallStatus = 'degraded';
    }
    
    const apiResponseTime = performance.now() - startTime;
    
    const healthCheck: HealthCheck = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: getUptime(),
      checks: {
        api: {
          status: 'healthy',
          responseTime: apiResponseTime,
        },
        database: databaseCheck,
        openai: openaiCheck,
        firebase: firebaseCheck,
      },
      version: process.env.npm_package_version || '1.0.0',
    };
    
    // Return appropriate HTTP status code
    const httpStatus = 
      overallStatus === 'healthy' ? 200 :
      overallStatus === 'degraded' ? 200 :
      503; // Service Unavailable
    
    return NextResponse.json(healthCheck, { status: httpStatus });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message || 'Health check failed',
      },
      { status: 503 }
    );
  }
}
