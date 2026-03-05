# Configuration Reference

**LearnPlus Learning Platform**  
Complete Configuration & Settings Guide  
Last Updated: March 5, 2026

---

## Table of Contents

1. [Environment Variables](#environment-variables)
2. [Rate Limiting](#rate-limiting)
3. [Cache Configuration](#cache-configuration)
4. [Security Settings](#security-settings)
5. [Performance Tuning](#performance-tuning)
6. [Feature Flags](#feature-flags)
7. [API Configuration](#api-configuration)
8. [Database Settings](#database-settings)
9. [Monitoring Configuration](#monitoring-configuration)
10. [Best Practices](#best-practices)

---

## Environment Variables

### Required Variables

These variables **must** be set for the application to function:

#### Firebase Configuration (Client)

```bash
# Firebase Web App Configuration
# Get these from Firebase Console → Project Settings → General → Your apps

NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
# Purpose: API key for Firebase client SDK
# Example: AIzaSyBk3F1P2Mn5...
# Security: Public (prefix NEXT_PUBLIC_ makes it accessible in browser)

NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
# Purpose: Authentication domain for Firebase Auth
# Example: learnplus-prod.firebaseapp.com

NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
# Purpose: Firebase project identifier
# Example: learnplus-prod

NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
# Purpose: Cloud Storage bucket
# Example: learnplus-prod.appspot.com

NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
# Purpose: Messaging sender ID
# Example: 123456789012

NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
# Purpose: Unique app identifier
# Example: 1:123456789012:web:abc123def456
```

#### Firebase Configuration (Server)

```bash
# Firebase Admin SDK
FIREBASE_ADMIN_SERVICE_ACCOUNT=base64_encoded_json
# Purpose: Service account for Firebase Admin SDK (server-side)
# Format: Base64-encoded JSON of service account key
# Security: CRITICAL - Never commit to Git, keep secret
# How to generate:
#   1. Download service account JSON from Firebase Console
#   2. Base64 encode: cat service-account.json | base64 -w 0
#   3. Use encoded string as value
```

#### OpenAI Configuration

```bash
OPENAI_API_KEY=sk-...
# Purpose: API key for OpenAI GPT-4 access
# Format: Starts with "sk-"
# Example: sk-proj-abc123def456...
# Security: CRITICAL - Never commit to Git, keep secret
# Get from: https://platform.openai.com/api-keys
```

#### Admin Configuration

```bash
ADMIN_API_KEY=admin_...
# Purpose: API key for admin endpoints
# Format: Any secure random string (recommend 32+ characters)
# Security: CRITICAL - Never commit to Git, keep secret
# How to generate:
#   openssl rand -base64 32
#   OR python -c "import secrets; print(f'admin_{secrets.token_urlsafe(32)}')"
```

#### Application Configuration

```bash
NODE_ENV=production
# Purpose: Runtime environment
# Values: "development" | "production" | "test"
# Default: "development"
# Effects:
#   - Production: Enables optimizations, security features
#   - Development: Enables dev tools, verbose logging
#   - Test: Disables external services, uses mocks

NEXT_PUBLIC_APP_URL=https://yourdomain.com
# Purpose: Public URL of the application
# Format: Full URL with protocol
# Examples:
#   - Development: http://localhost:3000
#   - Production: https://learnplus.example.com
# Used for: CORS, redirects, absolute URLs
```

### Optional Variables

These variables have defaults but can be customized:

```bash
# Port (Development only)
PORT=3000
# Purpose: Port for development server
# Default: 3000
# Note: Vercel deployment ignores this

# Logging Level
LOG_LEVEL=info
# Purpose: Minimum log level to output
# Values: "debug" | "info" | "warn" | "error"
# Default: "info"

# Rate Limit Window
RATE_LIMIT_WINDOW=3600000
# Purpose: Rate limit time window in milliseconds
# Default: 3600000 (1 hour)
# Note: Override in code (lib/rate-limit.ts) for per-endpoint limits

# Session Duration
SESSION_DURATION=86400
# Purpose: Session cookie max age in seconds
# Default: 86400 (24 hours)

# Max File Upload Size
MAX_UPLOAD_SIZE=5242880
# Purpose: Maximum upload size in bytes
# Default: 5242880 (5 MB)

# CORS Allowed Origins
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
# Purpose: Comma-separated list of allowed CORS origins
# Default: NEXT_PUBLIC_APP_URL value
```

### Environment-Specific Configuration

#### Development (`.env.local`)

```bash
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
LOG_LEVEL=debug

# Use test Firebase project
NEXT_PUBLIC_FIREBASE_PROJECT_ID=learnplus-dev

# Use test OpenAI key (with lower limits)
OPENAI_API_KEY=sk-test-...

# Simpler admin key for dev
ADMIN_API_KEY=admin_dev_key_12345
```

#### Staging (`.env.staging`)

```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://staging.learnplus.com
LOG_LEVEL=info

# Use staging Firebase project
NEXT_PUBLIC_FIREBASE_PROJECT_ID=learnplus-staging

# Use staging OpenAI key
OPENAI_API_KEY=sk-staging-...

# Secure admin key
ADMIN_API_KEY=admin_staging_secure_key_here
```

#### Production (Vercel Environment Variables)

```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://learnplus.com
LOG_LEVEL=warn

# Use production Firebase project
NEXT_PUBLIC_FIREBASE_PROJECT_ID=learnplus-prod

# Use production OpenAI key
OPENAI_API_KEY=sk-prod-...

# Highly secure admin key
ADMIN_API_KEY=admin_prod_very_secure_key_here
```

---

## Rate Limiting

### Configuration Location

`lib/rate-limit.ts`

### Default Limits

```typescript
export const RATE_LIMITS = {
  // Authentication endpoints
  VERIFY_CODE: {
    limit: 10,        // 10 requests
    window: 3600000   // per hour (3,600,000 ms)
  },

  // AI Chat endpoint
  CHAT: {
    limit: 30,        // 30 requests
    window: 3600000   // per hour
  },

  // Answer validation endpoint
  VALIDATE: {
    limit: 20,        // 20 requests
    window: 3600000   // per hour
  },

  // Event logging endpoint
  LOG_EVENT: {
    limit: 100,       // 100 requests
    window: 3600000   // per hour
  },

  // Survey submission endpoint
  SURVEY: {
    limit: 5,         // 5 requests
    window: 3600000   // per hour
  },

  // Admin endpoints
  ADMIN: {
    limit: 10,        // 10 requests
    window: 3600000   // per hour
  }
};
```

### Customizing Rate Limits

Edit `lib/rate-limit.ts`:

```typescript
// Example: Increase chat limit for production
export const RATE_LIMITS = {
  CHAT: {
    limit: process.env.NODE_ENV === 'production' ? 60 : 30,
    window: 3600000
  }
};
```

### Rate Limit Headers

API responses include rate limit information:

```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 27
X-RateLimit-Reset: 1709654400000
```

### Implementation

```typescript
// lib/rate-limit.ts
import { LRUCache } from 'lru-cache';

const rateLimitCache = new LRUCache<string, number[]>({
  max: 500,  // Maximum cache entries
  ttl: 3600000  // 1 hour TTL
});

export async function checkRateLimit(
  identifier: string,
  endpoint: keyof typeof RATE_LIMITS
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  const config = RATE_LIMITS[endpoint];
  const key = `${endpoint}:${identifier}`;
  
  const now = Date.now();
  const windowStart = now - config.window;
  
  // Get existing requests
  const requests = rateLimitCache.get(key) || [];
  
  // Filter requests within window
  const recentRequests = requests.filter(time => time > windowStart);
  
  // Check if limit exceeded
  const allowed = recentRequests.length < config.limit;
  
  if (allowed) {
    // Add current request
    recentRequests.push(now);
    rateLimitCache.set(key, recentRequests);
  }
  
  return {
    allowed,
    remaining: Math.max(0, config.limit - recentRequests.length),
    reset: now + config.window
  };
}
```

---

## Cache Configuration

### Problem Cache

**Purpose:** Cache problem definitions to reduce database reads

**Location:** `lib/problem-data.ts`

**Configuration:**

```typescript
const problemCache = new Map<string, Problem>();

// Cache problems on first access
export async function getProblem(id: string): Promise<Problem> {
  if (problemCache.has(id)) {
    return problemCache.get(id)!;
  }
  
  const problem = await loadProblemFromDB(id);
  problemCache.set(id, problem);
  return problem;
}

// Clear cache (if needed)
export function clearProblemCache() {
  problemCache.clear();
}
```

**Best Practices:**
- Problems are static, so cache indefinitely
- Clear cache only when problems are updated
- No TTL needed for problem data

### Session Cache

**Purpose:** Cache user sessions to reduce database lookups

**Location:** `lib/auth.ts`

**Configuration:**

```typescript
const sessionCache = new LRUCache<string, UserSession>({
  max: 500,        // Cache up to 500 sessions
  ttl: 300000      // 5 minute TTL
});

export async function getUserSession(userId: string): Promise<UserSession | null> {
  // Check cache first
  if (sessionCache.has(userId)) {
    return sessionCache.get(userId)!;
  }
  
  // Load from database
  const session = await loadSessionFromDB(userId);
  if (session) {
    sessionCache.set(userId, session);
  }
  
  return session;
}
```

**Configuration Options:**
- `max`: Maximum cached sessions (adjust based on concurrent users)
- `ttl`: Time-to-live in milliseconds (balance freshness vs performance)

### Response Cache

**Purpose:** Cache API responses for frequently accessed data

**Not Currently Implemented** - Can be added if needed:

```typescript
// lib/cache.ts
import { LRUCache } from 'lru-cache';

const responseCache = new LRUCache<string, any>({
  max: 100,
  ttl: 60000  // 1 minute
});

export function cacheResponse(key: string, data: any) {
  responseCache.set(key, data);
}

export function getCachedResponse(key: string): any | undefined {
  return responseCache.get(key);
}
```

---

## Security Settings

### Security Headers

**Location:** `middleware.ts` and `next.config.mjs`

#### Content Security Policy

```typescript
// middleware.ts
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' https://*.googleapis.com https://*.openai.com;
  frame-ancestors 'none';
`;

response.headers.set('Content-Security-Policy', cspHeader.replace(/\s{2,}/g, ' ').trim());
```

**Customization:**
- `script-src`: Add trusted script sources
- `connect-src`: Add trusted API endpoints
- Avoid `'unsafe-eval'` and `'unsafe-inline'` if possible

#### Additional Security Headers

```typescript
// next.config.mjs
headers: [
  {
    source: '/(.*)',
    headers: [
      {
        key: 'X-Frame-Options',
        value: 'DENY'  // Prevent clickjacking
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff'  // Prevent MIME sniffing
      },
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block'  // Enable XSS filter
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin'
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()'
      }
    ]
  }
]
```

### Cookie Configuration

**Location:** `middleware.ts`

```typescript
// Set secure cookie
cookies().set('session', userId, {
  httpOnly: true,              // Prevent JavaScript access
  secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
  sameSite: 'lax',             // CSRF protection
  maxAge: 60 * 60 * 24,        // 24 hours
  path: '/'                    // Available site-wide
});
```

**Options:**
- `httpOnly: true` - **Always** keep this enabled
- `secure: true` - Enable in production (requires HTTPS)
- `sameSite`: Use `'lax'` or `'strict'` for CSRF protection
- `maxAge`: Session duration in seconds

### CORS Configuration

**Location:** `next.config.mjs`

```typescript
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        {
          key: 'Access-Control-Allow-Origin',
          value: process.env.NEXT_PUBLIC_APP_URL || '*'
        },
        {
          key: 'Access-Control-Allow-Methods',
          value: 'GET, POST, PUT, DELETE, OPTIONS'
        },
        {
          key: 'Access-Control-Allow-Headers',
          value: 'Content-Type, Authorization, x-admin-key'
        },
        {
          key: 'Access-Control-Allow-Credentials',
          value: 'true'
        }
      ]
    }
  ];
}
```

**Security Tips:**
- Never use `*` for `Access-Control-Allow-Origin` in production
- Only allow necessary HTTP methods
- Limit allowed headers to what's needed
- Enable credentials only if necessary

---

## Performance Tuning

### Next.js Configuration

**Location:** `next.config.mjs`

```javascript
const nextConfig = {
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  
  // Output optimization
  output: 'standalone',  // For Docker/containerization
  
  // Image optimization
  images: {
    domains: ['yourdomain.com'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60
  },
  
  // Experimental features
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons']
  }
};
```

### Vercel Configuration

**Location:** `vercel.json`

```json
{
  "regions": ["iad1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 10,
      "memory": 1024
    },
    "app/api/chat/**/*.ts": {
      "maxDuration": 30
    }
  },
  "crons": []
}
```

**Options:**
- `regions`: Deploy to specific regions for lower latency
- `maxDuration`: Function timeout (Pro plan required for >10s)
- `memory`: Allocated memory (256, 512, 1024, 3008 MB)

### Database Optimization

#### Firestore Indexes

**Location:** `firestore.indexes.json`

```json
{
  "indexes": [
    {
      "collectionGroup": "events",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    }
  ]
}
```

Deploy indexes:
```bash
firebase deploy --only firestore:indexes
```

#### Query Optimization

```typescript
// ❌ Bad - No index, reads all documents
db.collection('events').get();

// ✅ Good - Uses index, limited results
db.collection('events')
  .where('userId', '==', userId)
  .orderBy('timestamp', 'desc')
  .limit(100)
  .get();
```

### Client-Side Optimization

```typescript
// Code splitting
const ChatPanel = dynamic(() => import('@/components/chat-panel'), {
  loading: () => <LoadingSpinner />
});

// Lazy loading
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// Memoization
const expensiveValue = useMemo(() => computeExpensiveValue(input), [input]);
const memoizedCallback = useCallback(() => doSomething(a, b), [a, b]);
```

---

## Feature Flags

### Current Feature Flags

**Location:** `lib/feature-flags.ts`

```typescript
export const FEATURE_FLAGS = {
  // Enable AI chat (AI-Assisted mode only)
  AI_CHAT_ENABLED: true,
  
  // Enable survey modal
  SURVEY_ENABLED: true,
  
  // Enable event logging
  EVENT_LOGGING_ENABLED: true,
  
  // Enable admin endpoints
  ADMIN_ENDPOINTS_ENABLED: true,
  
  // Enable monitoring
  MONITORING_ENABLED: true,
  
  // Maintenance mode
  MAINTENANCE_MODE: false
};
```

### Usage

```typescript
import { FEATURE_FLAGS } from '@/lib/feature-flags';

if (FEATURE_FLAGS.AI_CHAT_ENABLED && user.mode === 'ai_assisted') {
  return <ChatPanel />;
}
```

### Environment-Based Flags

```typescript
export const FEATURE_FLAGS = {
  AI_CHAT_ENABLED: process.env.NODE_ENV === 'production',
  DEBUG_MODE: process.env.NODE_ENV === 'development',
  ANALYTICS_ENABLED: process.env.NODE_ENV === 'production'
};
```

---

## API Configuration

### OpenAI Settings

**Location:** `app/api/chat/route.ts`

```typescript
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,  // 30 second timeout
  maxRetries: 2    // Retry failed requests twice
});

// Model configuration
const MODEL = 'gpt-4o-mini';
const MAX_TOKENS = 500;
const TEMPERATURE = 0.7;

// Request options
const completion = await openai.chat.completions.create({
  model: MODEL,
  messages: conversationHistory,
  max_tokens: MAX_TOKENS,
  temperature: TEMPERATURE,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0
});
```

**Configuration Options:**
- `model`: AI model to use (`gpt-4o-mini`, `gpt-4o`, `gpt-3.5-turbo`)
- `max_tokens`: Maximum response length (lower = faster + cheaper)
- `temperature`: Creativity (0 = deterministic, 1 = creative)
- `timeout`: Request timeout in milliseconds
- `maxRetries`: Number of retry attempts

### Firebase Settings

**Location:** `lib/firebase.ts`

```typescript
// Client SDK
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Admin SDK
const adminApp = initializeApp({
  credential: cert(serviceAccount),
  databaseURL: `https://${projectId}.firebaseio.com`
});
```

---

## Database Settings

### Firestore Security Rules

**Location:** `firestore.rules`

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Apply rules to collections
    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }
    
    match /events/{eventId} {
      allow create: if isAuthenticated();
      allow read, update, delete: if false;
    }
  }
}
```

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

---

## Monitoring Configuration

### Health Check Settings

**Location:** `app/api/health/route.ts`

```typescript
const HEALTH_CHECK_CONFIG = {
  checkDatabase: true,
  checkOpenAI: true,
  checkFirebase: true,
  timeout: 5000  // 5 second timeout
};
```

### Monitoring Endpoint

**Location:** `app/api/admin/monitoring/route.ts`

```typescript
const MONITORING_CONFIG = {
  timeWindow: 24 * 60 * 60 * 1000,  // 24 hours
  maxErrors: 100,
  errorThreshold: 0.05,  // 5% error rate threshold
  slowResponseThreshold: 1000  // 1 second
};
```

---

## Best Practices

### Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **Rotate keys regularly** - Change API keys every 3-6 months
3. **Use HTTPS** - Always in production
4. **Enable security headers** - See security settings above
5. **Validate all inputs** - Never trust user input
6. **Implement rate limiting** - Prevent abuse
7. **Log security events** - Monitor for suspicious activity

### Performance Best Practices

1. **Use caching** - Cache static data (problems, etc.)
2. **Optimize queries** - Use indexes, limit results
3. **Code splitting** - Lazy load heavy components
4. **Compress responses** - Enable gzip compression
5. **Use CDN** - Vercel provides this automatically
6. **Monitor performance** - Track response times

### Configuration Best Practices

1. **Use environment-specific configs** - Dev vs staging vs production
2. **Document all variables** - Explain purpose and format
3. **Validate configurations** - Check for missing/invalid values
4. **Version control configs** - Track changes over time
5. **Test configuration changes** - In staging before production

### Deployment Best Practices

1. **Test locally first** - `pnpm dev` and `pnpm build`
2. **Run tests** - `pnpm test` before deploying
3. **Deploy to staging** - Test in staging environment
4. **Monitor after deployment** - Watch for errors
5. **Have rollback plan** - Know how to revert quickly

---

## Environment Variable Checklist

Before deploying, verify all required variables are set:

**Firebase (Client)**
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`

**Firebase (Server)**
- [ ] `FIREBASE_ADMIN_SERVICE_ACCOUNT`

**External Services**
- [ ] `OPENAI_API_KEY`

**Application**
- [ ] `ADMIN_API_KEY`
- [ ] `NODE_ENV`
- [ ] `NEXT_PUBLIC_APP_URL`

**Verification Commands:**

```bash
# Local
source .env.local
./verify-env.sh

# Vercel
vercel env ls
```

---

**Configuration Reference Version:** 1.0.0  
**Last Updated:** March 5, 2026  
**Platform Version:** 1.0.0
