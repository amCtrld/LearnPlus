# Administrator User Manual

**LearnPlus Learning Platform**  
Administrator Operations Guide  
Last Updated: March 5, 2026

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Access Code Management](#access-code-management)
4. [Monitoring Dashboard](#monitoring-dashboard)
5. [Data Export & Analysis](#data-export--analysis)
6. [User Management](#user-management)
7. [System Maintenance](#system-maintenance)
8. [Troubleshooting](#troubleshooting)
9. [Security Best Practices](#security-best-practices)
10. [FAQ](#faq)

---

## Introduction

### Purpose

This manual provides comprehensive guidance for administrators managing the LearnPlus learning platform. It covers daily operations, maintenance tasks, and troubleshooting procedures.

### Administrator Responsibilities

- **Access Code Management:** Generate and distribute access codes to participants
- **Data Collection:** Monitor research data collection and export data
- **System Monitoring:** Track system health, performance, and errors
- **User Support:** Assist participants with technical issues
- **Security:** Maintain system security and protect research data

### Required Access

To perform administrative tasks, you need:
- ✅ Admin API key (`ADMIN_API_KEY`)
- ✅ Firebase Console access (Owner or Editor role)
- ✅ Vercel Dashboard access (optional, for deployment)

---

## Getting Started

### Accessing Admin Endpoints

All admin operations are performed through API endpoints that require authentication.

**Base URL:** `https://yourdomain.com/api/admin`

**Authentication:** Include your admin API key in the request header:
```
x-admin-key: your_admin_api_key_here
```

### Using cURL for Admin Operations

Most administrative tasks can be performed using cURL commands:

```bash
# Set your admin key as an environment variable
export ADMIN_KEY="your_admin_api_key_here"

# Example: Check system health
curl -H "x-admin-key: $ADMIN_KEY" \
  https://yourdomain.com/api/admin/monitoring
```

### Using Postman

1. Download and install [Postman](https://www.postman.com/)
2. Create a new collection: "LearnPlus Admin"
3. Add environment variable:
   - Key: `admin_key`
   - Value: Your admin API key
4. For each request, add header:
   - Key: `x-admin-key`
   - Value: `{{admin_key}}`

### Admin Dashboard (Optional)

If you've set up the admin dashboard UI:

1. Navigate to `https://yourdomain.com/admin`
2. Enter your admin API key
3. Access admin functions through the interface

---

## Access Code Management

### Understanding Access Codes

Access codes are unique identifiers that allow participants to access the platform. Each code:
- Is used exactly **once** (single-use)
- Is assigned to either **Control** or **AI-Assisted** mode
- Has an expiration date (default: 30 days)
- Generates an anonymous user ID when used

### Generating Access Codes

#### Via API

**Generate codes for a specific mode:**

```bash
# Generate 50 codes for AI-Assisted mode
curl -X POST https://yourdomain.com/api/admin/generate-access-codes \
  -H "Content-Type: application/json" \
  -H "x-admin-key: $ADMIN_KEY" \
  -d '{
    "count": 50,
    "mode": "ai_assisted",
    "expiresIn": 30
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "codes": [
      {
        "code": "ABCD-1234",
        "mode": "ai_assisted",
        "expiresAt": "2026-04-04T10:30:00.000Z"
      },
      {
        "code": "EFGH-5678",
        "mode": "ai_assisted",
        "expiresAt": "2026-04-04T10:30:00.000Z"
      }
      // ... 48 more codes
    ],
    "count": 50
  }
}
```

**Generate codes for Control mode:**

```bash
curl -X POST https://yourdomain.com/api/admin/generate-access-codes \
  -H "Content-Type: application/json" \
  -H "x-admin-key: $ADMIN_KEY" \
  -d '{
    "count": 50,
    "mode": "control",
    "expiresIn": 30
  }'
```

#### Best Practices for Code Generation

1. **Balanced Distribution:** Generate equal numbers of codes for each mode
   ```bash
   # Generate 50 Control + 50 AI-Assisted = 100 total
   # This ensures balanced research groups
   ```

2. **Reasonable Expiration:** Set 30-60 day expiration
   ```json
   { "expiresIn": 30 }  // 30 days (recommended)
   ```

3. **Track Generation:** Save generated codes to a CSV file
   ```bash
   curl -X POST https://yourdomain.com/api/admin/generate-access-codes \
     -H "Content-Type: application/json" \
     -H "x-admin-key: $ADMIN_KEY" \
     -d '{"count":50,"mode":"ai_assisted"}' \
     | jq -r '.data.codes[] | [.code, .mode, .expiresAt] | @csv' \
     > codes_$(date +%Y%m%d).csv
   ```

4. **Batch Size:** Generate in manageable batches (50-100)
   - Easier to distribute
   - Better tracking
   - Prevents waste

### Distributing Access Codes

#### Method 1: Email Distribution

Create a simple email template:

```
Subject: LearnPlus Study - Your Access Code

Dear Participant,

Thank you for participating in our learning research study!

Your unique access code is: ABCD-1234

To begin:
1. Visit: https://yourdomain.com
2. Enter your access code
3. Follow the instructions

Important notes:
- This code can only be used once
- Complete the study in one sitting (60-90 minutes)
- Your responses are anonymous and confidential

If you experience any technical issues, please contact: admin@yourdomain.com

Best regards,
Research Team
```

#### Method 2: Participant Management System

If using a participant management system:

1. Export generated codes to CSV
2. Import into your system
3. Assign codes to participants
4. Send automated invitations

#### Method 3: Manual Distribution

For in-person studies:

1. Print codes on cards
2. Hand out to participants
3. Track which codes are given to whom (if needed for your study)

### Checking Access Code Status

#### Check All Codes

```bash
curl -H "x-admin-key: $ADMIN_KEY" \
  https://yourdomain.com/api/admin/access-code-status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCodes": 200,
    "usedCodes": 142,
    "unusedCodes": 58,
    "expiredCodes": 0,
    "codes": [
      {
        "code": "ABCD-1234",
        "used": true,
        "usedBy": "user-abc123",
        "usedAt": "2026-03-01T14:22:00.000Z",
        "mode": "ai_assisted"
      },
      {
        "code": "EFGH-5678",
        "used": false,
        "mode": "control",
        "expiresAt": "2026-04-04T10:30:00.000Z"
      }
      // ...
    ]
  }
}
```

#### Check Specific Code

```bash
curl -H "x-admin-key: $ADMIN_KEY" \
  "https://yourdomain.com/api/admin/access-code-status?code=ABCD-1234"
```

#### Usage Statistics

Calculate usage rate:

```bash
# Get total and used counts
curl -H "x-admin-key: $ADMIN_KEY" \
  https://yourdomain.com/api/admin/access-code-status \
  | jq '{total:.data.totalCodes, used:.data.usedCodes, unused:.data.unusedCodes, usageRate:(.data.usedCodes/.data.totalCodes*100)}'
```

**Output:**
```json
{
  "total": 200,
  "used": 142,
  "unused": 58,
  "usageRate": 71
}
```

### Revoking or Extending Codes

Access codes cannot be revoked once generated. However, you can:

#### Mark Code as Used (Manual)

In Firebase Console:

1. Navigate to **Firestore Database**
2. Go to `accessCodes` collection
3. Find the code document
4. Set `used: true` and `usedAt: <current timestamp>`

#### Extend Expiration

In Firebase Console:

1. Navigate to **Firestore Database**
2. Go to `accessCodes` collection
3. Find the code document
4. Update `expiresAt` field to new date

---

## Monitoring Dashboard

### System Health Overview

Check overall system health:

```bash
curl -H "x-admin-key: $ADMIN_KEY" \
  https://yourdomain.com/api/admin/monitoring
```

### Key Metrics to Monitor

#### 1. System Health

```json
{
  "systemHealth": {
    "status": "healthy",  // healthy, degraded, or unhealthy
    "uptime": 864532,     // seconds
    "timestamp": "2026-03-05T10:30:00.000Z"
  }
}
```

**Status Indicators:**
- 🟢 **Healthy:** All systems operational
- 🟡 **Degraded:** Some issues, but functional
- 🔴 **Unhealthy:** Critical issues, system down

#### 2. Request Metrics

```json
{
  "requests": {
    "total": 15423,         // Total requests in time period
    "avgDuration": 245,     // Average response time (ms)
    "errorRate": "1.2%",    // Error percentage
    "statusCodes": {
      "200": 15168,         // Successful requests
      "400": 125,           // Bad requests
      "429": 84,            // Rate limited
      "500": 14             // Server errors
    }
  }
}
```

**Thresholds:**
- ✅ Error rate <5%: Good
- ⚠️ Error rate 5-10%: Monitor
- 🚨 Error rate >10%: Investigate

#### 3. Error Tracking

```json
{
  "errors": {
    "total": 186,
    "byCategory": {
      "validation_error": 125,
      "api_error": 45,
      "database_error": 16
    },
    "bySeverity": {
      "low": 125,
      "medium": 45,
      "high": 14,
      "critical": 2
    }
  }
}
```

**Action Items:**
- **Critical errors:** Immediate attention required
- **High errors:** Investigate within 24 hours
- **Medium errors:** Review weekly
- **Low errors:** Review monthly

#### 4. Performance Metrics

```json
{
  "performance": {
    "webVitals": {
      "LCP": 2.1,    // Largest Contentful Paint (seconds)
      "FID": 50,     // First Input Delay (ms)
      "CLS": 0.05    // Cumulative Layout Shift
    }
  }
}
```

**Target Thresholds:**
- LCP: <2.5s (Good), 2.5-4s (Needs improvement), >4s (Poor)
- FID: <100ms (Good), 100-300ms (Needs improvement), >300ms (Poor)
- CLS: <0.1 (Good), 0.1-0.25 (Needs improvement), >0.25 (Poor)

#### 5. Cache Performance

```json
{
  "cache": {
    "problems": {
      "size": 10,
      "hits": 15234,
      "misses": 125,
      "hitRate": "99.19%"
    }
  }
}
```

**Targets:**
- Cache hit rate: >95% (excellent), 90-95% (good), <90% (needs improvement)

### Daily Monitoring Checklist

Perform these checks daily:

1. **System Status**
   ```bash
   curl https://yourdomain.com/api/health | jq .status
   ```
   Expected: `"healthy"`

2. **Error Rate**
   ```bash
   curl -H "x-admin-key: $ADMIN_KEY" \
     https://yourdomain.com/api/admin/monitoring \
     | jq .errors.errorRate
   ```
   Expected: <5%

3. **Unresolved Alerts**
   ```bash
   curl -H "x-admin-key: $ADMIN_KEY" \
     https://yourdomain.com/api/admin/monitoring \
     | jq .alerts.unresolved
   ```
   Expected: 0 critical alerts

4. **Response Time**
   ```bash
   curl -H "x-admin-key: $ADMIN_KEY" \
     https://yourdomain.com/api/admin/monitoring \
     | jq .requests.avgDuration
   ```
   Expected: <500ms

### Responding to Alerts

#### High Error Rate Alert

**Trigger:** Error rate >5%

**Steps:**
1. Check error categories:
   ```bash
   curl -H "x-admin-key: $ADMIN_KEY" \
     https://yourdomain.com/api/admin/monitoring \
     | jq .errors.byCategory
   ```

2. Review recent errors in Vercel logs
3. Check for patterns (specific endpoint, time of day)
4. Apply fixes and monitor

#### Slow Performance Alert

**Trigger:** Average response time >1s

**Steps:**
1. Identify slow endpoints:
   ```bash
   curl -H "x-admin-key: $ADMIN_KEY" \
     https://yourdomain.com/api/admin/monitoring \
     | jq .requests.slowestEndpoints
   ```

2. Check database query performance
3. Review OpenAI API latency (for chat endpoint)
4. Consider caching improvements

#### Database Connection Issues

**Trigger:** Database status "unhealthy"

**Steps:**
1. Check Firebase Console for service issues
2. Verify Firestore security rules
3. Check service account credentials
4. Review database connection logs

---

## Data Export & Analysis

### Exporting Research Data

#### Export All Data

```bash
curl -H "x-admin-key: $ADMIN_KEY" \
  "https://yourdomain.com/api/admin/export-data?format=json" \
  -o research_data_$(date +%Y%m%d).json
```

#### Export as CSV

```bash
curl -H "x-admin-key: $ADMIN_KEY" \
  "https://yourdomain.com/api/admin/export-data?format=csv" \
  -o research_data_$(date +%Y%m%d).csv
```

#### Export Date Range

```bash
curl -H "x-admin-key: $ADMIN_KEY" \
  "https://yourdomain.com/api/admin/export-data?format=json&startDate=2026-03-01&endDate=2026-03-31" \
  -o research_data_march_2026.json
```

### Data Structure

The exported data includes:

```json
{
  "exportedAt": "2026-03-05T10:30:00.000Z",
  "users": 150,
  "sessions": 150,
  "events": 4532,
  "surveys": 142,
  "data": {
    "users": [
      {
        "userId": "user-abc123",
        "mode": "ai_assisted",
        "accessCode": "ABCD-1234",
        "createdAt": "2026-03-01T10:00:00.000Z",
        "completedAt": "2026-03-01T11:30:00.000Z",
        "totalTimeSpent": 5400000
      }
    ],
    "events": [
      {
        "eventId": "event-123",
        "userId": "user-abc123",
        "eventType": "answer_submitted",
        "timestamp": "2026-03-01T10:15:00.000Z",
        "eventData": {
          "problemId": "diff-basics-1",
          "stepNumber": 1,
          "answer": "2x",
          "isCorrect": true,
          "timeSpent": 45000
        }
      }
    ],
    "surveys": [
      {
        "surveyId": "survey-123",
        "userId": "user-abc123",
        "submittedAt": "2026-03-01T11:30:00.000Z",
        "responses": {
          "difficulty": 3,
          "aiHelpfulness": 4,
          "learningExperience": 5,
          "feedback": "Very helpful!",
          "wouldRecommend": true
        }
      }
    ]
  }
}
```

### Automated Data Export

Set up automated weekly exports:

**Option 1: Using cron (Linux/Mac)**

```bash
# Edit crontab
crontab -e

# Add weekly export (every Monday at 9 AM)
0 9 * * 1 curl -H "x-admin-key: $ADMIN_KEY" "https://yourdomain.com/api/admin/export-data?format=csv" -o /backups/research_data_$(date +\%Y\%m\%d).csv
```

**Option 2: Using GitHub Actions**

Create `.github/workflows/data-export.yml`:

```yaml
name: Weekly Data Export
on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9 AM
  workflow_dispatch:  # Manual trigger

jobs:
  export:
    runs-on: ubuntu-latest
    steps:
      - name: Export Data
        run: |
          curl -H "x-admin-key: ${{ secrets.ADMIN_API_KEY }}" \
            "https://yourdomain.com/api/admin/export-data?format=json" \
            -o research_data_$(date +%Y%m%d).json
      
      - name: Upload to Storage
        uses: actions/upload-artifact@v3
        with:
          name: research-data
          path: research_data_*.json
          retention-days: 90
```

### Data Backup Best Practices

1. **Regular Backups:** Export data weekly during active study period
2. **Multiple Formats:** Keep both JSON and CSV exports
3. **Secure Storage:** Store exports in encrypted, access-controlled location
4. **Version Control:** Include export date in filename
5. **Offsite Backup:** Store copies in multiple locations
6. **Retention Policy:** Keep exports for required research period (typically 5-10 years)

### Quick Data Analysis

#### Participant Statistics

```bash
# Count participants by mode
curl -H "x-admin-key: $ADMIN_KEY" \
  "https://yourdomain.com/api/admin/export-data?format=json" \
  | jq '[.data.users | group_by(.mode) | .[] | {mode: .[0].mode, count: length}]'
```

**Output:**
```json
[
  { "mode": "control", "count": 72 },
  { "mode": "ai_assisted", "count": 78 }
]
```

#### Completion Rate

```bash
# Calculate completion rate
curl -H "x-admin-key: $ADMIN_KEY" \
  "https://yourdomain.com/api/admin/export-data?format=json" \
  | jq '{
    total: .users,
    completed: (.data.surveys | length),
    completionRate: ((.data.surveys | length) / .users * 100)
  }'
```

#### Average Time Spent

```bash
# Average session duration
curl -H "x-admin-key: $ADMIN_KEY" \
  "https://yourdomain.com/api/admin/export-data?format=json" \
  | jq '.data.users | map(.totalTimeSpent) | add / length / 60000'
```

---

## User Management

### Viewing Active Users

```bash
# Get list of active sessions (last 24 hours)
curl -H "x-admin-key: $ADMIN_KEY" \
  "https://yourdomain.com/api/admin/export-data?format=json&startDate=$(date -d '1 day ago' -I)" \
  | jq '.data.users | map(select(.createdAt > (now - 86400 | todate)))'
```

### User Data Privacy

**Important:** All user data is anonymous. User IDs are randomly generated and not linked to personal information.

#### Data Retention

- **Active Study:** Keep all data
- **Post-Study:** Retain per IRB requirements (typically 3-7 years)
- **After Retention:** Securely delete all data

#### Deleting User Data

To delete a specific user's data:

1. Go to Firebase Console → **Firestore Database**
2. Search for user ID across collections:
   - `users/{userId}`
   - `userProgress/{userId}`
   - `events` where `userId` matches
   - `surveys` where `userId` matches
   - `chatLogs/{userId}`
3. Delete all matching documents

Or use Firebase Admin SDK:

```typescript
// delete-user-data.ts
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const userId = 'user-abc123';
const db = getFirestore();

async function deleteUserData() {
  // Delete user document
  await db.collection('users').doc(userId).delete();
  
  // Delete user progress
  await db.collection('userProgress').doc(userId).delete();
  
  // Delete user events
  const events = await db.collection('events').where('userId', '==', userId).get();
  await Promise.all(events.docs.map(doc => doc.ref.delete()));
  
  // Delete user surveys
  const surveys = await db.collection('surveys').where('userId', '==', userId).get();
  await Promise.all(surveys.docs.map(doc => doc.ref.delete()));
  
  // Delete chat logs
  await db.collection('chatLogs').doc(userId).delete();
  
  console.log(`Deleted all data for user: ${userId}`);
}

deleteUserData();
```

### Handling User Issues

#### User Can't Access Platform

**Troubleshooting:**

1. Verify access code is valid:
   ```bash
   curl -H "x-admin-key: $ADMIN_KEY" \
     "https://yourdomain.com/api/admin/access-code-status?code=ABCD-1234"
   ```

2. Check if code has been used:
   - If `used: true`, user needs a new code
   - Generate replacement code

3. Check if code has expired:
   - If expired, generate new code

4. Verify system health:
   ```bash
   curl https://yourdomain.com/api/health
   ```

#### User Experiencing Slow Performance

**Steps:**

1. Check user's internet connection
2. Test from different device/browser
3. Check system performance:
   ```bash
   curl -H "x-admin-key: $ADMIN_KEY" \
     https://yourdomain.com/api/admin/monitoring \
     | jq .requests.avgDuration
   ```
4. If system-wide, investigate server performance

#### AI Chat Not Responding

**Steps:**

1. Verify user is in AI-Assisted mode
2. Check OpenAI API status: https://status.openai.com
3. Test chat endpoint:
   ```bash
   curl -X POST https://yourdomain.com/api/chat \
     -H "Content-Type: application/json" \
     -H "Cookie: session=test-user" \
     -d '{"message":"test","problemId":"diff-basics-1","currentStep":1}'
   ```
4. Check error logs in Vercel Dashboard

---

## System Maintenance

### Routine Maintenance Tasks

#### Daily Tasks (5 minutes)

1. Check system health
2. Review error rate
3. Check for critical alerts
4. Monitor user activity

#### Weekly Tasks (30 minutes)

1. Export research data
2. Review weekly statistics
3. Check unused access codes
4. Review performance trends
5. Check for security updates

#### Monthly Tasks (2 hours)

1. Comprehensive data export
2. Performance analysis
3. Security audit
4. Dependency updates
5. Cost analysis (Firebase, OpenAI, Vercel)

### Database Maintenance

#### Clean Up Expired Codes

```typescript
// cleanup-expired-codes.ts
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

async function cleanupExpiredCodes() {
  const now = new Date();
  const expiredCodes = await db.collection('accessCodes')
    .where('expiresAt', '<', now)
    .where('used', '==', false)
    .get();
  
  console.log(`Found ${expiredCodes.size} expired unused codes`);
  
  // Delete expired codes
  await Promise.all(expiredCodes.docs.map(doc => doc.ref.delete()));
  
  console.log('Cleanup complete');
}

cleanupExpiredCodes();
```

#### Optimize Firestore Performance

1. Review query performance in Firebase Console
2. Add indexes for slow queries
3. Consider data archiving for old data

### Updating Dependencies

```bash
# Check for updates
pnpm outdated

# Update non-breaking changes
pnpm update

# Update major versions (test thoroughly)
pnpm update --latest

# Run tests after update
pnpm test
```

### Security Updates

1. Check for security advisories:
   ```bash
   pnpm audit
   ```

2. Fix vulnerabilities:
   ```bash
   pnpm audit fix
   ```

3. Review and update manually if needed

---

## Troubleshooting

### Common Issues

#### Issue: High Error Rate

**Symptoms:** Error rate >5%, many 500 errors

**Diagnosis:**
```bash
curl -H "x-admin-key: $ADMIN_KEY" \
  https://yourdomain.com/api/admin/monitoring \
  | jq '.errors.topErrors'
```

**Solutions:**
- Check Vercel function logs
- Review database connection
- Check OpenAI API status
- Verify environment variables

#### Issue: Slow Performance

**Symptoms:** Response time >2s, user complaints

**Diagnosis:**
```bash
curl -H "x-admin-key: $ADMIN_KEY" \
  https://yourdomain.com/api/admin/monitoring \
  | jq '.requests.slowestEndpoints'
```

**Solutions:**
- Optimize database queries
- Increase cache hit rate
- Check OpenAI API latency
- Consider CDN for static assets

#### Issue: Database Connection Failed

**Symptoms:** "Failed to connect to database" errors

**Solutions:**
1. Check Firebase service status
2. Verify service account credentials
3. Check Firestore security rules
4. Review connection limits

#### Issue: Access Codes Not Working

**Symptoms:** Users can't log in with valid codes

**Diagnosis:**
```bash
curl -H "x-admin-key: $ADMIN_KEY" \
  "https://yourdomain.com/api/admin/access-code-status?code=ABCD-1234"
```

**Solutions:**
- Verify code exists in database
- Check expiration date
- Ensure code hasn't been used
- Verify system authentication is working

### Emergency Procedures

#### Enable Maintenance Mode

**When to use:**
- Critical system errors
- Security incident
- Major updates

**How to enable:**

1. Update Firestore settings:
```typescript
db.collection('settings').doc('app').update({
  maintenanceMode: true,
  maintenanceMessage: 'System is temporarily unavailable for maintenance. Please try again in 30 minutes.'
});
```

2. All users will see maintenance message

3. Admin endpoints remain accessible

**How to disable:**
```typescript
db.collection('settings').doc('app').update({
  maintenanceMode: false
});
```

#### Emergency Rollback

If deployment causes issues:

```bash
# Via Vercel CLI
vercel rollback

# Or via Vercel Dashboard
# Deployments → Select previous version → Promote to Production
```

#### Contact Emergency Support

- **Vercel:** https://vercel.com/support
- **Firebase:** https://firebase.google.com/support  
- **OpenAI:** https://help.openai.com

---

## Security Best Practices

### Admin API Key Security

1. **Never commit** API key to Git
2. **Rotate regularly** (every 3-6 months)
3. **Use environment variables** only
4. **Restrict access** to authorized personnel only
5. **Monitor usage** for suspicious activity

### Data Protection

1. **Encrypt exports:** Use encryption when storing exported data
2. **Secure transfer:** Use HTTPS/SFTP for data transfer
3. **Access control:** Limit who can access research data
4. **Audit trails:** Log all admin operations
5. **Regular backups:** Maintain multiple backup copies

### Monitoring Security

```bash
# Check for suspicious activity
curl -H "x-admin-key: $ADMIN_KEY" \
  https://yourdomain.com/api/admin/monitoring \
  | jq '.requests.statusCodes'

# Look for unusual patterns:
# - High number of 401/403 errors (unauthorized access attempts)
# - High number of 429 errors (potential DDoS)
# - Unusual traffic spikes
```

### Incident Response

If you detect a security incident:

1. **Immediately:**
   - Enable maintenance mode
   - Rotate admin API key
   - Change Firebase credentials
   - Review access logs

2. **Within 24 hours:**
   - Investigate extent of breach
   - Notify affected parties if required
   - Document incident
   - Implement additional security measures

3. **Follow-up:**
   - Conduct security audit
   - Update security procedures
   - Train team on new procedures

---

## FAQ

### General Questions

**Q: How often should I export research data?**  
A: Export data weekly during active study period, and daily if collecting critical data.

**Q: What should I do if a participant loses their access code?**  
A: Generate a new code for them. Each code can only be used once, so they cannot reuse an old code.

**Q: Can I reuse access codes?**  
A: No, each access code is single-use for research integrity. Generate new codes as needed.

**Q: How long does data remain in the system?**  
A: Data remains indefinitely until manually deleted. Plan data retention according to your IRB requirements.

### Technical Questions

**Q: What does "degraded" system health mean?**  
A: Some components are slow or having minor issues, but the system is still functional. Monitor closely and investigate if it persists.

**Q: Why is my error rate high?**  
A: Check the error categories to identify the source. Common causes: API rate limits, database connection issues, or validation errors.

**Q: How do I increase rate limits?**  
A: Edit `lib/rate-limit.ts` and redeploy. Increase limits carefully to prevent abuse.

**Q: Can I access individual user data?**  
A: Yes, but user data is anonymous. You can export data by user ID, but cannot identify the individual.

### Troubleshooting Questions

**Q: Dashboard shows "unhealthy" status, what do I do?**  
A: Check specific component status in monitoring data. Address critical issues first (database, API). Review Vercel function logs for errors.

**Q: OpenAI costs are higher than expected, how do I reduce them?**  
A: Monitor token usage in OpenAI dashboard. Consider reducing conversation history length or adjusting system prompts.

**Q: How do I know if I'm approaching Firebase quota limits?**  
A: Check Firebase Console → Usage tab. Set up billing alerts in Firebase settings.

---

## Support Resources

### Documentation

- **API Reference:** `/docs/API_DOCUMENTATION.md`
- **Deployment Guide:** `/docs/DEPLOYMENT_GUIDE.md`
- **Research Data Guide:** `/docs/RESEARCH_DATA_ANALYSIS_GUIDE.md`
- **Troubleshooting:** `/docs/TROUBLESHOOTING.md`

### External Resources

- **Firebase Documentation:** https://firebase.google.com/docs
- **Vercel Documentation:** https://vercel.com/docs
- **OpenAI Documentation:** https://platform.openai.com/docs
- **Next.js Documentation:** https://nextjs.org/docs

### Getting Help

1. **Check documentation** first
2. **Review logs** in Vercel Dashboard
3. **Check service status** pages
4. **Contact platform support** if needed

---

**Administrator Manual Version:** 1.0.0  
**Last Updated:** March 5, 2026  
**Platform Version:** 1.0.0
