# Developer Onboarding Guide

**LearnPlus Learning Platform**  
Developer Setup & Contribution Guide  
Last Updated: March 5, 2026

---

## Table of Contents

1. [Welcome](#welcome)
2. [Prerequisites](#prerequisites)
3. [Getting Started](#getting-started)
4. [Architecture Overview](#architecture-overview)
5. [Project Structure](#project-structure)
6. [Development Workflow](#development-workflow)
7. [Coding Standards](#coding-standards)
8. [Testing Guide](#testing-guide)
9. [Debugging](#debugging)
10. [Contributing](#contributing)
11. [Resources](#resources)

---

## Welcome

Welcome to the LearnPlus development team! This guide will help you set up your development environment and understand the codebase.

### Project Context

LearnPlus is a research-focused learning platform for an MSc dissertation studying the effectiveness of AI-assisted learning in calculus education. The platform compares traditional learning (Control) with AI-tutored learning (AI-Assisted).

### Tech Stack Overview

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict mode)
- **Database:** Firebase Firestore
- **Auth:** Firebase Auth (anonymous sessions)
- **AI:** OpenAI GPT-4o-mini
- **Styling:** Tailwind CSS
- **Testing:** Jest, Playwright, k6
- **Deployment:** Vercel

---

## Prerequisites

### Required Software

Install these tools before starting:

```bash
# Node.js 18+ (check version)
node --version  # Should be v18.0.0 or higher

# pnpm package manager
npm install -g pnpm
pnpm --version  # Should be 8.0.0 or higher

# Git
git --version  # Should be 2.0 or higher

# VS Code (recommended editor)
code --version
```

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "usernamehw.errorlens"
  ]
}
```

Save this to `.vscode/extensions.json`.

### Accounts Required

1. **Firebase Account** (free tier works)
   - For database and authentication
   - https://console.firebase.google.com

2. **OpenAI Account** (requires credits)
   - For AI tutor functionality
   - https://platform.openai.com

3. **Vercel Account** (optional, for deployment)
   - For hosting
   - https://vercel.com

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/learnplus.git
cd learnplus
```

### 2. Install Dependencies

```bash
pnpm install
```

This installs:
- Next.js and React
- Firebase SDKs
- OpenAI SDK
- Nerdamer (math library)
- Testing frameworks
- Development tools

### 3. Set Up Environment Variables

Create `.env.local` file:

```bash
cp .env.example .env.local
```

Fill in the values:

```bash
# Firebase Web Config (from Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Firebase Admin SDK (base64 encoded service account JSON)
FIREBASE_ADMIN_SERVICE_ACCOUNT=base64_encoded_json

# OpenAI API
OPENAI_API_KEY=sk-...

# Admin API Key (generate random string)
ADMIN_API_KEY=admin_your_secure_key_here

# App Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Getting Firebase Credentials:**

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Project Settings → General → Your apps → Web app
4. Copy config values

**Encoding Service Account:**

```bash
# Download service account JSON from Firebase Console
# Project Settings → Service accounts → Generate new private key

# Encode it
cat firebase-service-account.json | base64 -w 0 > encoded.txt

# Copy contents to FIREBASE_ADMIN_SERVICE_ACCOUNT
```

### 4. Start Development Server

```bash
pnpm dev
```

Visit http://localhost:3000

### 5. Verify Setup

```bash
# Check TypeScript compilation
pnpm tsc --noEmit

# Run tests
pnpm test

# Check linting
pnpm lint
```

If all pass, you're ready to develop! 🎉

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   User Browser                       │
│  - Next.js App Router (React Components)            │
│  - TailwindCSS Styling                              │
│  - Client-side State Management                     │
└──────────────────┬──────────────────────────────────┘
                   │ HTTPS
                   ▼
┌─────────────────────────────────────────────────────┐
│            Vercel Edge Network (CDN)                │
│  - Static Asset Serving                             │
│  - Edge Functions                                   │
│  - SSL Termination                                  │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│         Next.js API Routes (Serverless)             │
│  - Authentication (/api/auth/*)                     │
│  - Chat (/api/chat)                                 │
│  - Validation (/api/validate-step)                  │
│  - Event Logging (/api/log-event)                  │
│  - Survey (/api/survey)                             │
│  - Admin (/api/admin/*)                             │
│  - Health Check (/api/health)                       │
└──────┬────────────────────┬─────────────────────────┘
       │                    │
       │ Firebase           │ OpenAI
       │ Admin SDK          │ API
       ▼                    ▼
┌──────────────┐     ┌──────────────┐
│   Firebase   │     │   OpenAI     │
│   Firestore  │     │   GPT-4o     │
│              │     │              │
│ - users      │     │ - Chat       │
│ - events     │     │ - Completion │
│ - surveys    │     │              │
│ - accessCodes│     └──────────────┘
│ - chatLogs   │
└──────────────┘
```

### Request Flow

**User Submits Answer:**

1. User clicks "Submit Answer" in browser
2. `ProblemStep` component calls `/api/validate-step`
3. API route validates auth session cookie
4. Checks rate limit (20 requests/hour)
5. Calls `validateAnswer()` from `lib/math-validator.ts`
6. Nerdamer evaluates mathematical expression
7. Logs event to Firestore via `lib/logger.ts`
8. Returns result to client
9. Component updates UI

**AI Chat Message:**

1. User types message in chat panel
2. `ChatPanel` component calls `/api/chat`
3. API validates user is in AI-Assisted mode
4. Checks rate limit (30 requests/hour)
5. Sends message to OpenAI with conversation history
6. OpenAI returns tutor response
7. Saves chat log to Firestore
8. Returns response to client
9. Component displays AI message

### Data Flow

```
User Action → Component → API Route → Business Logic → External Service
                    ↓
                   State Update ← Response
```

### Key Design Patterns

1. **Server-Side API Routes**: All business logic in API routes, not client components
2. **Cookie-Based Sessions**: Anonymous authentication via session cookies
3. **Rate Limiting**: In-memory rate limiting per user/endpoint
4. **Error Boundaries**: Graceful error handling at component and API levels
5. **Optimistic UI**: Immediate feedback, then sync with server
6. **Caching**: In-memory caching for problems and sessions

---

## Project Structure

```
learnplus/
├── app/                          # Next.js App Router
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout (theme, fonts)
│   ├── page.tsx                 # Home page (redirects to /access-code)
│   │
│   ├── access-code/             # Access code entry
│   │   └── page.tsx
│   │
│   ├── dashboard/               # User dashboard (problem list)
│   │   └── page.tsx
│   │
│   ├── problem/[id]/            # Dynamic problem pages
│   │   └── page.tsx
│   │
│   ├── select-mode/             # Mode selection (if needed)
│   │   └── page.tsx
│   │
│   ├── admin/                   # Admin pages
│   │   ├── generate-codes/
│   │   └── research-data/
│   │
│   └── api/                     # API routes
│       ├── auth/                # Authentication
│       │   ├── verify-access-code/
│       │   └── logout/
│       ├── chat/                # AI chat
│       ├── validate-step/       # Answer validation
│       ├── log-event/           # Event logging
│       ├── survey/              # Survey submission
│       ├── admin/               # Admin operations
│       │   ├── generate-access-codes/
│       │   ├── export-data/
│       │   └── access-code-status/
│       └── health/              # Health check
│
├── components/                  # React components
│   ├── access-code-input.tsx   # Access code form
│   ├── chat-panel.tsx          # AI chat interface
│   ├── problem-step.tsx        # Problem step display
│   ├── survey-modal.tsx        # Post-study survey
│   ├── auth-provider.tsx       # Auth context
│   ├── theme-provider.tsx      # Theme context
│   └── ui/                     # UI components (shadcn/ui)
│
├── lib/                        # Utility libraries
│   ├── firebase.ts             # Firebase initialization
│   ├── auth.ts                 # Authentication helpers
│   ├── math-validator.ts       # Math validation logic
│   ├── problem-data.ts         # Problem definitions
│   ├── course-data.ts          # Course structure
│   ├── logger.ts               # Event logging
│   ├── types.ts                # TypeScript types
│   └── utils.ts                # Utility functions
│
├── __tests__/                  # Test files
│   ├── setup.ts                # Test setup (mocks)
│   ├── test-utils.ts           # Test helpers
│   ├── api-integration.test.ts # API tests
│   └── error-handling.test.ts  # Error tests
│
├── e2e/                        # E2E tests (Playwright)
│   └── user-flow.spec.ts
│
├── k6-tests/                   # Load tests
│   ├── load-test.js
│   └── smoke-test.js
│
├── docs/                       # Documentation
│   ├── API_DOCUMENTATION.md
│   ├── DEPLOYMENT_GUIDE.md
│   ├── ADMIN_MANUAL.md
│   ├── RESEARCH_DATA_ANALYSIS_GUIDE.md
│   ├── TROUBLESHOOTING.md
│   ├── DEVELOPER_ONBOARDING.md  # This file
│   └── CONFIGURATION.md
│
├── public/                     # Static assets
├── middleware.ts               # Next.js middleware
├── next.config.mjs             # Next.js config
├── tsconfig.json               # TypeScript config
├── jest.config.js              # Jest config
├── playwright.config.ts        # Playwright config
├── package.json                # Dependencies
├── pnpm-lock.yaml             # Lock file
└── README.md                   # Project overview
```

### Key Files Explained

**`lib/firebase.ts`**
- Initializes Firebase client SDK
- Initializes Firebase Admin SDK
- Exports `db` (Firestore), `auth` (Auth)

**`lib/auth.ts`**
- `getUserSession()`: Gets current user from cookie
- `requireAuth()`: Middleware for protected routes
- `verifyAccessCode()`: Validates access code

**`lib/math-validator.ts`**
- `validateAnswer()`: Validates mathematical expressions
- Uses Nerdamer for symbolic math
- Handles edge cases (division by zero, etc.)

**`lib/problem-data.ts`**
- Problem definitions (questions, solutions, hints)
- 10 problems across 3 courses
- Each problem has 3 steps

**`lib/logger.ts`**
- `logEvent()`: Logs user events to Firestore
- `logError()`: Logs errors for monitoring
- Includes timestamps, user context

**`middleware.ts`**
- Runs on every request
- Adds security headers
- Can implement authentication checks
- Can implement rate limiting (currently in API routes)

---

## Development Workflow

### Day-to-Day Development

#### 1. Check Out a Branch

```bash
# Update main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name
```

#### 2. Make Changes

```bash
# Start dev server
pnpm dev

# Make changes to files
# Test in browser at http://localhost:3000
```

#### 3. Test Your Changes

```bash
# Run unit tests
pnpm test

# Run specific test file
pnpm test math-validator

# Run E2E tests
pnpm test:e2e

# Type check
pnpm tsc --noEmit

# Lint
pnpm lint
```

#### 4. Commit Changes

```bash
# Stage changes
git add .

# Commit with meaningful message
git commit -m "feat: Add new problem validation logic"

# Push to remote
git push origin feature/your-feature-name
```

#### 5. Create Pull Request

- Go to GitHub repository
- Click "New Pull Request"
- Select your branch
- Fill in description
- Request review

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Formatting changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```bash
git commit -m "feat(chat): Add conversation history limit"
git commit -m "fix(auth): Fix session cookie expiration"
git commit -m "docs(api): Update API documentation"
git commit -m "test(validation): Add edge case tests"
```

### Branch Naming

```
feature/short-description    # New features
fix/short-description        # Bug fixes
docs/short-description       # Documentation
refactor/short-description   # Refactoring
test/short-description       # Test additions
```

---

## Coding Standards

### TypeScript

#### Always Use Strict Mode

```typescript
// tsconfig.json already enables strict mode
"strict": true
```

#### Define Explicit Types

```typescript
// ❌ Bad
function getUserData(id) {
  return db.collection('users').doc(id).get();
}

// ✅ Good
async function getUserData(id: string): Promise<UserData> {
  const doc = await db.collection('users').doc(id).get();
  return doc.data() as UserData;
}
```

#### Use Interfaces for Objects

```typescript
// ✅ Good
interface Problem {
  id: string;
  title: string;
  steps: Step[];
  difficulty: 'easy' | 'medium' | 'hard';
}
```

#### Avoid `any` Type

```typescript
// ❌ Bad
function processData(data: any): any {
  return data.map((item: any) => item.value);
}

// ✅ Good
function processData(data: DataItem[]): number[] {
  return data.map((item) => item.value);
}
```

### React Components

#### Use Functional Components

```typescript
// ✅ Good
export function ProblemStep({ problem, step }: ProblemStepProps) {
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

#### Use Proper State Management

```typescript
// ✅ Good
const [answer, setAnswer] = useState<string>('');
const [isLoading, setIsLoading] = useState<boolean>(false);
const [error, setError] = useState<Error | null>(null);
```

#### Handle Loading and Error States

```typescript
// ✅ Good
if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
return <Content data={data} />;
```

### API Routes

#### Consistent Error Handling

```typescript
// ✅ Good
export async function POST(request: NextRequest) {
  try {
    // Validate input
    const body = await request.json();
    if (!body.problemId) {
      return NextResponse.json(
        { error: 'Problem ID required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Process request
    const result = await processRequest(body);

    // Return success
    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
```

#### Validate Authentication

```typescript
// ✅ Good
const session = await getUserSession(request);
if (!session) {
  return NextResponse.json(
    { error: 'Unauthorized', code: 'AUTH_ERROR' },
    { status: 401 }
  );
}
```

#### Implement Rate Limiting

```typescript
// ✅ Good
const rateLimitResult = await checkRateLimit(userId, 'CHAT');
if (!rateLimitResult.allowed) {
  return NextResponse.json(
    { error: 'Rate limit exceeded', code: 'RATE_LIMIT_EXCEEDED' },
    { status: 429 }
  );
}
```

### Code Organization

#### Group Related Logic

```typescript
// ✅ Good structure
export async function POST(request: NextRequest) {
  // 1. Authentication
  const session = await getUserSession(request);

  // 2. Validation
  const body = await validateRequest(request);

  // 3. Rate limiting
  await checkRateLimit(session.userId, 'ENDPOINT');

  // 4. Business logic
  const result = await processRequest(body);

  // 5. Logging
  await logEvent('event_type', session.userId, data);

  // 6. Response
  return NextResponse.json({ success: true, data: result });
}
```

#### Extract Reusable Logic

```typescript
// ✅ Good - Extract to utility function
// lib/validation.ts
export function validateMathExpression(expr: string): boolean {
  // Validation logic
}

// Use in multiple places
import { validateMathExpression } from '@/lib/validation';
```

### Naming Conventions

```typescript
// Variables and functions: camelCase
const userName = 'John';
function getUserData() {}

// Components and interfaces: PascalCase
interface UserData {}
function UserProfile() {}

// Constants: UPPER_SNAKE_CASE
const MAX_RETRIES = 3;
const API_BASE_URL = 'https://api.example.com';

// Files: kebab-case
// problem-step.tsx
// user-profile.tsx
// math-validator.ts
```

---

## Testing Guide

### Running Tests

```bash
# All tests
pnpm test

# Watch mode (re-run on changes)
pnpm test:watch

# Coverage report
pnpm test:coverage

# E2E tests
pnpm test:e2e

# E2E in UI mode
pnpm test:e2e:ui

# Load tests
k6 run k6-tests/smoke-test.js
```

### Writing Unit Tests

**Test File Location:**
- Place tests in `__tests__/` directory
- Name files `*.test.ts` or `*.test.tsx`

**Example Test:**

```typescript
// __tests__/math-validator.test.ts
import { validateAnswer } from '@/lib/math-validator';

describe('validateAnswer', () => {
  it('should validate correct answer', () => {
    const result = validateAnswer('2*x', '2x', 'diff-basics-1', 1);
    expect(result.isCorrect).toBe(true);
  });

  it('should reject incorrect answer', () => {
    const result = validateAnswer('3*x', '2x', 'diff-basics-1', 1);
    expect(result.isCorrect).toBe(false);
  });

  it('should handle equivalent expressions', () => {
    const result = validateAnswer('x*2', '2x', 'diff-basics-1', 1);
    expect(result.isCorrect).toBe(true);
  });
});
```

### Writing API Tests

```typescript
// __tests__/api-integration.test.ts
import { createMockRequest, createTestSession } from './test-utils';

describe('POST /api/validate-step', () => {
  it('should validate correct answer', async () => {
    const request = createMockRequest('/api/validate-step', {
      method: 'POST',
      body: {
        problemId: 'diff-basics-1',
        stepNumber: 1,
        userAnswer: '2x'
      },
      session: createTestSession()
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.isCorrect).toBe(true);
  });
});
```

### Writing E2E Tests

```typescript
// e2e/user-flow.spec.ts
import { test, expect } from '@playwright/test';

test('complete problem flow', async ({ page }) => {
  // Navigate to access code page
  await page.goto('/access-code');

  // Enter access code
  await page.fill('input[name="accessCode"]', 'TEST-CODE');
  await page.click('button[type="submit"]');

  // Wait for dashboard
  await page.waitForURL('/dashboard');

  // Click first problem
  await page.click('text=Basic Derivatives');

  // Submit answer
  await page.fill('input[name="answer"]', '2x');
  await page.click('button:has-text("Submit")');

  // Verify success
  await expect(page.locator('.success-message')).toBeVisible();
});
```

### Test Coverage Goals

- **Unit Tests:** >70% coverage for `lib/` directory
- **Integration Tests:** All API routes
- **E2E Tests:** Critical user flows
- **Load Tests:** Before production deployment

---

## Debugging

### Browser DevTools

#### Console Debugging

```typescript
// Add console logs (remove before commit)
console.log('User answer:', userAnswer);
console.log('Expected:', expectedAnswer);
console.log('Result:', result);
```

#### Network Tab

- Check API requests/responses
- Verify request headers (cookies)
- Check response status codes

#### React DevTools

```bash
# Install React DevTools extension
# Inspect component props and state
# View component tree
```

### Server-Side Debugging

#### API Route Logging

```typescript
// Add logging in API routes
console.log('Request body:', await request.json());
console.log('Session:', session);
console.log('Rate limit result:', rateLimitResult);
```

#### Check Vercel Logs

```bash
# Development logs
pnpm dev | tee dev.log

# Production logs
vercel logs --follow
```

### Firebase Debugging

```typescript
// Enable Firestore debug logging
import { enableLogging } from 'firebase/firestore';
enableLogging(true);
```

### TypeScript Errors

```bash
# Check TypeScript errors
pnpm tsc --noEmit

# Fix common issues:
# - Missing type definitions
# - Incorrect type usage
# - Missing imports
```

---

## Contributing

### Code Review Process

1. **Create Pull Request**
   - Clear description
   - Link related issues
   - Include tests

2. **Review Checklist**
   - [ ] Code follows style guide
   - [ ] Tests pass
   - [ ] TypeScript compiles
   - [ ] No console.log statements
   - [ ] Documentation updated
   - [ ] No security issues

3. **Address Feedback**
   - Make requested changes
   - Push updates to same branch
   - Reply to comments

4. **Merge**
   - Squash commits if needed
   - Delete branch after merge

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] E2E tests pass

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings
```

---

## Resources

### Internal Documentation

- **API Reference:** `/docs/API_DOCUMENTATION.md`
- **Deployment Guide:** `/docs/DEPLOYMENT_GUIDE.md`
- **Admin Manual:** `/docs/ADMIN_MANUAL.md`
- **Troubleshooting:** `/docs/TROUBLESHOOTING.md`

### External Documentation

- **Next.js:** https://nextjs.org/docs
- **React:** https://react.dev
- **TypeScript:** https://www.typescriptlang.org/docs
- **Firebase:** https://firebase.google.com/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Jest:** https://jestjs.io/docs
- **Playwright:** https://playwright.dev/docs

### Community

- **Next.js Discord:** https://nextjs.org/discord
- **React Discord:** https://react.dev/community
- **Firebase Discord:** https://discord.gg/BN2cgc3
- **Stack Overflow:** Use tags [next.js], [react], [firebase]

---

## Welcome Checklist

Complete these tasks in your first week:

- [ ] Set up development environment
- [ ] Run application locally
- [ ] Read architecture overview
- [ ] Explore codebase structure
- [ ] Run all tests successfully
- [ ] Fix a "good first issue"
- [ ] Submit first pull request
- [ ] Review someone else's PR
- [ ] Join team communication channels
- [ ] Ask questions when stuck!

---

**Welcome to the team!** 🎉

If you have any questions, don't hesitate to ask in the team chat or create a GitHub issue.

---

**Developer Onboarding Guide Version:** 1.0.0  
**Last Updated:** March 5, 2026  
**Platform Version:** 1.0.0
