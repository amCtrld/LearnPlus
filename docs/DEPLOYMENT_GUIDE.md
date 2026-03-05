# Deployment Guide

**LearnPlus Learning Platform**  
Production Deployment Guide  
Last Updated: March 5, 2026

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Firebase Setup](#firebase-setup)
3. [Environment Configuration](#environment-configuration)
4. [Vercel Deployment](#vercel-deployment)
5. [Database Initialization](#database-initialization)
6. [Security Configuration](#security-configuration)
7. [Domain & SSL Setup](#domain--ssl-setup)
8. [Post-Deployment Verification](#post-deployment-verification)
9. [Monitoring Setup](#monitoring-setup)
10. [Rollback Procedures](#rollback-procedures)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- ✅ Node.js 18.x or higher
- ✅ pnpm package manager
- ✅ Vercel account (free or paid)
- ✅ Firebase account with Blaze (Pay as you go) plan
- ✅ OpenAI API account with API key
- ✅ Git repository (GitHub, GitLab, or Bitbucket)
- ✅ Domain name (optional, but recommended)

### Required Access Levels

- **Firebase:** Owner or Editor role
- **Vercel:** Owner or Admin role
- **OpenAI:** API key with GPT-4 access

---

## Firebase Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"** or **"Add project"**
3. Enter project name: `learnplus-production`
4. Enable Google Analytics (recommended)
5. Click **"Create project"**

### Step 2: Enable Authentication

1. In Firebase Console, navigate to **Authentication**
2. Click **"Get started"**
3. Go to **Settings** → **Users** → **Advanced settings**
4. Enable **"Email enumeration protection"** (recommended)

### Step 3: Create Firestore Database

1. Navigate to **Firestore Database**
2. Click **"Create database"**
3. Select **Production mode**
4. Choose location closest to your users:
   - `us-central1` (North America)
   - `europe-west1` (Europe)
   - `asia-northeast1` (Asia)
5. Click **"Enable"**

### Step 4: Configure Firestore Security Rules

1. Go to **Firestore Database** → **Rules**
2. Replace with the following rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the document
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Users collection - users can only read/write their own data
    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }
    
    // Access codes collection - read only with valid auth
    match /accessCodes/{codeId} {
      allow read: if isAuthenticated();
      allow write: if false; // Only admin SDK can write
    }
    
    // User progress collection - users can read/write their own progress
    match /userProgress/{userId} {
      allow read, write: if isOwner(userId);
    }
    
    // Events collection - users can write their own events
    match /events/{eventId} {
      allow read: if false; // No read access
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update, delete: if false;
    }
    
    // Surveys collection - users can create their own surveys
    match /surveys/{surveyId} {
      allow read: if false; // No read access
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update, delete: if false;
    }
    
    // Chat logs collection - users can read/write their own chat logs
    match /chatLogs/{userId} {
      allow read, write: if isOwner(userId);
    }
    
    // Monitoring collection - no client access
    match /monitoring/{document=**} {
      allow read, write: if false; // Only admin SDK
    }
    
    // Block all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Click **"Publish"**

### Step 5: Create Firestore Indexes

Create composite indexes for efficient queries:

1. Go to **Firestore Database** → **Indexes**
2. Create the following indexes:

**Index 1: Events by User and Timestamp**
- Collection: `events`
- Fields:
  - `userId` (Ascending)
  - `timestamp` (Descending)

**Index 2: Access Codes by Status**
- Collection: `accessCodes`
- Fields:
  - `used` (Ascending)
  - `createdAt` (Descending)

**Index 3: User Progress by User and Problem**
- Collection: `userProgress`
- Fields:
  - `userId` (Ascending)
  - `problemId` (Ascending)
  - `lastUpdated` (Descending)

Or use the Firebase CLI to deploy indexes:

```bash
# Create firestore.indexes.json
cat > firestore.indexes.json << 'EOF'
{
  "indexes": [
    {
      "collectionGroup": "events",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "accessCodes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "used", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "userProgress",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "problemId", "order": "ASCENDING" },
        { "fieldPath": "lastUpdated", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
EOF

# Deploy indexes
firebase deploy --only firestore:indexes
```

### Step 6: Get Firebase Credentials

**Web App Credentials:**

1. Go to **Project Settings** → **General**
2. Scroll to **Your apps** section
3. Click **Add app** → Select **Web** (</>)
4. Register app with nickname: `learnplus-web`
5. Copy the Firebase config object:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "learnplus-production.firebaseapp.com",
  projectId: "learnplus-production",
  storageBucket: "learnplus-production.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

**Admin SDK Credentials:**

1. Go to **Project Settings** → **Service accounts**
2. Click **"Generate new private key"**
3. Save the JSON file securely (DO NOT commit to Git)
4. The file contains:

```json
{
  "type": "service_account",
  "project_id": "learnplus-production",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-...@learnplus-production.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-..."
}
```

---

## Environment Configuration

### Step 1: Create Environment File

Create `.env.local` file in project root:

```bash
# Firebase Web Config (from Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=learnplus-production.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=learnplus-production
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=learnplus-production.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Firebase Admin SDK (base64 encoded service account JSON)
FIREBASE_ADMIN_SERVICE_ACCOUNT=base64_encoded_json_here

# OpenAI API
OPENAI_API_KEY=sk-...

# Admin API Key (generate a strong random key)
ADMIN_API_KEY=admin_your_very_secure_random_key_here

# Environment
NODE_ENV=production

# Next.js Configuration
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Step 2: Encode Firebase Service Account

The Firebase Admin service account JSON must be base64 encoded:

**On Linux/Mac:**
```bash
cat firebase-service-account.json | base64 -w 0 > encoded.txt
```

**On Windows (PowerShell):**
```powershell
[Convert]::ToBase64String([System.IO.File]::ReadAllBytes("firebase-service-account.json")) > encoded.txt
```

**Using Node.js:**
```javascript
const fs = require('fs');
const serviceAccount = fs.readFileSync('firebase-service-account.json');
const encoded = Buffer.from(serviceAccount).toString('base64');
console.log(encoded);
```

Copy the encoded string and use it as the value for `FIREBASE_ADMIN_SERVICE_ACCOUNT`.

### Step 3: Generate Admin API Key

Generate a secure random API key:

**Using OpenSSL:**
```bash
openssl rand -base64 32
```

**Using Node.js:**
```javascript
const crypto = require('crypto');
const apiKey = crypto.randomBytes(32).toString('base64');
console.log(`admin_${apiKey}`);
```

**Using Python:**
```python
import secrets
api_key = f"admin_{secrets.token_urlsafe(32)}"
print(api_key)
```

Store this key securely - you'll need it for admin operations.

### Step 4: Verify Environment Variables

Create a verification script:

```bash
# verify-env.sh
#!/bin/bash

echo "Verifying environment variables..."

# Check required variables
REQUIRED_VARS=(
  "NEXT_PUBLIC_FIREBASE_API_KEY"
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
  "FIREBASE_ADMIN_SERVICE_ACCOUNT"
  "OPENAI_API_KEY"
  "ADMIN_API_KEY"
)

for VAR in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!VAR}" ]; then
    echo "❌ Missing: $VAR"
    exit 1
  else
    echo "✅ Found: $VAR"
  fi
done

echo "All required environment variables are set!"
```

Run it:
```bash
chmod +x verify-env.sh
source .env.local
./verify-env.sh
```

---

## Vercel Deployment

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Link Project to Vercel

From your project directory:

```bash
vercel link
```

Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? Select your account/team
- Link to existing project? **No** (first deployment)
- What's your project's name? `learnplus`
- In which directory is your code located? `./`

### Step 4: Configure Environment Variables

Add environment variables to Vercel:

```bash
# Add Firebase Web Config
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production

# Add Firebase Admin SDK (paste base64 encoded JSON)
vercel env add FIREBASE_ADMIN_SERVICE_ACCOUNT production

# Add OpenAI API Key
vercel env add OPENAI_API_KEY production

# Add Admin API Key
vercel env add ADMIN_API_KEY production

# Add App URL (will update after deployment)
vercel env add NEXT_PUBLIC_APP_URL production
```

Or use the Vercel Dashboard:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable with:
   - **Key:** Variable name
   - **Value:** Variable value
   - **Environment:** Production (and Preview if needed)
5. Click **Save**

### Step 5: Deploy to Production

**Option A: Deploy from CLI**

```bash
# Production deployment
vercel --prod
```

**Option B: Deploy from Git**

1. Push code to your Git repository:
```bash
git add .
git commit -m "Production deployment"
git push origin main
```

2. Vercel will automatically deploy from the `main` branch

**Option C: Deploy from Vercel Dashboard**

1. Go to Vercel Dashboard
2. Click **"Import Project"**
3. Import your Git repository
4. Configure build settings:
   - **Framework Preset:** Next.js
   - **Build Command:** `pnpm build`
   - **Output Directory:** `.next`
   - **Install Command:** `pnpm install`
5. Add environment variables
6. Click **"Deploy"**

### Step 6: Configure Build Settings

In `vercel.json`:

```json
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 10
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ]
}
```

### Step 7: Monitor Deployment

Watch the deployment progress:

```bash
vercel logs --follow
```

Or in the Vercel Dashboard:
1. Go to your project
2. Click on the deployment
3. View **Build Logs** and **Function Logs**

---

## Database Initialization

### Step 1: Create Initial Collections

Run the database initialization script:

```typescript
// scripts/init-database.ts
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT!, 'base64').toString()
);

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function initializeDatabase() {
  console.log('Initializing database...');

  // Create monitoring collection with initial document
  await db.collection('monitoring').doc('system').set({
    initialized: true,
    createdAt: new Date(),
    version: '1.0.0',
  });

  // Create initial settings document
  await db.collection('settings').doc('app').set({
    maintenanceMode: false,
    maxUsersPerCode: 1,
    surveyEnabled: true,
    createdAt: new Date(),
  });

  console.log('✅ Database initialized successfully!');
}

initializeDatabase().catch(console.error);
```

Run it:

```bash
# Install ts-node if not already installed
pnpm add -D ts-node

# Run the script
FIREBASE_ADMIN_SERVICE_ACCOUNT="$(cat encoded.txt)" \
  npx ts-node scripts/init-database.ts
```

### Step 2: Verify Database Structure

Check that collections were created:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# List collections
firebase firestore:get / --project learnplus-production
```

---

## Security Configuration

### Step 1: Configure CORS

In `next.config.mjs`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_APP_URL },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-admin-key' },
        ],
      },
    ];
  },
};

export default nextConfig;
```

### Step 2: Configure Rate Limiting

Rate limiting is configured in `lib/rate-limit.ts`. No additional setup needed, but you can adjust limits:

```typescript
// lib/rate-limit.ts
export const RATE_LIMITS = {
  VERIFY_CODE: { limit: 10, window: 3600000 }, // 10 per hour
  CHAT: { limit: 30, window: 3600000 },        // 30 per hour
  VALIDATE: { limit: 20, window: 3600000 },    // 20 per hour
  LOG_EVENT: { limit: 100, window: 3600000 },  // 100 per hour
  SURVEY: { limit: 5, window: 3600000 },       // 5 per hour
  ADMIN: { limit: 10, window: 3600000 },       // 10 per hour
};
```

### Step 3: Configure Content Security Policy

Add CSP headers in `middleware.ts`:

```typescript
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.googleapis.com https://*.openai.com",
      "frame-ancestors 'none'",
    ].join('; ')
  );
  
  return response;
}
```

### Step 4: Rotate Admin API Key

Store the admin API key securely and rotate it regularly:

```bash
# Generate new key
NEW_KEY=$(openssl rand -base64 32)

# Update in Vercel
vercel env rm ADMIN_API_KEY production
vercel env add ADMIN_API_KEY production
# Paste new key when prompted

# Redeploy
vercel --prod
```

---

## Domain & SSL Setup

### Step 1: Add Custom Domain

**Via Vercel Dashboard:**

1. Go to **Settings** → **Domains**
2. Enter your domain: `yourdomain.com`
3. Click **Add**
4. Follow DNS configuration instructions

**Via Vercel CLI:**

```bash
vercel domains add yourdomain.com
```

### Step 2: Configure DNS

Add DNS records with your domain provider:

**For root domain (yourdomain.com):**
- Type: `A`
- Name: `@`
- Value: `76.76.21.21` (Vercel's IP)

**For www subdomain:**
- Type: `CNAME`
- Name: `www`
- Value: `cname.vercel-dns.com`

**Alternatively, use Vercel nameservers:**

Update your domain's nameservers to:
- `ns1.vercel-dns.com`
- `ns2.vercel-dns.com`

### Step 3: SSL Certificate

Vercel automatically provisions SSL certificates via Let's Encrypt.

Wait 24-48 hours for DNS propagation, then verify:

```bash
curl -I https://yourdomain.com
```

Look for:
```
HTTP/2 200
strict-transport-security: max-age=63072000
```

### Step 4: Update Environment Variables

Update the app URL:

```bash
vercel env rm NEXT_PUBLIC_APP_URL production
vercel env add NEXT_PUBLIC_APP_URL production
# Enter: https://yourdomain.com

vercel --prod
```

### Step 5: Configure Firebase Auth Domain

1. Go to Firebase Console → **Authentication** → **Settings**
2. Click **Authorized domains**
3. Add your domain: `yourdomain.com`
4. Save changes

---

## Post-Deployment Verification

### Step 1: Health Check

```bash
curl https://yourdomain.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-03-05T10:30:00.000Z",
  "uptime": 0,
  "checks": {
    "api": { "status": "healthy", "responseTime": 12 },
    "database": { "status": "healthy", "responseTime": 45 },
    "openai": { "status": "configured", "configured": true },
    "firebase": { "status": "configured", "configured": true }
  },
  "version": "1.0.0"
}
```

### Step 2: Test Access Code Generation

```bash
curl -X POST https://yourdomain.com/api/admin/generate-access-codes \
  -H "Content-Type: application/json" \
  -H "x-admin-key: YOUR_ADMIN_KEY" \
  -d '{"count":5,"mode":"ai_assisted"}'
```

### Step 3: Test User Flow

1. Visit `https://yourdomain.com`
2. Enter an access code
3. Complete a problem
4. Submit survey
5. Verify data in Firestore

### Step 4: Run Automated Tests

```bash
# Update base URL
export BASE_URL=https://yourdomain.com

# Run E2E tests
pnpm test:e2e

# Run load tests
k6 run k6-tests/smoke-test.js
```

### Step 5: Check Monitoring

Visit the admin monitoring endpoint:

```bash
curl -H "x-admin-key: YOUR_ADMIN_KEY" \
  https://yourdomain.com/api/admin/monitoring
```

### Verification Checklist

- [ ] Health check returns "healthy"
- [ ] Homepage loads correctly
- [ ] Access code verification works
- [ ] AI chat responds (AI mode)
- [ ] Answer validation works
- [ ] Event logging works
- [ ] Survey submission works
- [ ] Admin endpoints work
- [ ] SSL certificate is valid
- [ ] Custom domain works
- [ ] Security headers present
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Performance acceptable (<3s load)

---

## Monitoring Setup

### Step 1: Configure Vercel Analytics

Enable Vercel Analytics:

1. Go to Vercel Dashboard → **Analytics**
2. Click **Enable**
3. Install package:
```bash
pnpm add @vercel/analytics
```

4. Add to `app/layout.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Step 2: Set Up Alerts

Create alert rules in Vercel:

1. Go to **Settings** → **Integrations**
2. Add **Slack** or **Email** notification
3. Configure alerts for:
   - Deployment failures
   - High error rates (>5%)
   - Slow response times (>2s)
   - 4xx/5xx status codes

### Step 3: Configure Uptime Monitoring

Use external monitoring service (recommended):

**Option A: UptimeRobot (Free)**
1. Go to [UptimeRobot](https://uptimerobot.com)
2. Add monitor:
   - Type: HTTPS
   - URL: `https://yourdomain.com/api/health`
   - Interval: 5 minutes
3. Add alert contacts

**Option B: Better Uptime (Paid)**
1. Go to [Better Uptime](https://betteruptime.com)
2. Add monitor for your domain
3. Configure incident management

### Step 4: Log Aggregation

View logs in Vercel Dashboard:
- **Function Logs:** Real-time API logs
- **Build Logs:** Deployment logs
- **Error Logs:** Runtime errors

Or use external service like **Datadog** or **Sentry**.

---

## Rollback Procedures

### Option 1: Instant Rollback (Vercel)

If deployment fails or has issues:

```bash
# List recent deployments
vercel ls

# Rollback to specific deployment
vercel rollback [deployment-url]
```

Or via Dashboard:
1. Go to **Deployments**
2. Find previous working deployment
3. Click **"︙"** → **"Promote to Production"**

### Option 2: Git Revert

```bash
# Revert last commit
git revert HEAD
git push origin main

# Vercel auto-deploys the revert
```

### Option 3: Emergency Maintenance Mode

Enable maintenance mode:

1. Update Firestore settings:
```typescript
db.collection('settings').doc('app').update({
  maintenanceMode: true
});
```

2. Check in `middleware.ts`:
```typescript
// Redirect all traffic to maintenance page
if (settings.maintenanceMode && !request.nextUrl.pathname.startsWith('/maintenance')) {
  return NextResponse.redirect(new URL('/maintenance', request.url));
}
```

---

## Troubleshooting

### Issue: Environment Variables Not Loading

**Symptoms:** API errors, missing configuration

**Solution:**
```bash
# Verify variables are set
vercel env ls

# Pull variables locally
vercel env pull .env.local

# Redeploy
vercel --prod
```

### Issue: Firebase Connection Failed

**Symptoms:** "Failed to initialize Firebase" error

**Solution:**
1. Verify service account is correctly base64 encoded
2. Check Firebase project ID matches
3. Ensure Firestore is enabled
4. Check security rules allow admin access

```bash
# Test Firebase connection
npx ts-node -e "
import { initializeApp, cert } from 'firebase-admin/app';
const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT, 'base64').toString()
);
initializeApp({ credential: cert(serviceAccount) });
console.log('✅ Firebase connected!');
"
```

### Issue: OpenAI API Errors

**Symptoms:** Chat not working, 500 errors

**Solution:**
1. Verify API key is valid
2. Check OpenAI account has credits
3. Verify model access (GPT-4o-mini)
4. Check rate limits

```bash
# Test OpenAI connection
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Issue: High Response Times

**Symptoms:** Slow page loads, timeouts

**Solution:**
1. Check Vercel function region matches Firebase region
2. Enable caching for static assets
3. Optimize database queries
4. Check OpenAI API latency

```bash
# Check function performance
vercel logs --follow | grep "Duration:"
```

### Issue: SSL Certificate Not Provisioning

**Symptoms:** "Not Secure" warning, HTTPS not working

**Solution:**
1. Wait 24-48 hours for DNS propagation
2. Verify DNS records are correct
3. Check domain is verified in Vercel
4. Contact Vercel support if issue persists

```bash
# Check DNS propagation
dig yourdomain.com +short

# Check SSL certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

### Issue: Rate Limiting Too Aggressive

**Symptoms:** Users getting "Too Many Requests" errors

**Solution:**
1. Adjust rate limits in `lib/rate-limit.ts`
2. Increase limits for specific endpoints
3. Implement per-user rate limiting instead of IP-based

```typescript
// Increase chat limit from 30 to 60
CHAT: { limit: 60, window: 3600000 }
```

---

## Production Checklist

Before going live, verify:

### Infrastructure
- [ ] Firebase project created and configured
- [ ] Firestore security rules deployed
- [ ] Firestore indexes created
- [ ] Vercel project deployed
- [ ] Environment variables configured
- [ ] Custom domain connected
- [ ] SSL certificate active

### Security
- [ ] Admin API key generated and secured
- [ ] Firebase service account secured
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] CORS configured correctly
- [ ] CSP headers set

### Functionality
- [ ] Health check passes
- [ ] Access code generation works
- [ ] User authentication works
- [ ] AI chat responds correctly
- [ ] Answer validation works
- [ ] Event logging works
- [ ] Survey submission works
- [ ] Admin endpoints secured

### Performance
- [ ] Page load time <3s
- [ ] API response time <1s
- [ ] Caching configured
- [ ] CDN enabled (Vercel default)

### Monitoring
- [ ] Uptime monitoring configured
- [ ] Error tracking enabled
- [ ] Analytics installed
- [ ] Alerts configured
- [ ] Log aggregation set up

### Documentation
- [ ] API documentation reviewed
- [ ] Admin manual created
- [ ] Troubleshooting guide available
- [ ] Emergency procedures documented

---

## Support

### Need Help?

- **Documentation:** See `/docs` folder
- **Troubleshooting:** See `TROUBLESHOOTING.md`
- **API Reference:** See `API_DOCUMENTATION.md`
- **Security:** See `SECURITY_TESTING_GUIDE.md`

### Emergency Contacts

- **Vercel Support:** https://vercel.com/support
- **Firebase Support:** https://firebase.google.com/support
- **OpenAI Support:** https://help.openai.com

---

**Deployment Guide Version:** 1.0.0  
**Last Updated:** March 5, 2026  
**Platform Version:** 1.0.0
