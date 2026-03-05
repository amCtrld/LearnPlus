/**
 * Rate Limiting Utility
 * 
 * Protects API endpoints from abuse using in-memory rate limiting.
 * For production, consider using Redis or a dedicated rate limiting service.
 * 
 * Features:
 * - IP-based rate limiting
 * - Configurable time windows and limits
 * - Automatic cleanup of old entries
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup old entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Check if request should be rate limited
   * @param identifier - Unique identifier (IP, user ID, etc.)
   * @param limit - Maximum requests allowed
   * @param windowMs - Time window in milliseconds
   * @returns Object with isLimited flag and remaining requests
   */
  check(
    identifier: string,
    limit: number,
    windowMs: number
  ): { isLimited: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    // No previous requests or window expired
    if (!entry || now > entry.resetTime) {
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      });
      return {
        isLimited: false,
        remaining: limit - 1,
        resetTime: now + windowMs,
      };
    }

    // Within rate limit window
    if (entry.count < limit) {
      entry.count++;
      this.requests.set(identifier, entry);
      return {
        isLimited: false,
        remaining: limit - entry.count,
        resetTime: entry.resetTime,
      };
    }

    // Rate limit exceeded
    return {
      isLimited: true,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  /**
   * Reset rate limit for an identifier
   */
  reset(identifier: string): void {
    this.requests.delete(identifier);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [identifier, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(identifier);
      }
    }
  }

  /**
   * Get stats for monitoring
   */
  getStats(): { totalEntries: number; activeEntries: number } {
    const now = Date.now();
    let activeEntries = 0;
    for (const entry of this.requests.values()) {
      if (now <= entry.resetTime) {
        activeEntries++;
      }
    }
    return {
      totalEntries: this.requests.size,
      activeEntries,
    };
  }

  /**
   * Cleanup on shutdown
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.requests.clear();
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter();

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Auth endpoints - strict limits
  ACCESS_CODE_VERIFY: {
    limit: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  
  // Admin endpoints - very strict
  ADMIN_GENERATE_CODES: {
    limit: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  
  // Student endpoints - moderate limits
  VALIDATE_STEP: {
    limit: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  
  CHAT: {
    limit: 50,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  
  LOG_EVENT: {
    limit: 200,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  
  // Survey endpoints
  SURVEY: {
    limit: 20,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
};

/**
 * Get client IP from request
 */
export function getClientIP(request: Request): string {
  // Try various headers for IP (works with most proxies/load balancers)
  const headers = request.headers;
  
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  // Fallback to a placeholder (not ideal but prevents crashes)
  return 'unknown';
}

/**
 * Check rate limit for a request
 */
export function checkRateLimit(
  identifier: string,
  config: { limit: number; windowMs: number }
): { isLimited: boolean; remaining: number; resetTime: number } {
  return rateLimiter.check(identifier, config.limit, config.windowMs);
}

/**
 * Reset rate limit for an identifier (useful for testing)
 */
export function resetRateLimit(identifier: string): void {
  rateLimiter.reset(identifier);
}

/**
 * Get rate limiter stats
 */
export function getRateLimiterStats() {
  return rateLimiter.getStats();
}

/**
 * Middleware helper to apply rate limiting to API routes
 */
export function createRateLimitResponse(resetTime: number): Response {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
  
  return new Response(
    JSON.stringify({
      error: 'Too many requests. Please try again later.',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
        'X-RateLimit-Reset': new Date(resetTime).toISOString(),
      },
    }
  );
}

export default rateLimiter;
