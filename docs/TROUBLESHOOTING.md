# Troubleshooting Guide

**LearnPlus Learning Platform**  
Comprehensive Troubleshooting & FAQ Guide  
Last Updated: March 5, 2026

---

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Common Issues](#common-issues)
3. [Error Messages](#error-messages)
4. [Component-Specific Issues](#component-specific-issues)
5. [Performance Issues](#performance-issues)
6. [Debug Procedures](#debug-procedures)
7. [FAQ](#faq)
8. [Known Limitations](#known-limitations)
9. [Getting Support](#getting-support)

---

## Quick Diagnostics

### System Health Check

Run this quick diagnostic to identify issues:

```bash
# 1. Check system health
curl https://yourdomain.com/api/health | jq

# 2. Check environment variables
vercel env ls

# 3. Check recent errors
vercel logs --follow | grep -i error

# 4. Check Firebase status
curl -I https://firebase.googleapis.com

# 5. Check OpenAI status
curl https://status.openai.com/api/v2/status.json | jq .status.indicator
```

### Health Status Meanings

- 🟢 **Healthy**: All systems operational
- 🟡 **Degraded**: Functional but slow/minor issues
- 🔴 **Unhealthy**: Critical issues, system down

---

## Common Issues

### 1. Application Won't Load

**Symptoms:**
- White screen
- "Application Error" message
- Page won't load

**Diagnosis:**
```bash
# Check deployment status
vercel ls

# Check for build errors
vercel logs [deployment-url]

# Check DNS
dig yourdomain.com +short
```

**Solutions:**

#### A. Recent Deployment Failed
```bash
# Rollback to previous version
vercel rollback
```

#### B. DNS Issues
- Wait 24-48 hours for DNS propagation
- Clear DNS cache: `sudo systemd-resolve --flush-caches` (Linux)
- Test with different DNS: `nslookup yourdomain.com 8.8.8.8`

#### C. Build Error
```bash
# Check build logs
vercel logs [deployment-url] | grep -A 10 "Build Error"

# Common fixes:
# - Fix TypeScript errors
# - Update dependencies
# - Check environment variables
```

---

### 2. Access Codes Not Working

**Symptoms:**
- "Invalid access code" error
- Code already used but shouldn't be
- User can't log in

**Diagnosis:**
```bash
# Check specific code status
curl -H "x-admin-key: YOUR_KEY" \
  "https://yourdomain.com/api/admin/access-code-status?code=ABCD-1234" | jq
```

**Solutions:**

#### A. Code Not Found
- Code may not exist in database
- Generate new code for user
```bash
curl -X POST https://yourdomain.com/api/admin/generate-access-codes \
  -H "Content-Type: application/json" \
  -H "x-admin-key: YOUR_KEY" \
  -d '{"count":1,"mode":"ai_assisted"}'
```

#### B. Code Already Used
- Each code can only be used once
- If user needs new attempt, generate new code
- Check if user has existing session

#### C. Code Expired
- Check `expiresAt` field
- Generate new code with longer expiration
```bash
curl -X POST https://yourdomain.com/api/admin/generate-access-codes \
  -H "Content-Type: application/json" \
  -H "x-admin-key: YOUR_KEY" \
  -d '{"count":1,"mode":"ai_assisted","expiresIn":60}'
```

#### D. Database Connection Issue
```bash
# Test Firebase connection
firebase projects:list

# Check Firestore rules
firebase firestore:rules
```

---

### 3. AI Chat Not Responding

**Symptoms:**
- Chat messages not sending
- No AI responses
- "AI is unavailable" error

**Diagnosis:**
```bash
# Check OpenAI API status
curl https://status.openai.com/api/v2/status.json | jq

# Test API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Check recent chat errors
vercel logs --follow | grep chat
```

**Solutions:**

#### A. OpenAI Service Down
- Check https://status.openai.com
- Wait for service restoration
- Display maintenance message to users

#### B. Invalid API Key
```bash
# Verify key in Vercel
vercel env ls | grep OPENAI_API_KEY

# Update if needed
vercel env rm OPENAI_API_KEY production
vercel env add OPENAI_API_KEY production
vercel --prod
```

#### C. Rate Limit Exceeded
- Check usage in OpenAI dashboard
- Increase rate limits or add billing
- Implement request queuing

#### D. Insufficient Credits
- Add credits to OpenAI account
- Check billing settings
- Monitor usage patterns

#### E. User in Control Mode
- AI chat only available in AI-Assisted mode
- Verify user's mode assignment
```bash
# Check user mode
curl -H "x-admin-key: YOUR_KEY" \
  "https://yourdomain.com/api/admin/export-data?format=json" \
  | jq '.data.users[] | select(.userId == "user-abc123") | .mode'
```

---

### 4. Slow Performance

**Symptoms:**
- Pages load slowly (>5 seconds)
- API requests timeout
- User complaints about speed

**Diagnosis:**
```bash
# Check response times
curl -w "@curl-format.txt" -o /dev/null -s https://yourdomain.com/api/health

# curl-format.txt:
# time_total: %{time_total}s
# time_namelookup: %{time_namelookup}s
# time_connect: %{time_connect}s
# time_starttransfer: %{time_starttransfer}s

# Check monitoring data
curl -H "x-admin-key: YOUR_KEY" \
  https://yourdomain.com/api/admin/monitoring | jq .requests.avgDuration
```

**Solutions:**

#### A. Database Slow
```bash
# Check Firestore indexes
firebase firestore:indexes

# Add missing indexes
# See DEPLOYMENT_GUIDE.md for index creation
```

#### B. OpenAI API Slow
- OpenAI responses can take 2-5 seconds
- This is normal behavior
- Consider showing loading indicator
- Cache common responses (carefully)

#### C. Cold Start (Serverless Functions)
- First request after idle period is slow
- Subsequent requests faster
- Consider using Vercel Pro for better performance
- Implement warming requests if needed

#### D. Large Payload Size
```bash
# Check response sizes
curl -w "%{size_download}\n" -o /dev/null -s https://yourdomain.com/api/validate-step

# Optimize if needed:
# - Reduce JSON payload size
# - Enable compression
# - Paginate large datasets
```

---

### 5. Firebase Connection Errors

**Symptoms:**
- "Failed to initialize Firebase"
- "Permission denied" errors
- Data not saving

**Diagnosis:**
```bash
# Check service account env variable
vercel env ls | grep FIREBASE_ADMIN_SERVICE_ACCOUNT

# Test Firebase Admin connection
npx ts-node -e "
import { initializeApp, cert } from 'firebase-admin/app';
const sa = JSON.parse(Buffer.from(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT, 'base64').toString());
initializeApp({ credential: cert(sa) });
console.log('✅ Connected');
"
```

**Solutions:**

#### A. Invalid Service Account
```bash
# Re-encode service account JSON
cat firebase-service-account.json | base64 -w 0 > encoded.txt

# Update in Vercel
vercel env rm FIREBASE_ADMIN_SERVICE_ACCOUNT production
vercel env add FIREBASE_ADMIN_SERVICE_ACCOUNT production
# Paste contents of encoded.txt

# Redeploy
vercel --prod
```

#### B. Firestore Security Rules Too Restrictive
```javascript
// Check rules in Firebase Console
// Ensure admin SDK access:
match /{document=**} {
  allow read, write: if false; // Client access denied
  // Admin SDK bypasses rules automatically
}
```

#### C. Project ID Mismatch
```bash
# Verify project IDs match
vercel env get NEXT_PUBLIC_FIREBASE_PROJECT_ID
# Compare with Firebase Console project ID
```

#### D. Quota Exceeded
- Check Firebase Console → Usage tab
- Upgrade plan if needed
- Optimize queries to reduce reads

---

### 6. Authentication Issues

**Symptoms:**
- User logged out unexpectedly
- Session not persisting
- "Unauthorized" errors

**Diagnosis:**
```bash
# Check cookies in browser DevTools
# Look for 'session' cookie

# Check middleware logs
vercel logs --follow | grep middleware

# Test authentication
curl -X POST https://yourdomain.com/api/auth/verify-access-code \
  -H "Content-Type: application/json" \
  -d '{"accessCode":"TEST-CODE"}' \
  -v  # Look for Set-Cookie header
```

**Solutions:**

#### A. Cookies Not Being Set
- Check `middleware.ts` for cookie configuration
- Ensure `httpOnly`, `secure`, `sameSite` are set correctly
- For localhost, `secure: false`; for production, `secure: true`

```typescript
// middleware.ts
cookies().set('session', userId, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 // 24 hours
});
```

#### B. CORS Issues
- Check CORS headers in `next.config.mjs`
- Ensure credentials allowed
```javascript
headers: [
  { key: 'Access-Control-Allow-Credentials', value: 'true' }
]
```

#### C. Session Expired
- Session cookies expire after 24 hours
- User needs to log in again with access code
- This is expected behavior

---

## Error Messages

### "Rate limit exceeded"

**Meaning:** User has made too many requests in the time window

**User Impact:** Cannot make more requests for 1 hour

**Solutions:**
1. **For Users:** Wait 1 hour before retrying
2. **For Admins:** Increase rate limits in `lib/rate-limit.ts`

```typescript
// lib/rate-limit.ts
export const RATE_LIMITS = {
  CHAT: { limit: 60, window: 3600000 }, // Increase from 30 to 60
};
```

---

### "Invalid access code"

**Meaning:** Access code doesn't exist, is already used, or is expired

**User Impact:** Cannot access platform

**Solutions:**
1. Verify code is correct (check for typos)
2. Check code status (see [Access Codes Not Working](#2-access-codes-not-working))
3. Generate new code for user

---

### "AI assistant is not available in your mode"

**Meaning:** User is in Control mode, which doesn't have AI access

**User Impact:** Cannot use chat feature

**Solutions:**
1. This is expected behavior
2. Control mode users don't have AI assistance
3. Cannot change user's mode once assigned

---

### "Failed to validate answer"

**Meaning:** Math validation engine encountered an error

**User Impact:** Cannot submit answer

**Solutions:**
1. Check answer format (should be valid math expression)
2. Review `lib/math-validator.ts` for validation logic
3. Check Nerdamer library is working

```bash
# Test math validation
npx ts-node -e "
import nerdamer from 'nerdamer';
require('nerdamer/Algebra');
require('nerdamer/Calculus');
console.log(nerdamer('2*x').toString());
"
```

---

### "Internal server error"

**Meaning:** Unexpected server-side error occurred

**User Impact:** Operation failed

**Solutions:**
1. Check server logs:
```bash
vercel logs --follow | grep -A 5 "Internal server error"
```

2. Common causes:
   - Unhandled exceptions
   - Database connection failures
   - External API failures

3. Check error monitoring:
```bash
curl -H "x-admin-key: YOUR_KEY" \
  https://yourdomain.com/api/admin/monitoring | jq .errors.topErrors
```

---

## Component-Specific Issues

### Firebase Issues

#### Issue: Firestore Write Failed

**Error:** `"PERMISSION_DENIED: Missing or insufficient permissions"`

**Cause:** Firestore security rules blocking write

**Solution:**
```bash
# Check current rules
firebase firestore:rules

# Update rules (see DEPLOYMENT_GUIDE.md)
# Deploy rules
firebase deploy --only firestore:rules
```

---

#### Issue: Too Many Firestore Reads

**Error:** Cost increasing unexpectedly

**Cause:** Inefficient queries or missing indexes

**Solution:**
1. Add composite indexes:
```bash
firebase firestore:indexes
```

2. Optimize queries:
```typescript
// Bad - reads all documents
db.collection('events').get()

// Good - uses index and limit
db.collection('events')
  .where('userId', '==', userId)
  .orderBy('timestamp', 'desc')
  .limit(10)
  .get()
```

3. Implement caching:
```typescript
// Cache frequently accessed data
const problemsCache = new Map();
```

---

### OpenAI Issues

#### Issue: High Token Usage

**Error:** Unexpected costs

**Cause:** Long conversations or inefficient prompts

**Solution:**
1. Limit conversation history:
```typescript
// chat/route.ts
const conversationHistory = recentMessages.slice(-5); // Last 5 messages only
```

2. Optimize system prompts:
```typescript
// Shorter, more efficient prompt
const systemPrompt = "You are a calculus tutor. Be concise.";
```

3. Monitor usage:
```bash
# Check OpenAI dashboard
# Set up usage alerts
```

---

#### Issue: Model Not Available

**Error:** `"The model 'gpt-4o-mini' does not exist"`

**Cause:** Model name changed or account doesn't have access

**Solution:**
```typescript
// Update model name in chat/route.ts
model: 'gpt-3.5-turbo', // Fallback model
```

---

### Vercel Issues

#### Issue: Function Timeout

**Error:** `"Function Execution Timeout"`

**Cause:** Function took longer than 10 seconds (default limit)

**Solution:**
```json
// vercel.json
{
  "functions": {
    "app/api/chat/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

Note: Longer timeouts require Vercel Pro plan

---

#### Issue: Environment Variable Not Found

**Error:** `"OPENAI_API_KEY is not defined"`

**Cause:** Environment variable not set in Vercel

**Solution:**
```bash
# Add environment variable
vercel env add OPENAI_API_KEY production

# Verify
vercel env ls

# Redeploy
vercel --prod
```

---

## Performance Issues

### Diagnosing Performance Problems

#### 1. Identify Bottleneck

```bash
# Check overall performance
curl -H "x-admin-key: YOUR_KEY" \
  https://yourdomain.com/api/admin/monitoring \
  | jq '{avgDuration:.requests.avgDuration, slowest:.requests.slowestEndpoints}'
```

#### 2. Profile Specific Endpoint

```bash
# Measure API endpoint performance
time curl -X POST https://yourdomain.com/api/validate-step \
  -H "Content-Type: application/json" \
  -H "Cookie: session=test" \
  -d '{"problemId":"diff-basics-1","stepNumber":1,"userAnswer":"2x"}'
```

#### 3. Check Database Performance

```bash
# In Firebase Console:
# - Go to Firestore Database
# - Click "Usage" tab
# - Check "Average latency"
```

### Performance Optimization

#### 1. Enable Caching

```typescript
// lib/cache.ts
const cache = new Map();

export function getCached(key: string, ttl: number, fetcher: () => any) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.value;
  }
  
  const value = fetcher();
  cache.set(key, { value, timestamp: Date.now() });
  return value;
}
```

#### 2. Optimize Database Queries

```typescript
// Bad
const events = await db.collection('events').get(); // Reads ALL events

// Good
const events = await db.collection('events')
  .where('userId', '==', userId)
  .where('timestamp', '>', startDate)
  .limit(100)
  .get();
```

#### 3. Implement Request Batching

```typescript
// Batch multiple operations
const batch = db.batch();
batch.set(doc1, data1);
batch.update(doc2, data2);
batch.delete(doc3);
await batch.commit(); // Single network call
```

#### 4. Use CDN for Static Assets

```javascript
// next.config.mjs
const nextConfig = {
  images: {
    domains: ['yourdomain.com'],
    loader: 'default',
  },
};
```

---

## Debug Procedures

### Debugging Local Development

#### 1. Enable Debug Mode

```bash
# .env.local
DEBUG=true
NODE_ENV=development
```

#### 2. Check Console Logs

```bash
# Run dev server with verbose logging
pnpm dev | tee debug.log

# Search for errors
grep -i error debug.log
```

#### 3. Use Browser DevTools

```javascript
// Add breakpoints in Chrome DevTools
// Check Network tab for API calls
// Check Console for errors
// Check Application → Cookies for session
```

#### 4. Test API Endpoints

```bash
# Test endpoint directly
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: session=test-user" \
  -d '{"message":"test","problemId":"diff-basics-1","currentStep":1}' \
  -v  # Verbose mode shows full request/response
```

### Debugging Production

#### 1. Check Vercel Logs

```bash
# Real-time logs
vercel logs --follow

# Filter by severity
vercel logs --follow | grep -i error

# Specific deployment
vercel logs [deployment-url]
```

#### 2. Check Firebase Logs

```bash
# Install Firebase CLI
npm install -g firebase-tools

# View logs
firebase functions:log
```

#### 3. Check Monitoring Data

```bash
curl -H "x-admin-key: YOUR_KEY" \
  https://yourdomain.com/api/admin/monitoring \
  | jq .errors.topErrors
```

#### 4. Reproduce Issue

```bash
# Export recent user data
curl -H "x-admin-key: YOUR_KEY" \
  "https://yourdomain.com/api/admin/export-data?format=json&startDate=$(date -d '1 hour ago' -I)" \
  | jq .data.events
  
# Identify problematic requests
# Reproduce locally with same parameters
```

---

## FAQ

### General Questions

**Q: What browsers are supported?**  
A: Chrome, Firefox, Safari, Edge (latest versions). IE is not supported.

**Q: Can users pause and resume later?**  
A: No, the study should be completed in one sitting (60-90 minutes).

**Q: What happens if a user's session expires?**  
A: They'll need to start over with a new access code. Sessions last 24 hours.

**Q: Can I change a user's mode after they start?**  
A: No, mode is assigned via access code and cannot be changed.

---

### Technical Questions

**Q: Why does the AI chat sometimes take 5+ seconds?**  
A: OpenAI API calls take 2-5 seconds. This is normal. We show a loading indicator.

**Q: Can I run this on my own server instead of Vercel?**  
A: Yes, but you'll need to adapt the deployment. See Next.js deployment docs.

**Q: How do I backup the database?**  
A: Use data export API or Firebase Console export feature. See ADMIN_MANUAL.md.

**Q: Can I test locally without Firebase?**  
A: Yes, tests use mocks. See `__tests__/setup.ts`.

---

### Troubleshooting Questions

**Q: Site is down, what do I check first?**  
A: 
1. Check https://yourdomain.com/api/health
2. Check Vercel deployment status
3. Check Firebase status
4. Check service status pages

**Q: User reports "Internal Server Error", how do I debug?**  
A:
1. Check Vercel logs: `vercel logs --follow`
2. Find user ID in logs
3. Check monitoring: `/api/admin/monitoring`
4. Review error context

**Q: How do I roll back a bad deployment?**  
A: `vercel rollback` or use Vercel Dashboard → Deployments → Promote previous version

---

## Known Limitations

### Platform Limitations

1. **Single-Use Access Codes**
   - Each code can only be used once
   - Users cannot resume on different device
   - Cannot change mode after starting

2. **Session Duration**
   - 24-hour session timeout
   - Must complete in one sitting
   - No pause/resume functionality

3. **AI Response Time**
   - OpenAI typically takes 2-5 seconds
   - May be slower during peak times
   - No way to speed up external API

4. **Math Validation**
   - Limited to calculus differentiation
   - Some valid answers may not be recognized
   - Uses string comparison and symbolic evaluation

5. **Rate Limiting**
   - 30 chat messages per hour
   - 20 answer submissions per hour
   - Necessary to prevent abuse

### Browser Limitations

1. **Cookies Required**
   - Authentication uses cookies
   - Users must enable cookies
   - No alternative authentication method

2. **JavaScript Required**
   - Platform won't work without JavaScript
   - Next.js requires client-side JS
   - No non-JS fallback

3. **Modern Browsers Only**
   - IE not supported
   - Requires ES6+ support
   - Older browsers may have issues

### Data Limitations

1. **Anonymous Data Only**
   - Cannot link to participant identity
   - Cannot contact users after study
   - Cannot verify duplicate participants

2. **No Real-Time Analytics**
   - Data export is manual process
   - No live dashboard (without custom build)
   - Monitoring data shows 24-hour window

---

## Getting Support

### Self-Service Resources

1. **Documentation**
   - API Reference: `/docs/API_DOCUMENTATION.md`
   - Deployment Guide: `/docs/DEPLOYMENT_GUIDE.md`
   - Admin Manual: `/docs/ADMIN_MANUAL.md`
   - This guide: `/docs/TROUBLESHOOTING.md`

2. **Logs**
   - Vercel logs: `vercel logs --follow`
   - Browser console: F12 → Console
   - Network tab: F12 → Network

3. **Monitoring**
   - Health check: `/api/health`
   - Admin monitoring: `/api/admin/monitoring`

### External Support

1. **Vercel Support**
   - Dashboard: https://vercel.com/support
   - Docs: https://vercel.com/docs
   - Community: https://github.com/vercel/next.js/discussions

2. **Firebase Support**
   - Dashboard: https://firebase.google.com/support
   - Docs: https://firebase.google.com/docs
   - Stack Overflow: Tag [firebase]

3. **OpenAI Support**
   - Help Center: https://help.openai.com
   - Status: https://status.openai.com
   - Community: https://community.openai.com

### Reporting Issues

When reporting issues, include:

1. **Error Message**: Exact text of error
2. **Steps to Reproduce**: How to trigger the issue
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**: Browser, OS, deployment URL
6. **Logs**: Relevant log excerpts
7. **Screenshots**: If UI issue

### Emergency Contacts

- **System Down**: Check health endpoint first, then service status pages
- **Data Loss**: Contact Firebase support immediately
- **Security Incident**: Follow incident response procedures (see ADMIN_MANUAL.md)

---

## Troubleshooting Checklist

Before requesting support, complete this checklist:

- [ ] Checked system health endpoint
- [ ] Reviewed recent deployment logs
- [ ] Verified environment variables
- [ ] Tested with different browser
- [ ] Cleared browser cache/cookies
- [ ] Checked external service status
- [ ] Reviewed error logs
- [ ] Attempted documented solutions
- [ ] Tested in incognito/private mode
- [ ] Reproduced issue consistently

If all checks complete and issue persists, document findings and seek support.

---

**Troubleshooting Guide Version:** 1.0.0  
**Last Updated:** March 5, 2026  
**Platform Version:** 1.0.0
