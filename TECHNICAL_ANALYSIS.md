# Comprehensive Technical & Architectural Analysis
## Research LMS: AI-Driven Calculus Learning Platform

**Analysis Date:** March 5, 2026  
**Target:** MSc Dissertation Research Study  
**Platform:** Next.js 16 (App Router), TypeScript, Firebase, Tailwind CSS

---

## Executive Summary

This analysis reveals a **well-structured foundation** with clear architectural patterns, but identifies **13 critical issues** that must be addressed before deploying for real research participants. The system implements a controlled experimental design with proper data separation, but lacks essential validation logic, security measures, and error handling that are crucial for research data integrity.

**Overall Assessment:** 🟡 **Requires Significant Improvements** (Currently ~60% production-ready)

**Primary Concerns:**
1. ❌ **CRITICAL:** Math validation engine is incomplete (placeholder logic only)
2. ❌ **CRITICAL:** No Nerdamer integration despite being the stated validation approach
3. ⚠️ **HIGH:** AI tutor uses placeholder responses (no OpenAI integration)
4. ⚠️ **HIGH:** Inadequate error handling threatens data integrity
5. ⚠️ **MEDIUM:** Authentication/session management has security gaps

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Frontend Structure](#2-frontend-structure)
3. [Backend API Routes](#3-backend-api-routes)
4. [Math Validation System](#4-math-validation-system)
5. [AI Chat Integration](#5-ai-chat-integration)
6. [Firebase Architecture](#6-firebase-architecture)
7. [Authentication & Access Control](#7-authentication--access-control)
8. [Data Logging & Research Metrics](#8-data-logging--research-metrics)
9. [Security Analysis](#9-security-analysis)
10. [Performance Concerns](#10-performance-concerns)
11. [Research Validity Issues](#11-research-validity-issues)
12. [Critical Bugs & Missing Features](#12-critical-bugs--missing-features)
13. [Code Quality Assessment](#13-code-quality-assessment)
14. [Recommendations](#14-recommendations)

---

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Access Code  │→ │ Mode Select  │→ │  Dashboard   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                            ↓                                 │
│                    ┌──────────────┐                          │
│                    │ Problem Page │                          │
│                    │ ┌──────────┐ │                          │
│                    │ │ Steps    │ │                          │
│                    │ │ Survey   │ │                          │
│                    │ │ Chat (AI)│ │                          │
│                    └──────────────┘                          │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│              NEXT.JS API ROUTES (Server)                     │
│  /api/auth/verify-access-code                                │
│  /api/validate-step  (⚠️ INCOMPLETE)                        │
│  /api/chat           (⚠️ PLACEHOLDER)                       │
│  /api/log-event                                              │
│  /api/survey                                                 │
│  /api/admin/*                                                │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                  FIREBASE FIRESTORE                          │
│  Collections:                                                │
│  • accessCodes      (code, uid, used, timestamps)            │
│  • sessions         (uid, mode, progress, timestamps)        │
│  • logEntries       (uid, problemId, stepId, metrics)        │
│  • surveys          (uid, problemId, Likert responses)       │
│  • chatHistory      (uid, messages) [AI mode only]           │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend | Next.js | 16.1.6 | React framework with App Router |
| Language | TypeScript | 5.7.3 | Type safety |
| Styling | Tailwind CSS | 4.2.0 | Utility-first CSS |
| UI Components | Radix UI | Various | Accessible primitives |
| Database | Firebase Firestore | 10.8.1 | NoSQL document store |
| Auth | Firebase Auth | 10.8.1 | Anonymous authentication |
| Admin SDK | Firebase Admin | 12.1.0 | Server-side operations |
| Forms | React Hook Form | 7.54.1 | Form validation |
| Schema | Zod | 3.24.1 | Runtime validation |
| Analytics | Vercel Analytics | 1.6.1 | Usage tracking |

**✅ STRENGTHS:**
- Modern stack with excellent TypeScript support
- Firebase provides real-time capabilities and scalability
- Radix UI ensures accessibility compliance

**⚠️ CONCERNS:**
- **Missing dependencies:** No Nerdamer for math validation
- **Missing dependencies:** No OpenAI SDK for AI chat
- **Config issue:** `typescript.ignoreBuildErrors: true` masks type errors

---

## 2. Frontend Structure

### 2.1 Page Flow & Routing

```
/ (root) → Redirects to /access-code

/access-code
  ↓ (verify code)
/select-mode
  ↓ (choose control/ai-assisted)
/dashboard
  ↓ (select problem)
/problem/[id]
  ↓ (complete all steps + survey)
/dashboard (or next problem)
```

### 2.2 Component Architecture

#### **Core Components:**

1. **`access-code-input.tsx`** ✅ Good
   - Handles code entry and verification
   - Good UX with uppercase transformation
   - Error handling present
   - **Issue:** No rate limiting on failed attempts

2. **`auth-provider.tsx`** ⚠️ Needs Work
   - Client-side auth context
   - Uses `sessionStorage` for UID persistence
   - **Issue:** Auth state in sessionStorage only (not secure)
   - **Issue:** No token refresh mechanism
   - **Issue:** No server-side session validation

3. **`problem-step.tsx`** ⚠️ Needs Work
   - Renders individual step questions
   - Handles answer submission
   - **BUG:** Shows expected answer to user! (`<p className="text-xs">Expected: {step.expectedAnswer}</p>`)
   - **Issue:** No client-side validation before API call
   - **Issue:** Timer starts on mount, not on first interaction

4. **`chat-panel.tsx`** ✅ Good Structure
   - AI chat interface (AI-assisted mode only)
   - Tracks interactions via `trackAiInteraction()`
   - Auto-scrolling chat history
   - Good UX with loading states
   - **Issue:** Dependent on placeholder AI responses

5. **`survey-modal.tsx`** ✅ Good
   - Cognitive load survey (1-7 Likert scale)
   - Conditional questions based on mode
   - Cannot be dismissed (blocks progression)
   - Good data collection structure

### 2.3 State Management

**Approach:** Mixed (Context API + Local State + sessionStorage)

**Auth State:**
- `AuthProvider` context manages UID and session
- UID stored in `sessionStorage`
- **Issue:** No centralized state management for complex flows
- **Issue:** Session data fetched multiple times across pages

**Problem State:**
- Local component state in `problem/[id]/page.tsx`
- Step progression tracked locally
- **Issue:** State lost on page refresh
- **Issue:** No optimistic updates

**Logging State:**
- Timers and interaction counts in `sessionStorage`
- Works but could be centralized

**✅ GOOD:** Separation of concerns between auth and problem state  
**⚠️ CONCERN:** No state persistence for in-progress problems  
**⚠️ CONCERN:** Multiple sources of truth

---

## 3. Backend API Routes

### 3.1 Authentication Routes

#### **`POST /api/auth/verify-access-code`** ✅ Mostly Good

```typescript
// Process:
// 1. Query Firestore for code where used=false
// 2. Generate UID (format: uid_<uuid-segment>)
// 3. Mark code as used
// 4. Create session document
// 5. Return UID
```

**Strengths:**
- Atomic operation prevents double-use
- Good error messages
- Server-side validation

**Issues:**
- ❌ No rate limiting (brute force risk)
- ⚠️ Uses Firestore query + update (not transaction)
- ⚠️ UID format predictable
- ⚠️ No CSRF protection

**Recommendation:** Use Firestore transactions for atomicity

#### **`POST /api/auth/logout`** 
- **MISSING FILE!** Route referenced but not implemented
- Should invalidate session, clear logging data

### 3.2 Core Validation Routes

#### **`POST /api/validate-step`** ❌ **CRITICAL ISSUE**

```typescript
// CURRENT IMPLEMENTATION: Placeholder string comparison
function validateAnswer(studentAnswer: string, expectedAnswer: string): boolean {
  const normalize = (str: string) => str.trim().toLowerCase().replace(/\s+/g, '');
  const normalizedStudent = normalize(studentAnswer);
  const normalizedExpected = normalize(expectedAnswer);
  
  // Direct string match + some superscript alternatives
  return normalizedStudent === normalizedExpected || alternatives.includes(normalizedStudent);
}
```

**CRITICAL PROBLEMS:**

1. **❌ No symbolic math validation** - Uses string comparison only
2. **❌ Nerdamer not installed or imported** - Core requirement missing
3. **❌ False negatives guaranteed:**
   - `"6x + 4"` ≠ `"4 + 6x"` (different order)
   - `"3x^2"` ≠ `"x^2 * 3"` (different representation)
   - `"2x"` ≠ `"x + x"` (algebraically equivalent)
4. **❌ False positives possible:**
   - Normalization might accept wrong answers
5. **⚠️ No validation of problem/step existence before query**
6. **⚠️ No logging of incorrect attempts**

**MUST IMPLEMENT:**

```typescript
import nerdamer from 'nerdamer';
import 'nerdamer/Algebra.js';
import 'nerdamer/Calculus.js';

function validateAnswer(studentAnswer: string, expectedAnswer: string): boolean {
  try {
    // Parse both expressions
    const expected = nerdamer(expectedAnswer);
    const student = nerdamer(studentAnswer);
    
    // Simplify both
    const expectedSimplified = expected.expand().simplify();
    const studentSimplified = student.expand().simplify();
    
    // Check equivalence by subtraction
    const difference = nerdamer.subtract(expectedSimplified, studentSimplified);
    const simplifiedDiff = difference.simplify();
    
    // If difference is zero, answers are equivalent
    return simplifiedDiff.toString() === '0' || simplifiedDiff.text() === '0';
  } catch (error) {
    // Handle parse errors
    return false;
  }
}
```

### 3.3 AI Chat Routes

#### **`POST /api/chat`** ⚠️ **PLACEHOLDER IMPLEMENTATION**

```typescript
// CURRENT: Hardcoded if-else responses
if (lowerMessage.includes('hint')) {
  return 'Let me guide you through...';
}
// etc.
```

**CRITICAL PROBLEMS:**

1. **❌ No OpenAI integration** - Uses hardcoded responses
2. **❌ No actual AI tutoring** - Defeats experimental purpose
3. **❌ Responses don't consider problem context**
4. **⚠️ No conversation history** - Each message independent
5. **⚠️ No token usage tracking** (for OpenAI costs)
6. **⚠️ Chat history saved but never retrieved**

**MUST IMPLEMENT:**

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateTutorResponse(
  userMessage: string,
  currentStep: Step,
  problem: Problem,
  conversationHistory: ChatMessage[]
): Promise<string> {
  const systemPrompt = `You are a Socratic calculus tutor. The student is working on:
Problem: ${problem.expression}
Current Step: ${currentStep.question}

Guidelines:
- NEVER provide the direct answer
- Ask guiding questions
- Reference relevant differentiation rules
- Encourage the student to think through the problem
- If they're very stuck, provide incremental hints
- Use mathematical notation when helpful

Expected answer (DO NOT REVEAL): ${currentStep.expectedAnswer}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage }
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages,
    temperature: 0.7,
    max_tokens: 300,
  });

  return response.choices[0].message.content;
}
```

### 3.4 Data Collection Routes

#### **`POST /api/log-event`** ✅ Good

- Logs step attempts with metrics
- Captures: uid, timestamp, mode, problemId, stepId, isCorrect, timeSpent, aiInteractionCount
- **Issue:** No validation that log data is consistent
- **Issue:** No deduplication mechanism
- **Enhancement:** Should log incorrect attempts too (currently only logs correct)

#### **`POST /api/survey`** ✅ Good

- Captures cognitive load data
- Validates Likert scale bounds (1-7)
- **Issue:** No validation that user completed the problem
- **Issue:** systemHelpfulness could be 0 for control mode (good) but not validated

### 3.5 Admin Routes

#### **`POST /api/admin/generate-access-codes`** ⚠️ Needs Work

**Strengths:**
- Batch code generation
- Stores codes in Firestore
- Reasonable limit (1-1000)

**CRITICAL SECURITY ISSUES:**
- ❌ **NO AUTHENTICATION!** Anyone can generate codes
- ❌ **NO RATE LIMITING** - Spam risk
- ❌ **NO ADMIN VERIFICATION** - Should check admin role

#### **`GET /api/admin/export-data`** ⚠️ Needs Work

**Strengths:**
- Exports all research data
- CSV format (good for R/Python analysis)

**CRITICAL SECURITY ISSUES:**
- ❌ **NO AUTHENTICATION!** Anyone can download participant data
- ❌ **GDPR/ETHICS VIOLATION** - Raw data includes UIDs
- ⚠️ Should export anonymized data only
- ⚠️ No audit trail of who exported data

---

## 4. Math Validation System

### 4.1 Current Implementation

**Status:** ❌ **NON-FUNCTIONAL FOR RESEARCH**

The current `validateAnswer()` function uses naive string comparison:

```typescript
// This will FAIL for mathematically equivalent answers
normalize("3x^2 + 4x") === normalize("4x + 3x^2") // false!
```

### 4.2 Required Implementation

**Step 1: Install Nerdamer**

```bash
npm install nerdamer
npm install @types/nerdamer --save-dev
```

**Step 2: Create Robust Validator**

```typescript
// lib/math-validator.ts
import nerdamer from 'nerdamer';
require('nerdamer/Algebra');
require('nerdamer/Calculus');

export interface ValidationResult {
  isCorrect: boolean;
  normalized: string;
  error?: string;
}

export function validateMathExpression(
  studentAnswer: string,
  expectedAnswer: string
): ValidationResult {
  try {
    // Handle special cases
    if (!studentAnswer || !expectedAnswer) {
      return { isCorrect: false, normalized: '', error: 'Empty answer' };
    }

    // Parse student answer
    let studentExpr = nerdamer(studentAnswer);
    let expectedExpr = nerdamer(expectedAnswer);

    // Expand and simplify both
    studentExpr = studentExpr.expand().simplify();
    expectedExpr = expectedExpr.expand().simplify();

    // Check equivalence
    const difference = nerdamer.subtract(expectedExpr, studentExpr).simplify();
    const isZero = difference.toString() === '0' || difference.text() === '0';

    return {
      isCorrect: isZero,
      normalized: studentExpr.toString(),
      error: undefined
    };
  } catch (error) {
    // Handle malformed expressions
    return {
      isCorrect: false,
      normalized: '',
      error: 'Could not parse expression'
    };
  }
}
```

**Step 3: Add Test Suite**

```typescript
// __tests__/math-validator.test.ts
describe('Math Validator', () => {
  test('accepts equivalent expressions in different order', () => {
    expect(validateMathExpression('3x^2 + 4x', '4x + 3x^2').isCorrect).toBe(true);
  });

  test('accepts algebraically equivalent forms', () => {
    expect(validateMathExpression('2x', 'x + x').isCorrect).toBe(true);
    expect(validateMathExpression('6x', '3 * 2 * x').isCorrect).toBe(true);
  });

  test('rejects incorrect answers', () => {
    expect(validateMathExpression('3x^2', '2x^2').isCorrect).toBe(false);
  });

  test('handles whitespace and formatting variations', () => {
    expect(validateMathExpression(' 3 x^2 ', '3x^2').isCorrect).toBe(true);
  });

  test('handles malformed input gracefully', () => {
    const result = validateMathExpression('3x^', '3x^2');
    expect(result.isCorrect).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

### 4.3 Special Cases to Handle

1. **Trigonometric functions:** `sin(x)`, `cos(x)` - Problem 5 uses these
2. **Exponential functions:** `e^(2x)` - Problem 5
3. **Unsimplified vs simplified:**
   - Student: `(x^2 - 1)(2x) - (x^2 + 3)(2x)`
   - Expected: `-8x`
   - Should accept both!
4. **Multiple valid forms:**
   - `24x(3x^2 + 5)^3` vs `4(3x^2 + 5)^3 * 6x`

### 4.4 Impact on Research Validity

**Without proper symbolic validation:**
- ❌ False negatives → Students marked wrong when correct
- ❌ Frustration bias → AI group might appear less effective due to validation errors
- ❌ Contaminated data → Time-on-task metrics inflated by validation issues
- ❌ Research invalidated → Cannot draw conclusions from flawed measurement

**Priority:** 🔴 **MUST FIX BEFORE DEPLOYMENT**

---

## 5. AI Chat Integration

### 5.1 Current State

**Status:** ⚠️ **PLACEHOLDER ONLY**

The AI tutor currently returns hardcoded responses based on keyword matching. This defeats the entire purpose of the AI-assisted experimental condition.

### 5.2 Required Implementation

#### **Install OpenAI SDK**

```bash
npm install openai
```

#### **Environment Variables**

```env
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=400
```

#### **Implement Proper AI Tutor**

```typescript
// app/api/chat/route.ts
import OpenAI from 'openai';
import { getProblem } from '@/lib/course-data';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  const { uid, problemId, stepId, userMessage, mode } = await request.json();

  // Only in AI mode
  if (mode !== 'ai-assisted') {
    return NextResponse.json({ error: 'Not available' }, { status: 403 });
  }

  // Get problem context
  const problem = getProblem(problemId);
  const step = problem?.steps.find(s => s.id === stepId);
  
  if (!problem || !step) {
    return NextResponse.json({ error: 'Invalid problem' }, { status: 404 });
  }

  // Retrieve conversation history from Firestore
  const db = getAdminFirestore();
  const historySnapshot = await db
    .collection('chatHistory')
    .where('uid', '==', uid)
    .where('problemId', '==', problemId)
    .orderBy('timestamp', 'asc')
    .limit(20)
    .get();

  const history = historySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      role: data.role,
      content: data.role === 'user' ? data.userMessage : data.aiMessage
    };
  });

  // System prompt with constraints
  const systemPrompt = `You are a Socratic calculus tutor helping a student learn differentiation. 

CONTEXT:
Problem: ${problem.expression}
Current Step: ${step.question}
Expected Answer: ${step.expectedAnswer} [DO NOT REVEAL THIS DIRECTLY]

GUIDELINES:
1. NEVER give the complete answer immediately
2. Guide with questions (Socratic method)
3. Provide incremental hints if student is stuck
4. Explain relevant calculus rules (power, product, quotient, chain)
5. Encourage the student to attempt before helping
6. If student provides wrong answer, guide them to spot the error
7. Keep responses under 100 words

TONE: Encouraging, patient, educational`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userMessage }
  ];

  // Call OpenAI
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    messages: messages as any,
    temperature: 0.7,
    max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '400'),
  });

  const aiMessage = response.choices[0].message.content;

  // Save to Firestore
  await db.collection('chatHistory').add({
    uid,
    problemId,
    stepId,
    role: 'user',
    userMessage,
    timestamp: new Date(),
  });

  await db.collection('chatHistory').add({
    uid,
    problemId,
    stepId,
    role: 'assistant',
    aiMessage,
    timestamp: new Date(),
  });

  // Log token usage for cost tracking
  await db.collection('aiUsageMetrics').add({
    uid,
    problemId,
    timestamp: new Date(),
    model: response.model,
    promptTokens: response.usage?.prompt_tokens || 0,
    completionTokens: response.usage?.completion_tokens || 0,
    totalTokens: response.usage?.total_tokens || 0,
  });

  return NextResponse.json({ message: aiMessage });
}
```

### 5.3 AI Guardrails

**Prevent Answer Leakage:**

Add post-processing to detect if AI accidentally reveals answer:

```typescript
function containsAnswer(message: string, expectedAnswer: string): boolean {
  const normalized = message.toLowerCase().replace(/\s+/g, '');
  const expectedNorm = expectedAnswer.toLowerCase().replace(/\s+/g, '');
  return normalized.includes(expectedNorm);
}

if (containsAnswer(aiMessage, step.expectedAnswer)) {
  // Regenerate with stronger constraints or use fallback
  aiMessage = "Let me guide you step by step instead of giving the answer...";
}
```

### 5.4 Cost Management

**Estimated Costs:**
- GPT-4 Turbo: ~$0.01 per 1K input tokens, ~$0.03 per 1K output tokens
- Average chat: ~500 tokens → $0.02 per message
- 50 participants × 5 problems × 5 messages avg = 1,250 messages → **~$25**

**Recommendations:**
- Set up budget alerts in OpenAI dashboard
- Monitor token usage via Firestore logs
- Consider GPT-3.5-turbo for cost savings (75% cheaper)

---

## 6. Firebase Architecture

### 6.1 Firestore Data Model

```
firestore/
├── accessCodes/                    [Collection]
│   └── {codeId}/                   [Document]
│       ├── code: string            (12-char alphanumeric)
│       ├── created: Timestamp
│       ├── used: boolean
│       ├── usedAt?: Timestamp
│       └── uid?: string            (linked participant)
│
├── sessions/                       [Collection]
│   └── {uid}/                      [Document]
│       ├── uid: string
│       ├── mode: 'control' | 'ai-assisted'
│       ├── startTime: Timestamp
│       ├── endTime?: Timestamp
│       ├── currentProblemId: number
│       └── completedProblems: number[]
│
├── logEntries/                     [Collection]
│   └── {logId}/                    [Document]
│       ├── uid: string
│       ├── timestamp: Timestamp
│       ├── mode: StudyMode
│       ├── problemId: number
│       ├── stepId: string
│       ├── isCorrect: boolean
│       ├── timeSpent: number       (seconds)
│       └── aiInteractionCount: number
│
├── surveys/                        [Collection]
│   └── {surveyId}/                 [Document]
│       ├── uid: string
│       ├── problemId: number
│       ├── timestamp: Timestamp
│       ├── mentalDemand: number    (1-7)
│       ├── confidence: number      (1-7)
│       └── systemHelpfulness: number (0 or 1-7)
│
├── chatHistory/                    [Collection]
│   └── {messageId}/                [Document]
│       ├── uid: string
│       ├── problemId: number
│       ├── stepId: string
│       ├── role: 'user' | 'assistant'
│       ├── userMessage?: string
│       ├── aiMessage?: string
│       └── timestamp: Timestamp
│
└── aiUsageMetrics/                 [Collection - PROPOSED]
    └── {usageId}/                  [Document]
        ├── uid: string
        ├── problemId: number
        ├── timestamp: Timestamp
        ├── model: string
        ├── promptTokens: number
        ├── completionTokens: number
        └── totalTokens: number
```

### 6.2 Firestore Indexes

**Required Composite Indexes:**

```javascript
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "accessCodes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "code", "order": "ASCENDING" },
        { "fieldPath": "used", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "logEntries",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "uid", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "chatHistory",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "uid", "order": "ASCENDING" },
        { "fieldPath": "problemId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "ASCENDING" }
      ]
    }
  ]
}
```

**Deploy Indexes:**
```bash
firebase deploy --only firestore:indexes
```

### 6.3 Security Rules

**Current State:** ⚠️ **LIKELY PERMISSIVE OR MISSING**

**Required Firestore Security Rules:**

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Access codes: Admin write, server read
    match /accessCodes/{codeId} {
      allow read: if false; // Only via Admin SDK
      allow write: if false; // Only via Admin SDK
    }
    
    // Sessions: User can read their own, server writes
    match /sessions/{uid} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow write: if false; // Only via Admin SDK
    }
    
    // Log entries: Append-only via server
    match /logEntries/{logId} {
      allow read: if false; // Only via Admin SDK
      allow create: if false; // Only via Admin SDK
      allow update, delete: if false;
    }
    
    // Surveys: Append-only via server
    match /surveys/{surveyId} {
      allow read: if false;
      allow create: if false; // Only via Admin SDK
      allow update, delete: if false;
    }
    
    // Chat history: User can read their own
    match /chatHistory/{messageId} {
      allow read: if request.auth != null && 
                    resource.data.uid == request.auth.uid;
      allow write: if false; // Only via Admin SDK
    }
  }
}
```

### 6.4 Data Retention & Backup

**Missing Critical Features:**

1. **Automated Backups** ❌
   - Firestore has no automatic backup
   - Should configure daily exports to Cloud Storage
   
2. **Data Retention Policy** ❌
   - No policy for post-study data handling
   - GDPR requires deletion after retention period

3. **Backup Strategy** ❌
   - Should export to Cloud Storage daily
   - Keep backups for 30 days minimum

**Recommended Backup Script:**

```typescript
// scripts/backup-firestore.ts
import { getAdminFirestore } from '../lib/firebase';

async function backupFirestore() {
  const db = getAdminFirestore();
  const collections = ['accessCodes', 'sessions', 'logEntries', 'surveys', 'chatHistory'];
  
  for (const collection of collections) {
    const snapshot = await db.collection(collection).get();
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Save to file
    const fs = require('fs');
    const path = `./backups/${collection}_${new Date().toISOString()}.json`;
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
  }
}

// Run via cron job
backupFirestore();
```

---

## 7. Authentication & Access Control

### 7.1 Access Code System

**Design:** ✅ Good conceptual design

**Flow:**
1. Admin generates batch of codes
2. Codes distributed to participants
3. Participant enters code → UID generated
4. Code marked as used → prevents reuse
5. UID stored in sessionStorage

**Strengths:**
- One-time use prevents duplicate participation
- Anonymous UIDs protect identity
- Server-side validation

**Issues:**

1. **❌ No transaction-based code claiming**
   ```typescript
   // CURRENT: Race condition possible
   const snapshot = await codesRef.where('code', '==', code).where('used', '==', false).get();
   // Another request could claim same code here!
   await codesRef.doc(codeId).update({ used: true });
   
   // SHOULD BE:
   await db.runTransaction(async (transaction) => {
     const codeDoc = await transaction.get(codeRef);
     if (codeDoc.data().used) {
       throw new Error('Code already used');
     }
     transaction.update(codeRef, { used: true, uid, usedAt: new Date() });
   });
   ```

2. **⚠️ UID format predictable**
   - Format: `uid_<uuid-segment>`
   - Uses only first segment of UUID
   - Collision risk if many participants

3. **⚠️ No rate limiting**
   - Attacker could brute force codes
   - Should implement: max 5 attempts per IP per hour

4. **⚠️ sessionStorage only**
   - Lost on tab close
   - Not shared between tabs
   - Should use httpOnly cookies for production

### 7.2 Session Management

**Current:** Client-side only (sessionStorage)

**Issues:**

1. **❌ No server-side session validation**
   - Client can fabricate UID
   - No way to invalidate sessions
   - No session expiry

2. **❌ No CSRF protection**
   - All API routes accept any request
   - Should use CSRF tokens

3. **⚠️ Middleware doesn't enforce auth**
   - Middleware.ts exists but doesn't validate UID
   - Protected routes accessible without auth

**Required Implementation:**

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from './lib/firebase';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Protected routes
  const protectedRoutes = ['/select-mode', '/dashboard', '/problem'];
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));
  
  if (isProtected) {
    // Get UID from cookie or header
    const uid = request.cookies.get('lms_uid')?.value;
    
    if (!uid) {
      return NextResponse.redirect(new URL('/access-code', request.url));
    }
    
    // Verify session exists in Firestore
    try {
      const db = getAdminFirestore();
      const sessionDoc = await db.collection('sessions').doc(uid).get();
      
      if (!sessionDoc.exists) {
        return NextResponse.redirect(new URL('/access-code', request.url));
      }
    } catch (error) {
      return NextResponse.redirect(new URL('/access-code', request.url));
    }
  }
  
  return NextResponse.next();
}
```

### 7.3 Admin Authentication

**Current State:** ❌ **NO AUTHENTICATION!**

**Critical Security Flaw:**

```typescript
// /api/admin/generate-access-codes/route.ts
export async function POST(request: NextRequest) {
  // No auth check - anyone can call this!
  const { count } = await request.json();
  const codes = generateAccessCodes(count);
  await storeAccessCodes(codes);
  return NextResponse.json({ codes });
}
```

**Required Implementation:**

```typescript
// lib/admin-auth.ts
export async function verifyAdminToken(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return false;
  }
  
  const token = authHeader.substring(7);
  
  try {
    const admin = getAdminApp();
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Check custom claims for admin role
    return decodedToken.admin === true;
  } catch (error) {
    return false;
  }
}

// Use in routes:
export async function POST(request: NextRequest) {
  if (!await verifyAdminToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... rest of handler
}
```

---

## 8. Data Logging & Research Metrics

### 8.1 Event Logging

**Logged Events:**

1. **Step Attempts** (`logEntries` collection)
   - ✅ Captures: uid, problemId, stepId, isCorrect, timeSpent, aiInteractionCount
   - ⚠️ Only logs correct attempts
   - ❌ Doesn't log incorrect attempts (needed for help-seeking analysis!)

2. **Cognitive Load Surveys** (`surveys` collection)
   - ✅ Captures: mentalDemand, confidence, systemHelpfulness
   - ✅ 1-7 Likert scale
   - ✅ Properly separates control (0) vs AI (1-7) for helpfulness

3. **AI Chat Interactions** (`chatHistory` collection)
   - ✅ Logs all messages
   - ⚠️ Never retrieved for analysis
   - ⚠️ No sentiment analysis or help-seeking classification

### 8.2 Missing Metrics

**Critical for Research:**

1. **❌ Incorrect Attempt Logging**
   ```typescript
   // SHOULD LOG EVERY ATTEMPT, NOT JUST CORRECT ONES
   await logStepAttempt({
     uid,
     mode,
     problemId,
     stepId,
     isCorrect: false, // ← Need this data!
     attemptNumber: 3,
     timeSpent,
     aiInteractionCount
   });
   ```

2. **❌ Problem-Level Metrics**
   - Total time per problem
   - Number of attempts per problem
   - Abandonment rate
   - Hint usage rate

3. **❌ Session-Level Metrics**
   - Total session duration
   - Break times
   - Navigation patterns
   - Completion rate

4. **❌ AI Interaction Quality**
   - Message length
   - Question vs statement classification
   - Help-seeking timing (before vs after attempt)

### 8.3 Data Integrity Issues

**Concerns:**

1. **⚠️ Client-Side Time Tracking**
   ```typescript
   // Client can manipulate sessionStorage timers
   sessionStorage.setItem(`step_timer_${stepId}`, String(Date.now()));
   ```
   - Should track server-side timestamps

2. **⚠️ No Deduplication**
   - Double-submit could create duplicate logs
   - Should use idempotency keys

3. **⚠️ No Data Validation**
   ```typescript
   // No checks that data makes sense
   timeSpent: 999999, // Impossible value accepted
   aiInteractionCount: -5, // Negative accepted
   ```

### 8.4 Recommended Logging Enhancement

```typescript
// lib/enhanced-logger.ts
export interface EnhancedLogEntry {
  // Core identifiers
  uid: string;
  sessionId: string; // Add session tracking
  timestamp: Date;
  mode: StudyMode;
  
  // Event context
  problemId: number;
  stepId: string;
  attemptNumber: number; // Track multiple attempts per step
  
  // Outcome
  isCorrect: boolean;
  studentAnswer: string; // Log actual answer (for error analysis)
  
  // Timing
  timeSpent: number;
  serverTimestamp: Date; // Server-side timestamp
  
  // AI Interaction (if applicable)
  aiInteractionCount: number;
  aiInteractedBeforeAttempt: boolean; // Help-seeking behavior
  
  // Client context
  userAgent: string;
  viewport: { width: number; height: number };
}

export async function logEnhancedEvent(entry: EnhancedLogEntry) {
  // Validate data
  if (entry.timeSpent < 0 || entry.timeSpent > 3600) {
    throw new Error('Invalid timeSpent');
  }
  
  // Add server timestamp
  entry.serverTimestamp = new Date();
  
  // Generate idempotency key
  const idempotencyKey = `${entry.uid}_${entry.problemId}_${entry.stepId}_${entry.attemptNumber}`;
  
  // Check for duplicate
  const db = getAdminFirestore();
  const existing = await db.collection('logEntries').doc(idempotencyKey).get();
  
  if (existing.exists) {
    return; // Already logged
  }
  
  // Store with idempotency key as document ID
  await db.collection('logEntries').doc(idempotencyKey).set(entry);
}
```

---

## 9. Security Analysis

### 9.1 Critical Vulnerabilities

#### **1. Admin Routes Unprotected** 🔴 CRITICAL

**Impact:** Anyone can:
- Generate unlimited access codes
- Download all participant data
- View access code status

**Fix:** Implement admin authentication (see Section 7.3)

#### **2. No Rate Limiting** 🔴 HIGH

**Impact:**
- Brute force access codes
- DDoS admin endpoints
- Spam AI chat (cost attack)

**Fix:**
```typescript
// middleware/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1 h'), // 5 requests per hour
  analytics: true,
});

export async function rateLimit(identifier: string): Promise<boolean> {
  const { success } = await ratelimit.limit(identifier);
  return success;
}
```

#### **3. Client-Side Validation Only** ⚠️ MEDIUM

**Issue:** Problem data exposed to client

```tsx
// problem-step.tsx - SHOWS ANSWER TO USER!
<p className="text-xs text-muted-foreground">
  Expected: <span className="font-mono">{step.expectedAnswer}</span>
</p>
```

**Fix:** Remove expected answer from client, only validate server-side

#### **4. No CSRF Protection** ⚠️ MEDIUM

**Impact:** Cross-site request forgery possible

**Fix:** Use Next.js CSRF tokens or SameSite cookies

#### **5. Firestore Rules Missing** 🔴 CRITICAL

**Current:** Likely open read/write (default Firebase setup)

**Fix:** Implement rules from Section 6.3

### 9.2 Data Privacy Concerns

#### **GDPR/Ethics Compliance Issues:**

1. **❌ No Consent Collection**
   - Should require informed consent before starting
   - Should explain data collection
   - Should provide privacy policy

2. **❌ No Data Anonymization**
   - UIDs could be linked to distribution records
   - Should use double-anonymization

3. **❌ No Data Export for Participants**
   - Participants can't request their data
   - Required by GDPR Article 20

4. **❌ No Data Deletion Mechanism**
   - Participants can't request deletion
   - Required by GDPR Article 17

**Recommendation:** Add ethics compliance page:

```tsx
// app/consent/page.tsx
export default function ConsentPage() {
  return (
    <div>
      <h1>Research Study Consent</h1>
      <p>This study investigates...</p>
      
      <h2>Data Collection</h2>
      <ul>
        <li>Problem-solving behavior</li>
        <li>AI chat interactions (if applicable)</li>
        <li>Survey responses</li>
      </ul>
      
      <h2>Privacy</h2>
      <p>Your data is anonymized using unique identifiers...</p>
      
      <Checkbox onChange={handleConsent}>
        I consent to participate in this research study
      </Checkbox>
    </div>
  );
}
```

### 9.3 Environment Variables Security

**Required Variables:**

```env
# Firebase Client (Public - OK to expose)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...

# Firebase Admin (Secret - NEVER expose)
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=...

# OpenAI (Secret)
OPENAI_API_KEY=sk-proj-...

# Admin Security (Secret)
ADMIN_API_KEY=...
```

**Issues:**

1. ⚠️ No `.env.example` file for contributors
2. ⚠️ Private key requires `\n` replacement (error-prone)
3. ⚠️ No validation that all vars are set

**Add Validation:**

```typescript
// lib/env-validation.ts
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_CLIENT_EMAIL',
  'OPENAI_API_KEY',
];

export function validateEnv() {
  const missing = requiredEnvVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
}
```

---

## 10. Performance Concerns

### 10.1 Frontend Performance

#### **Issues:**

1. **⚠️ Large UI Library Bundle**
   - 40+ Radix UI components imported
   - Many unused in final app
   - Should use tree-shaking

2. **⚠️ Multiple Firestore Queries per Page**
   ```typescript
   // dashboard/page.tsx fetches session
   const sessionDoc = await getDoc(sessionRef);
   
   // problem/[id]/page.tsx fetches session again
   const sessionDoc = await getDoc(sessionRef);
   ```
   - Should cache session data in context

3. **⚠️ No Loading States for Data Fetching**
   - Some pages render empty during fetch
   - Poor UX

4. **✅ Good:** Client-side navigation via Next.js App Router

#### **Optimizations:**

```typescript
// components/auth-provider.tsx - Add session caching
export function AuthProvider({ children }) {
  const [session, setSession] = useState<Session | null>(null);
  
  useEffect(() => {
    if (uid && !session) {
      fetchSession(uid).then(setSession);
    }
  }, [uid]);
  
  // Provide session to all consumers
  return (
    <AuthContext.Provider value={{ uid, session, updateSession }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### 10.2 Backend Performance

#### **Issues:**

1. **⚠️ No Database Indexes**
   - Chat history query needs index:
     ```typescript
     .where('uid', '==', uid)
     .where('problemId', '==', problemId)
     .orderBy('timestamp')
     ```
   - Will fail without composite index

2. **⚠️ OpenAI Latency**
   - Each chat message: 2-5 second delay
   - Should implement streaming responses
   - Should show typing indicator

3. **⚠️ No Caching**
   - Problem data fetched on every request
   - Should cache in memory or Redis

#### **Optimizations:**

```typescript
// lib/problem-cache.ts
let problemCache: Problem[] | null = null;

export function getCachedProblems(): Problem[] {
  if (!problemCache) {
    problemCache = PROBLEMS; // Static data, safe to cache
  }
  return problemCache;
}
```

### 10.3 Scalability

**Current Capacity:**

- ✅ **Firebase Firestore:** 10K writes/sec (sufficient for 100 concurrent users)
- ✅ **Next.js Serverless:** Auto-scales
- ⚠️ **OpenAI API:** Rate limit depends on tier
  - Free tier: 3 requests/min (insufficient)
  - Tier 1: 500 requests/min (sufficient for 50 concurrent users)

**For 100+ participants:**

1. Upgrade OpenAI tier
2. Implement request queuing
3. Consider caching common AI responses

---

## 11. Research Validity Issues

### 11.1 Experimental Design Concerns

#### **1. Expected Answer Visible to Participants** 🔴 **CRITICAL**

**Location:** `problem-step.tsx` line 91

```tsx
<p className="text-xs text-muted-foreground">
  Expected: <span className="font-mono font-semibold">{step.expectedAnswer}</span>
</p>
```

**Impact on Research:**
- ❌ Participants can see the correct answer before attempting
- ❌ Defeats the purpose of the learning task
- ❌ Invalidates all time-on-task measurements
- ❌ Makes AI vs control comparison meaningless

**Required Fix:** REMOVE THIS LINE IMMEDIATELY

#### **2. Math Validation Inaccuracy**

**Impact:**
- False negatives → increased frustration → confounding variable
- Different error rates between groups
- Invalid time-on-task measurements

#### **3. AI Placeholder vs Real AI**

**Impact:**
- Current hardcoded responses are consistent but non-adaptive
- Real AI would be adaptive but might introduce variability
- Need to test AI consistency across participants

### 11.2 Data Collection Gaps

#### **Missing Critical Metrics:**

1. **Incorrect Attempts** (needed for persistence analysis)
2. **Hint Usage Patterns** (help-seeking behavior)
3. **AI Chat Timing** (when do users ask for help?)
4. **Problem Abandonment** (dropout analysis)
5. **Navigation Patterns** (engagement proxy)

#### **Survey Limitations:**

1. Only collected after problem completion (survivor bias)
2. No pre-task cognitive load baseline
3. No control for prior calculus knowledge

### 11.3 Contamination Risks

**Ways participants could cheat/contaminate data:**

1. ✅ **Prevented:** Access code reuse (good!)
2. ❌ **Not Prevented:** Sharing access codes between participants
3. ❌ **Not Prevented:** Opening multiple tabs (same UID)
4. ❌ **Not Prevented:** Using external calculators (can't detect)
5. ❌ **Not Prevented:** AI group helping control group

**Recommendations:**

1. Add participation instructions emphasizing individual work
2. Log multiple concurrent sessions from same UID
3. Use time-on-task as validity check (flag <30s completions)

### 11.4 Statistical Power Considerations

**Sample Size:**

- No mention of target sample size
- No power analysis
- Recommend: G*Power analysis for t-tests (likely need 30-50 per group)

**Randomization:**

- ❌ No randomization mechanism
- Participants self-select mode
- Introduces selection bias

**Recommendation:** Implement forced randomization:

```typescript
// select-mode/page.tsx
useEffect(() => {
  const assignedMode = Math.random() < 0.5 ? 'control' : 'ai-assisted';
  setSelectedMode(assignedMode);
  // Don't allow user to change
}, []);
```

Or use blocked randomization with access codes:

```typescript
// When generating codes, pre-assign mode
const modes = ['control', 'ai-assisted'];
codes.forEach((code, i) => {
  const assignedMode = modes[i % 2]; // Alternate
  // Store in Firestore
});
```

---

## 12. Critical Bugs & Missing Features

### 12.1 Confirmed Bugs

#### **1. Expected Answer Exposed** 🔴 **P0**

**File:** `components/problem-step.tsx` line 91  
**Fix:** Remove line immediately

#### **2. Logout Route Missing** 🔴 **P0**

**File:** `app/api/auth/logout/route.ts`  
**Status:** Referenced but not implemented  
**Impact:** Users cannot properly end session

**Required Implementation:**

```typescript
// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const { uid } = await request.json();
    
    if (uid) {
      const db = getAdminFirestore();
      await db.collection('sessions').doc(uid).update({
        endTime: new Date(),
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
```

#### **3. Timer Starts Too Early** ⚠️ **P1**

**File:** `app/problem/[id]/page.tsx` line 67  
**Issue:** Timer starts on page mount, not on first interaction

```typescript
useEffect(() => {
  startStepTimer(`step-${currentStepIndex}`);
}, [currentStepIndex]); // ← Starts immediately

// Should start when input is focused
<Input onFocus={() => startStepTimer(currentStep.id)} />
```

#### **4. AI Interaction Count Not Reset Between Steps** ⚠️ **P1**

**File:** `lib/logger.ts`  
**Issue:** `aiInteractionCount` only reset after full problem, not per step

```typescript
// Currently resets per problem
resetAiInteractionCount(problemId);

// Should track per step
resetAiInteractionCount(problemId, stepId);
```

#### **5. Survey Modal Cannot Be Dismissed** ⚠️ **P2**

**File:** `components/survey-modal.tsx`  
**Issue:** If user closes tab during survey, data is lost

**Fix:** Save partial survey data, allow resumption

#### **6. No Validation of Step Sequence** ⚠️ **P2**

**Issue:** Client could skip steps by manipulating state

**Fix:** Server should validate that previous step was completed

```typescript
// /api/validate-step
const session = await getSession(uid);
const expectedStepIndex = session.currentStepIndex;
if (stepId !== expectedStepIndex) {
  return NextResponse.json({ error: 'Invalid step sequence' }, { status: 400 });
}
```

### 12.2 Missing Features

#### **1. Problem Review** ⚠️ **P2**

- Users cannot review completed problems
- No feedback on incorrect attempts
- No learning reinforcement

#### **2. Study Progress Indicator** ⚠️ **P2**

- No overall completion percentage
- No estimated time remaining
- Could improve retention

#### **3. Accessibility Features** ⚠️ **P2**

- No keyboard navigation
- No screen reader support (despite using Radix UI)
- No high contrast mode

#### **4. Error Recovery** 🔴 **P1**

- No retry mechanism for failed API calls
- No offline support
- Could lose data on network failure

**Fix:** Add error boundary and retry logic

```typescript
// components/error-boundary.tsx
export function ErrorBoundary({ children }) {
  const [hasError, setHasError] = useState(false);
  
  if (hasError) {
    return (
      <div>
        <h2>Something went wrong</h2>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }
  
  return children;
}
```

---

## 13. Code Quality Assessment

### 13.1 Strengths

1. ✅ **Strong TypeScript Usage**
   - Comprehensive type definitions in `lib/types.ts`
   - Good interface design
   - Type safety across components

2. ✅ **Clear File Organization**
   - Logical folder structure
   - Separation of concerns
   - API routes well-organized

3. ✅ **Component Modularity**
   - Reusable UI components
   - Good props interfaces
   - Single responsibility principle

4. ✅ **Documentation**
   - Good inline comments
   - JSDoc headers on most files
   - Clear function names

### 13.2 Issues

#### **1. TypeScript Errors Ignored** 🔴 **CRITICAL**

```javascript
// next.config.mjs
typescript: {
  ignoreBuildErrors: true, // ← This is DANGEROUS
}
```

**Impact:** Hidden type errors could cause runtime bugs

**Fix:** Remove this line and fix all type errors

#### **2. Inconsistent Error Handling**

```typescript
// Some routes
try {
  // operation
} catch (error) {
  console.error(error); // Just log
  return NextResponse.json({ error: 'Internal server error' }); // Generic
}

// Others
catch (error: any) {
  if (error.message.includes('Invalid')) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  // ...
}
```

**Recommendation:** Standardize error handling

```typescript
// lib/api-error.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
  }
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }
  
  console.error('Unexpected error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
```

#### **3. Magic Numbers and Strings**

```typescript
// Scattered throughout code
maxLength={12} // Access code length
limit(20) // Chat history limit
max_tokens: 500 // AI response length
```

**Recommendation:** Extract to constants

```typescript
// lib/constants.ts
export const ACCESS_CODE_LENGTH = 12;
export const CHAT_HISTORY_LIMIT = 20;
export const AI_MAX_TOKENS = 400;
export const STEP_TIMEOUT_SECONDS = 3600;
export const LIKERT_SCALE_MIN = 1;
export const LIKERT_SCALE_MAX = 7;
```

#### **4. No Testing**

- ❌ No unit tests
- ❌ No integration tests
- ❌ No E2E tests

**Critical for Research Application!**

**Recommended Test Suite:**

```typescript
// __tests__/validate-step.test.ts
describe('Step Validation API', () => {
  test('accepts correct answer', async () => {
    const response = await fetch('/api/validate-step', {
      method: 'POST',
      body: JSON.stringify({
        problemId: 1,
        stepId: '1-1',
        studentAnswer: '3x^2'
      })
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.isCorrect).toBe(true);
  });
  
  test('accepts equivalent forms', async () => {
    const response = await fetch('/api/validate-step', {
      method: 'POST',
      body: JSON.stringify({
        problemId: 1,
        stepId: '1-5',
        studentAnswer: '4x + 3x^2 - 5' // Different order
      })
    });
    const data = await response.json();
    expect(data.isCorrect).toBe(true);
  });
});
```

### 13.3 Code Metrics

**Lines of Code Estimate:**

| Component | Files | LOC | Complexity |
|-----------|-------|-----|------------|
| Frontend Pages | 7 | ~1,200 | Medium |
| Components | 6 | ~800 | Low-Medium |
| API Routes | 10 | ~600 | Medium |
| Lib/Utils | 6 | ~500 | Low |
| UI Components | 45 | ~2,000 | Low (generated) |
| **Total** | **74** | **~5,100** | **Medium** |

**Code Quality Score:** 6.5/10

- ✅ Good structure and organization
- ✅ TypeScript usage
- ⚠️ Missing tests
- ⚠️ Inconsistent error handling
- ❌ TypeScript errors ignored
- ❌ Critical validation logic incomplete

---

## 14. Recommendations

### 14.1 Critical Fixes (Before Any Deployment)

#### **Priority 0: Fix Immediately** 🔴

1. **Remove Expected Answer Display**
   - File: `components/problem-step.tsx`
   - Remove lines showing `step.expectedAnswer` to user

2. **Implement Nerdamer Math Validation**
   - Install `nerdamer` package
   - Replace placeholder validation in `/api/validate-step`
   - Add comprehensive test suite

3. **Integrate OpenAI API**
   - Install `openai` package
   - Replace placeholder chat responses
   - Implement conversation context
   - Add guardrails against answer leakage

4. **Secure Admin Routes**
   - Add authentication to `/api/admin/*`
   - Implement admin role verification
   - Add audit logging

5. **Fix Access Code Race Condition**
   - Use Firestore transactions
   - Prevent duplicate claims

#### **Priority 1: Fix Before Pilot Study** ⚠️

6. **Implement Proper Session Management**
   - Add httpOnly cookies
   - Server-side session validation
   - Session expiry mechanism

7. **Add Firestore Security Rules**
   - Implement rules from Section 6.3
   - Test with Firebase emulator

8. **Log Incorrect Attempts**
   - Modify logging to capture all attempts
   - Critical for help-seeking analysis

9. **Fix Timer Logic**
   - Start timer on first interaction, not page load
   - Use server-side timestamps

10. **Add Rate Limiting**
    - Protect access code verification
    - Protect AI chat endpoint
    - Protect admin endpoints

11. **Implement Logout Route**
    - Create `/api/auth/logout`
    - Update session endTime

12. **Add Error Boundaries**
    - Wrap page components
    - Implement retry logic
    - Prevent data loss

#### **Priority 2: Before Full Study** ℹ️

13. **Add Consent Page**
    - Informed consent form
    - Privacy policy
    - Data usage explanation

14. **Implement Data Export**
    - Participant data download
    - GDPR Article 20 compliance

15. **Add Comprehensive Testing**
    - Unit tests for validation
    - Integration tests for API routes
    - E2E tests for user flows

16. **Improve Data Collection**
    - Add missing metrics (see Section 11.2)
    - Implement problem-level aggregations
    - Add session-level metrics

17. **Performance Optimization**
    - Add Firestore indexes
    - Implement caching
    - Add loading states

18. **Accessibility Improvements**
    - Keyboard navigation
    - Screen reader support
    - ARIA labels

### 14.2 Architectural Improvements

#### **Short Term**

1. **Centralize State Management**
   - Consider Zustand or Redux Toolkit
   - Reduce prop drilling
   - Improve cache invalidation

2. **Standardize Error Handling**
   - Create `ApiError` class
   - Unified error response format
   - Client-side error toast notifications

3. **Add Monitoring**
   - Sentry for error tracking
   - Firebase Analytics for user behavior
   - OpenAI cost monitoring

#### **Long Term**

1. **Microservices Architecture (if scaling)**
   - Separate validation service
   - Separate AI chat service
   - Separate logging service

2. **Advanced Analytics**
   - Real-time dashboard for researchers
   - Automated statistical analysis
   - Anomaly detection

3. **Multi-Study Support**
   - Parameterized studies
   - A/B testing framework
   - Study templates

### 14.3 Research Methodology Improvements

1. **Implement Randomization**
   - Force random assignment to conditions
   - Blocked randomization for balance

2. **Add Attention Checks**
   - Detect inattentive participants
   - Flag suspicious completion times

3. **Pre-Post Assessment**
   - Baseline calculus knowledge test
   - Post-study learning assessment

4. **Extended Surveys**
   - Pre-study: demographics, prior knowledge
   - Post-study: satisfaction, perceived learning

5. **Pilot Study Protocol**
   - Test with 10 participants
   - Validate data collection
   - Check for technical issues
   - Refine instructions

### 14.4 Deployment Checklist

**Before Deploying to Production:**

- [ ] All Priority 0 fixes implemented
- [ ] All Priority 1 fixes implemented
- [ ] Nerdamer validation tested with 20+ test cases
- [ ] OpenAI integration tested with 50+ sample conversations
- [ ] Firestore security rules deployed
- [ ] Admin authentication implemented
- [ ] Rate limiting configured
- [ ] Error monitoring setup (Sentry)
- [ ] Backup system configured
- [ ] Environment variables validated
- [ ] Privacy policy and consent form added
- [ ] Pilot study conducted (n=10)
- [ ] IRB/Ethics approval obtained
- [ ] Data retention policy documented
- [ ] Incident response plan created

**Post-Deployment Monitoring:**

- [ ] Monitor error rates (target: <0.1%)
- [ ] Monitor API latency (target: <500ms p95)
- [ ] Monitor OpenAI costs (set budget alert)
- [ ] Daily data backup verification
- [ ] Weekly data integrity checks
- [ ] Participant feedback collection

---

## 15. Conclusion

### 15.1 Summary Assessment

**Current State:** The system demonstrates a well-thought-out architecture with clear separation of concerns and good TypeScript usage. However, **critical implementation gaps** prevent it from being research-ready.

**Key Strengths:**
- ✅ Clean experimental design (control vs AI-assisted)
- ✅ Proper data separation by UID
- ✅ Good Firebase architecture
- ✅ Thoughtful UI/UX design
- ✅ Comprehensive type definitions

**Critical Weaknesses:**
- ❌ Math validation is placeholder only (research-invalidating)
- ❌ AI tutor is not functional (experimental condition invalid)
- ❌ Expected answer exposed to participants (research-invalidating)
- ❌ No admin authentication (security critical)
- ❌ No comprehensive error handling (data loss risk)
- ❌ Insufficient logging (missing key metrics)

### 15.2 Deployment Readiness

**Current:** ~60% ready for production

**Timeline Estimate for Production-Ready:**

- **2-3 weeks:** Implement Priority 0 fixes (critical issues)
- **1-2 weeks:** Implement Priority 1 fixes (security & reliability)
- **1 week:** Testing and pilot study
- **Total:** 4-6 weeks of development

**Minimum Viable Product:**
- Math validation with Nerdamer
- OpenAI integration
- Remove expected answer display
- Admin authentication
- Basic error handling

**Research-Grade Product:**
- All above + Priority 1 fixes
- Comprehensive testing
- Pilot study completed
- Full documentation

### 15.3 Risk Assessment

**High Risk (Red Flags):**
1. Math validation inaccuracy → invalid data
2. Expected answer visible → contaminated experiment
3. No admin auth → data breach risk
4. Placeholder AI → experimental condition invalid

**Medium Risk:**
1. Session management gaps → participant confusion
2. Missing error handling → data loss
3. No incorrect attempt logging → incomplete analysis

**Low Risk:**
1. Performance optimization needed
2. UI/UX improvements desirable
3. Advanced features missing

### 15.4 Final Recommendation

**DO NOT DEPLOY** in current state for real research participants.

**Recommended Path Forward:**

1. **Week 1-2:** Focus exclusively on math validation
   - Install and configure Nerdamer
   - Write comprehensive test suite (30+ test cases)
   - Test against all problem answers
   - Remove expected answer display

2. **Week 3-4:** Implement OpenAI integration
   - Set up OpenAI account and API key
   - Implement conversation context
   - Test guardrails against answer leakage
   - Monitor costs during testing

3. **Week 5:** Security and reliability
   - Admin authentication
   - Firestore security rules
   - Error boundaries and logging
   - Rate limiting

4. **Week 6:** Testing and pilot
   - Unit and integration tests
   - Pilot study with 10 participants
   - Analyze pilot data for issues
   - Refine based on feedback

5. **Week 7+:** Full deployment

**The platform has strong architectural foundations, but requires significant implementation work before it can generate valid research data. Prioritize correctness over features.**

---

## Appendix A: File-by-File Analysis

[Additional detailed analysis of each file available upon request]

## Appendix B: Firestore Schema Design

[Complete Firestore data model with sample documents]

## Appendix C: Test Plan

[Comprehensive test cases for all critical functionality]

## Appendix D: Deployment Guide

[Step-by-step deployment instructions for production]

---

**Document Version:** 1.0  
**Last Updated:** March 5, 2026  
**Author:** Technical Analysis (GitHub Copilot)  
**Status:** DRAFT - For Review by Research Team
