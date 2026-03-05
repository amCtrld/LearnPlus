/**
 * Admin Authentication Utility
 * 
 * Protects admin endpoints with API key authentication.
 * 
 * Security features:
 * - API key verification
 * - Timing-safe comparison
 * - Request validation
 */

/**
 * Verify admin API key from request headers
 */
export function verifyAdminAuth(request: Request): boolean {
  const authHeader = request.headers.get('Authorization');
  const apiKeyHeader = request.headers.get('X-Admin-API-Key');
  
  // Check for API key in either header format
  let providedKey: string | null = null;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    providedKey = authHeader.substring(7);
  } else if (apiKeyHeader) {
    providedKey = apiKeyHeader;
  }
  
  if (!providedKey) {
    return false;
  }
  
  // Get expected API key from environment
  const expectedKey = process.env.ADMIN_API_KEY;
  
  if (!expectedKey) {
    console.error('ADMIN_API_KEY not configured in environment variables');
    return false;
  }
  
  // Timing-safe comparison to prevent timing attacks
  return timingSafeEqual(providedKey, expectedKey);
}

/**
 * Timing-safe string comparison
 * Prevents timing attacks by ensuring comparison takes constant time
 */
function timingSafeEqual(a: string, b: string): boolean {
  // If lengths differ, comparison is inherently not timing-safe
  // But we still run the comparison to maintain constant time
  const lengthMatch = a.length === b.length;
  const compareLength = Math.max(a.length, b.length);
  
  let result = lengthMatch ? 0 : 1;
  
  for (let i = 0; i < compareLength; i++) {
    const aChar = i < a.length ? a.charCodeAt(i) : 0;
    const bChar = i < b.length ? b.charCodeAt(i) : 0;
    result |= aChar ^ bChar;
  }
  
  return result === 0;
}

/**
 * Create unauthorized response for admin endpoints
 */
export function createUnauthorizedResponse(): Response {
  return new Response(
    JSON.stringify({
      error: 'Unauthorized. Valid admin API key required.',
    }),
    {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'WWW-Authenticate': 'Bearer realm="admin"',
      },
    }
  );
}

/**
 * Validate admin request and return appropriate response if invalid
 * Returns null if request is valid, Response object if invalid
 */
export function validateAdminRequest(request: Request): Response | null {
  if (!verifyAdminAuth(request)) {
    return createUnauthorizedResponse();
  }
  return null;
}
