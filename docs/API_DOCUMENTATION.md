# API Documentation

**LearnPlus API Reference**  
Version: 1.0.0  
Last Updated: March 5, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Rate Limiting](#rate-limiting)
4. [Error Handling](#error-handling)
5. [API Endpoints](#api-endpoints)
   - [Authentication](#authentication-endpoints)
   - [Chat](#chat-endpoints)
   - [Problem Validation](#problem-validation-endpoints)
   - [Event Logging](#event-logging-endpoints)
   - [Survey](#survey-endpoints)
   - [Admin](#admin-endpoints)
   - [Health Check](#health-check-endpoints)

---

## Overview

The LearnPlus API is a RESTful API that powers the learning platform. All endpoints return JSON responses and follow standard HTTP status codes.

**Base URL:** `https://yourdomain.com/api`  
**Content-Type:** `application/json`  
**Character Encoding:** UTF-8

### API Design Principles

- RESTful architecture
- Consistent response formats
- Comprehensive error messages
- Rate limiting on all endpoints
- Security-first approach

---

## Authentication

### User Authentication

Users authenticate using **access codes** which are verified and create anonymous sessions.

**Session Cookie:** `session={userId}`  
**Expiration:** Session-based (browser close)

### Admin Authentication

Admin endpoints require an **API key** in the request header.

**Header:** `x-admin-key: {your-admin-api-key}`  
**Expiration:** Never (until key is rotated)

### Example: User Authentication Flow

```javascript
// Step 1: Verify access code
POST /api/auth/verify-access-code
{
  "accessCode": "ABCD-1234"
}

// Response includes Set-Cookie header
{
  "success": true,
  "userId": "user-abc123",
  "mode": "ai_assisted"
}

// Step 2: Use session cookie in subsequent requests
// Cookie is automatically included by browser
```

---

## Rate Limiting

All endpoints are rate-limited to prevent abuse.

### Rate Limits by Endpoint

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/auth/verify-access-code` | 10 requests | 1 hour |
| `/api/chat` | 30 requests | 1 hour |
| `/api/validate-step` | 20 requests | 1 hour |
| `/api/log-event` | 100 requests | 1 hour |
| `/api/survey` | 5 requests | 1 hour |
| `/api/admin/*` | 10 requests | 1 hour |
| `/api/health` | Unlimited | - |

### Rate Limit Headers

```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 27
X-RateLimit-Reset: 1709654400000
```

### Rate Limit Exceeded Response

```json
{
  "error": "Rate limit exceeded",
  "message": "You are making too many requests. Please wait a moment and try again.",
  "code": "RATE_LIMIT_EXCEEDED",
  "timestamp": "2026-03-05T10:30:00.000Z"
}
```

**HTTP Status:** `429 Too Many Requests`

---

## Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "error": "Error Type",
  "message": "User-friendly error message",
  "code": "ERROR_CODE",
  "timestamp": "2026-03-05T10:30:00.000Z"
}
```

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful request |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input/parameters |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 422 | Unprocessable Entity | Validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |
| 503 | Service Unavailable | Service temporarily down |

### Common Error Codes

- `VALIDATION_ERROR` - Input validation failed
- `AUTH_ERROR` - Authentication failed
- `FORBIDDEN_ERROR` - Authorization failed
- `NOT_FOUND` - Resource not found
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

---

## API Endpoints

### Authentication Endpoints

#### Verify Access Code

Verifies an access code and creates a user session.

**Endpoint:** `POST /api/auth/verify-access-code`  
**Authentication:** None  
**Rate Limit:** 10 requests/hour

**Request Body:**
```json
{
  "accessCode": "ABCD-1234"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": "user-abc123",
    "mode": "ai_assisted",
    "accessCode": "ABCD-1234"
  },
  "timestamp": "2026-03-05T10:30:00.000Z"
}
```

**Error Responses:**

**Invalid Code (400 Bad Request):**
```json
{
  "error": "Invalid access code",
  "message": "Invalid access code. Please check your code and try again.",
  "code": "VALIDATION_ERROR",
  "timestamp": "2026-03-05T10:30:00.000Z"
}
```

**Already Used (409 Conflict):**
```json
{
  "error": "Access code already used",
  "message": "This access code has already been used. Each code can only be used once.",
  "code": "CONFLICT",
  "timestamp": "2026-03-05T10:30:00.000Z"
}
```

---

#### Logout

Terminates the user session.

**Endpoint:** `POST /api/auth/logout`  
**Authentication:** User session  
**Rate Limit:** 10 requests/hour

**Request Body:** Empty

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "timestamp": "2026-03-05T10:30:00.000Z"
}
```

---

### Chat Endpoints

#### Send Chat Message

Sends a message to the AI tutor and receives a response.

**Endpoint:** `POST /api/chat`  
**Authentication:** User session (AI-assisted mode only)  
**Rate Limit:** 30 requests/hour

**Request Body:**
```json
{
  "message": "How do I apply the power rule?",
  "problemId": "diff-basics-1",
  "currentStep": 1,
  "conversationHistory": [
    {
      "role": "user",
      "content": "I need help with differentiation"
    },
    {
      "role": "assistant",
      "content": "I can help you with that!"
    }
  ]
}
```

**Parameters:**
- `message` (string, required): User's question/message
- `problemId` (string, required): ID of the current problem
- `currentStep` (number, required): Current step number (1-3)
- `conversationHistory` (array, optional): Previous messages

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "To apply the power rule, bring down the exponent and reduce it by 1. For x², the derivative is 2x¹ or simply 2x.",
    "tokensUsed": 75,
    "conversationId": "conv-123"
  },
  "timestamp": "2026-03-05T10:30:00.000Z"
}
```

**Error Responses:**

**Control Mode User (403 Forbidden):**
```json
{
  "error": "AI chat not available",
  "message": "You are in control mode. AI assistance is not available.",
  "code": "FORBIDDEN_ERROR"
}
```

**Invalid Problem (400 Bad Request):**
```json
{
  "error": "Invalid problem",
  "message": "The problem you are trying to access does not exist.",
  "code": "VALIDATION_ERROR"
}
```

---

### Problem Validation Endpoints

#### Validate Answer

Validates a user's answer for a problem step.

**Endpoint:** `POST /api/validate-step`  
**Authentication:** User session  
**Rate Limit:** 20 requests/hour

**Request Body:**
```json
{
  "problemId": "diff-basics-1",
  "stepNumber": 1,
  "userAnswer": "2x"
}
```

**Parameters:**
- `problemId` (string, required): Problem identifier
- `stepNumber` (number, required): Step number (1-3)
- `userAnswer` (string, required): User's mathematical answer

**Success Response - Correct (200 OK):**
```json
{
  "success": true,
  "data": {
    "isCorrect": true,
    "message": "Correct! Well done.",
    "expectedAnswer": "2x",
    "explanation": "You correctly applied the power rule."
  },
  "timestamp": "2026-03-05T10:30:00.000Z"
}
```

**Success Response - Incorrect (200 OK):**
```json
{
  "success": true,
  "data": {
    "isCorrect": false,
    "message": "Not quite right. Try again.",
    "hint": "Remember to bring down the exponent.",
    "attemptsRemaining": 2
  },
  "timestamp": "2026-03-05T10:30:00.000Z"
}
```

**Error Responses:**

**Invalid Step (400 Bad Request):**
```json
{
  "error": "Invalid step",
  "message": "Invalid step number. Please check your progress and try again.",
  "code": "VALIDATION_ERROR"
}
```

---

### Event Logging Endpoints

#### Log Event

Logs a user event for research data collection.

**Endpoint:** `POST /api/log-event`  
**Authentication:** User session  
**Rate Limit:** 100 requests/hour

**Request Body:**
```json
{
  "eventType": "answer_submitted",
  "eventData": {
    "problemId": "diff-basics-1",
    "stepNumber": 1,
    "answer": "2x",
    "isCorrect": true,
    "timeSpent": 45000
  }
}
```

**Event Types:**
- `problem_viewed` - User viewed a problem
- `answer_submitted` - User submitted an answer
- `hint_requested` - User requested a hint
- `step_completed` - User completed a step
- `chat_message_sent` - User sent a chat message
- `help_requested` - User requested help
- `survey_started` - User started survey
- `survey_completed` - User completed survey

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "eventId": "event-abc123",
    "logged": true
  },
  "timestamp": "2026-03-05T10:30:00.000Z"
}
```

---

### Survey Endpoints

#### Submit Survey

Submits post-study survey responses.

**Endpoint:** `POST /api/survey`  
**Authentication:** User session  
**Rate Limit:** 5 requests/hour

**Request Body:**
```json
{
  "difficulty": 3,
  "aiHelpfulness": 4,
  "learningExperience": 5,
  "feedback": "The AI tutor was very helpful!",
  "wouldRecommend": true,
  "technicalIssues": false
}
```

**Parameters:**
- `difficulty` (number, 1-5, required): Problem difficulty rating
- `aiHelpfulness` (number, 1-5, optional): AI helpfulness rating (AI mode only)
- `learningExperience` (number, 1-5, required): Overall experience rating
- `feedback` (string, optional): Free-text feedback
- `wouldRecommend` (boolean, required): Would recommend to others
- `technicalIssues` (boolean, required): Experienced technical issues

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Survey submitted successfully",
  "data": {
    "surveyId": "survey-abc123"
  },
  "timestamp": "2026-03-05T10:30:00.000Z"
}
```

---

### Admin Endpoints

All admin endpoints require the `x-admin-key` header.

#### Generate Access Codes

Generates new access codes for participants.

**Endpoint:** `POST /api/admin/generate-access-codes`  
**Authentication:** Admin API key  
**Rate Limit:** 10 requests/hour

**Request Body:**
```json
{
  "count": 50,
  "mode": "ai_assisted",
  "expiresIn": 30
}
```

**Parameters:**
- `count` (number, 1-100, required): Number of codes to generate
- `mode` (string, required): "control" or "ai_assisted"
- `expiresIn` (number, optional): Days until expiration (default: 30)

**Success Response (200 OK):**
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
    ],
    "count": 50
  },
  "timestamp": "2026-03-05T10:30:00.000Z"
}
```

---

#### Export Research Data

Exports all collected research data.

**Endpoint:** `GET /api/admin/export-data`  
**Authentication:** Admin API key  
**Rate Limit:** 10 requests/hour

**Query Parameters:**
- `format` (string, optional): "json" or "csv" (default: "json")
- `startDate` (string, optional): ISO 8601 date
- `endDate` (string, optional): ISO 8601 date

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "users": 150,
    "sessions": 150,
    "events": 4532,
    "surveys": 142,
    "exportedAt": "2026-03-05T10:30:00.000Z",
    "downloadUrl": "https://storage.googleapis.com/bucket/export-123.json"
  },
  "timestamp": "2026-03-05T10:30:00.000Z"
}
```

---

#### Check Access Code Status

Checks the status of access codes.

**Endpoint:** `GET /api/admin/access-code-status`  
**Authentication:** Admin API key  
**Rate Limit:** 10 requests/hour

**Query Parameters:**
- `code` (string, optional): Specific code to check

**Success Response (200 OK):**
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
      }
    ]
  },
  "timestamp": "2026-03-05T10:30:00.000Z"
}
```

---

#### Get Monitoring Data

Retrieves system monitoring and performance data.

**Endpoint:** `GET /api/admin/monitoring`  
**Authentication:** Admin API key  
**Rate Limit:** 10 requests/hour

**Success Response (200 OK):**
```json
{
  "systemHealth": {
    "status": "healthy",
    "uptime": 864532,
    "timestamp": "2026-03-05T10:30:00.000Z"
  },
  "requests": {
    "total": 15423,
    "avgDuration": 245,
    "errorRate": "1.2%",
    "statusCodes": {
      "200": 15168,
      "400": 125,
      "404": 32,
      "429": 84,
      "500": 14
    },
    "topEndpoints": [
      {
        "path": "/api/validate-step",
        "count": 6234
      },
      {
        "path": "/api/log-event",
        "count": 4532
      }
    ],
    "slowestEndpoints": [
      {
        "path": "/api/chat",
        "avgDuration": 2345
      }
    ]
  },
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
    },
    "topErrors": [
      {
        "message": "Invalid problem ID",
        "count": 45
      }
    ],
    "errorRate": "1.21%"
  },
  "performance": {
    "webVitals": {
      "LCP": 2.1,
      "FID": 50,
      "CLS": 0.05
    },
    "apiCalls": 125,
    "totalMetrics": 456
  },
  "cache": {
    "problems": {
      "size": 10,
      "hits": 15234,
      "misses": 125,
      "hitRate": "99.19%"
    },
    "sessions": {
      "size": 142,
      "hits": 4532,
      "misses": 234,
      "hitRate": "95.09%"
    },
    "totalCached": 512
  },
  "alerts": {
    "recent": [
      {
        "severity": "warning",
        "category": "performance",
        "title": "Slow endpoint detected",
        "message": "/api/chat averaging 2.5s response time",
        "timestamp": "2026-03-05T09:15:00.000Z",
        "resolved": false
      }
    ],
    "unresolved": 3,
    "critical": 0
  },
  "timeRange": {
    "start": "2026-03-04T10:30:00.000Z",
    "end": "2026-03-05T10:30:00.000Z",
    "hours": 24
  }
}
```

---

### Health Check Endpoints

#### Health Check

Returns system health status.

**Endpoint:** `GET /api/health`  
**Authentication:** None  
**Rate Limit:** Unlimited

**Success Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2026-03-05T10:30:00.000Z",
  "uptime": 864532,
  "checks": {
    "api": {
      "status": "healthy",
      "responseTime": 12
    },
    "database": {
      "status": "healthy",
      "responseTime": 45
    },
    "openai": {
      "status": "configured",
      "configured": true
    },
    "firebase": {
      "status": "configured",
      "configured": true
    }
  },
  "version": "1.0.0"
}
```

**Degraded Response (200 OK):**
```json
{
  "status": "degraded",
  "timestamp": "2026-03-05T10:30:00.000Z",
  "uptime": 864532,
  "checks": {
    "api": {
      "status": "healthy",
      "responseTime": 12
    },
    "database": {
      "status": "degraded",
      "responseTime": 1200,
      "message": "Slow response time"
    },
    "openai": {
      "status": "configured",
      "configured": true
    },
    "firebase": {
      "status": "configured",
      "configured": true
    }
  },
  "version": "1.0.0"
}
```

**Unhealthy Response (503 Service Unavailable):**
```json
{
  "status": "unhealthy",
  "timestamp": "2026-03-05T10:30:00.000Z",
  "uptime": 864532,
  "checks": {
    "api": {
      "status": "healthy",
      "responseTime": 12
    },
    "database": {
      "status": "unhealthy",
      "error": "Connection failed"
    },
    "openai": {
      "status": "configured",
      "configured": true
    },
    "firebase": {
      "status": "configured",
      "configured": true
    }
  },
  "version": "1.0.0"
}
```

---

## Code Examples

### JavaScript/TypeScript

```typescript
// Verify access code
async function verifyAccessCode(code: string) {
  const response = await fetch('/api/auth/verify-access-code', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ accessCode: code }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return response.json();
}

// Send chat message
async function sendChatMessage(message: string, problemId: string, step: number) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include session cookie
    body: JSON.stringify({
      message,
      problemId,
      currentStep: step,
    }),
  });
  
  return response.json();
}

// Validate answer
async function validateAnswer(problemId: string, stepNumber: number, answer: string) {
  const response = await fetch('/api/validate-step', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      problemId,
      stepNumber,
      userAnswer: answer,
    }),
  });
  
  return response.json();
}

// Admin: Generate codes
async function generateAccessCodes(count: number, mode: string, adminKey: string) {
  const response = await fetch('/api/admin/generate-access-codes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey,
    },
    body: JSON.stringify({ count, mode }),
  });
  
  return response.json();
}
```

### Python

```python
import requests

# Verify access code
def verify_access_code(code):
    response = requests.post(
        'https://yourdomain.com/api/auth/verify-access-code',
        json={'accessCode': code}
    )
    return response.json()

# Validate answer
def validate_answer(problem_id, step_number, answer, session_cookie):
    response = requests.post(
        'https://yourdomain.com/api/validate-step',
        json={
            'problemId': problem_id,
            'stepNumber': step_number,
            'userAnswer': answer
        },
        cookies={'session': session_cookie}
    )
    return response.json()

# Admin: Get monitoring data
def get_monitoring_data(admin_key):
    response = requests.get(
        'https://yourdomain.com/api/admin/monitoring',
        headers={'x-admin-key': admin_key}
    )
    return response.json()
```

### cURL

```bash
# Verify access code
curl -X POST https://yourdomain.com/api/auth/verify-access-code \
  -H "Content-Type: application/json" \
  -d '{"accessCode":"ABCD-1234"}'

# Validate answer (with session cookie)
curl -X POST https://yourdomain.com/api/validate-step \
  -H "Content-Type: application/json" \
  -H "Cookie: session=user-abc123" \
  -d '{"problemId":"diff-basics-1","stepNumber":1,"userAnswer":"2x"}'

# Admin: Generate access codes
curl -X POST https://yourdomain.com/api/admin/generate-access-codes \
  -H "Content-Type: application/json" \
  -H "x-admin-key: YOUR_ADMIN_KEY" \
  -d '{"count":50,"mode":"ai_assisted"}'

# Health check
curl https://yourdomain.com/api/health
```

---

## Best Practices

### 1. Error Handling

Always handle errors gracefully:

```typescript
try {
  const result = await validateAnswer(problemId, step, answer);
  if (result.success && result.data.isCorrect) {
    // Handle correct answer
  } else {
    // Handle incorrect answer
  }
} catch (error) {
  // Handle network/API errors
  console.error('API error:', error);
}
```

### 2. Rate Limiting

Implement exponential backoff for rate-limited requests:

```typescript
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const response = await fetch(url, options);
    
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      continue;
    }
    
    return response;
  }
  
  throw new Error('Max retries exceeded');
}
```

### 3. Authentication

Store and include session cookies automatically:

```typescript
// Use credentials: 'include' for all authenticated requests
fetch('/api/validate-step', {
  method: 'POST',
  credentials: 'include', // Automatically includes cookies
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});
```

### 4. Logging

Log API calls for debugging (development only):

```typescript
if (process.env.NODE_ENV === 'development') {
  console.log('API Request:', method, endpoint, data);
  console.log('API Response:', response);
}
```

---

## Changelog

### Version 1.0.0 (March 2026)
- Initial API release
- Authentication endpoints
- Chat endpoints
- Problem validation
- Event logging
- Survey submission
- Admin endpoints
- Health check

---

## Support

### Questions or Issues?

- **Documentation:** See `/docs` folder
- **Troubleshooting:** See `TROUBLESHOOTING.md`
- **Security:** See `SECURITY_TESTING_GUIDE.md`
- **Issues:** Create a GitHub issue

### Rate Limit Support

If you need higher rate limits, contact the administrator with:
- Use case description
- Expected request volume
- Timeframe

---

**API Documentation Version:** 1.0.0  
**Last Updated:** March 5, 2026  
**Platform Version:** 1.0.0
