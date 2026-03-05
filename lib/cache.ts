/**
 * In-Memory Cache Utility for Performance Optimization
 * 
 * Provides response caching for frequently accessed data:
 * - Problem data (static, rarely changes)
 * - Course content (static)
 * - Access code status (changes infrequently)
 * - User session data (semi-static)
 * 
 * Features:
 * - TTL (Time To Live) support
 * - Automatic expiration
 * - Manual invalidation
 * - Memory-efficient cleanup
 * - Type-safe generics
 * 
 * Production Note: For distributed systems, use Redis or Memcached
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries (optional)
}

/**
 * Generic cache implementation with TTL and size limits
 */
class Cache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private config: CacheConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: CacheConfig) {
    this.config = config;
    
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Get value from cache
   * @param key Cache key
   * @returns Cached value or null if expired/missing
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set value in cache with TTL
   * @param key Cache key
   * @param value Value to cache
   * @param customTTL Optional custom TTL (overrides default)
   */
  set(key: string, value: T, customTTL?: number): void {
    const ttl = customTTL || this.config.ttl;
    
    // Enforce max size if configured
    if (this.config.maxSize && this.cache.size >= this.config.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data: value,
      expiresAt: Date.now() + ttl,
    });
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete specific key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Destroy cache and cleanup
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}

/**
 * Cache configurations for different data types
 */
export const CACHE_CONFIG = {
  // Problem data: 1 hour (static content)
  PROBLEMS: { ttl: 60 * 60 * 1000, maxSize: 100 },
  
  // Course data: 1 hour (static content)
  COURSE: { ttl: 60 * 60 * 1000, maxSize: 50 },
  
  // Access code status: 5 minutes (changes occasionally)
  ACCESS_CODES: { ttl: 5 * 60 * 1000, maxSize: 10 },
  
  // User sessions: 10 minutes (semi-dynamic)
  SESSIONS: { ttl: 10 * 60 * 1000, maxSize: 500 },
  
  // AI responses: 15 minutes (for identical queries)
  AI_RESPONSES: { ttl: 15 * 60 * 1000, maxSize: 200 },
  
  // Math validation: 30 minutes (computation-heavy)
  MATH_VALIDATION: { ttl: 30 * 60 * 1000, maxSize: 1000 },
};

/**
 * Global cache instances
 */
export const problemCache = new Cache<any>(CACHE_CONFIG.PROBLEMS);
export const courseCache = new Cache<any>(CACHE_CONFIG.COURSE);
export const accessCodeCache = new Cache<any>(CACHE_CONFIG.ACCESS_CODES);
export const sessionCache = new Cache<any>(CACHE_CONFIG.SESSIONS);
export const aiResponseCache = new Cache<string>(CACHE_CONFIG.AI_RESPONSES);
export const mathValidationCache = new Cache<boolean>(CACHE_CONFIG.MATH_VALIDATION);

/**
 * Cache wrapper for async functions
 * @param key Cache key
 * @param fetcher Function to fetch data if not cached
 * @param cache Cache instance to use
 * @returns Cached or freshly fetched data
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  cache: Cache<T>
): Promise<T> {
  // Check cache first
  const cached = cache.get(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch and cache
  const data = await fetcher();
  cache.set(key, data);
  return data;
}

/**
 * Create a cache key from multiple parts
 */
export function createCacheKey(...parts: (string | number | boolean)[]): string {
  return parts.join(':');
}

/**
 * Invalidate cache entries by prefix
 * @param prefix Key prefix to match
 * @param cache Cache instance
 */
export function invalidateByPrefix<T>(prefix: string, cache: Cache<T>): number {
  let count = 0;
  const stats = cache.getStats();
  
  for (const key of stats.keys) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
      count++;
    }
  }
  
  return count;
}

/**
 * Clear all caches (useful for testing or manual refresh)
 */
export function clearAllCaches(): void {
  problemCache.clear();
  courseCache.clear();
  accessCodeCache.clear();
  sessionCache.clear();
  aiResponseCache.clear();
  mathValidationCache.clear();
}

/**
 * Get stats for all caches
 */
export function getAllCacheStats() {
  return {
    problems: problemCache.getStats(),
    course: courseCache.getStats(),
    accessCodes: accessCodeCache.getStats(),
    sessions: sessionCache.getStats(),
    aiResponses: aiResponseCache.getStats(),
    mathValidation: mathValidationCache.getStats(),
  };
}

export default Cache;
