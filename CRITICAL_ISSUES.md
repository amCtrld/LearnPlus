# 🚨 CRITICAL ISSUES - IMMEDIATE ACTION REQUIRED

## Priority 0: Must Fix Before ANY Deployment

### 1. Expected Answer Exposed to Users 🔴
**File:** `components/problem-step.tsx` (line ~91)
```tsx
// REMOVE THIS LINE:
<p className="text-xs text-muted-foreground">
  Expected: <span className="font-mono font-semibold">{step.expectedAnswer}</span>
</p>
```
**Impact:** Participants can see answers → entire experiment invalidated
**Time:** 5 minutes

### 2. Math Validation Non-Functional 🔴
**Files:** `app/api/validate-step/route.ts`, `package.json`

**Current:** String comparison only - will fail for mathematically equivalent answers

**Fix:**
```bash
npm install nerdamer
npm install @types/nerdamer --save-dev
```

Then implement symbolic validation (see full code in Section 4.2 of main analysis).

**Impact:** False negatives will corrupt research data
**Time:** 4-6 hours

### 3. AI Tutor Non-Functional 🔴
**File:** `app/api/chat/route.ts`

**Current:** Hardcoded if-else responses

**Fix:**
```bash
npm install openai
```

Add to `.env`:
```
OPENAI_API_KEY=sk-proj-xxxxx
```

Implement OpenAI integration (see Section 5.2 of main analysis).

**Impact:** Experimental condition is invalid
**Time:** 6-8 hours

### 4. No Admin Authentication 🔴
**Files:** 
- `app/api/admin/generate-access-codes/route.ts`
- `app/api/admin/export-data/route.ts`

**Current:** Anyone can generate codes and download participant data

**Impact:** Security breach, GDPR violation
**Time:** 3-4 hours

### 5. Access Code Race Condition 🔴
**File:** `lib/auth.ts` (verifyAndActivateAccessCode function)

**Current:** Query then update (not atomic)

**Fix:** Use Firestore transaction:
```typescript
await db.runTransaction(async (transaction) => {
  const codeRef = codesRef.doc(codeId);
  const codeDoc = await transaction.get(codeRef);
  
  if (codeDoc.data().used) {
    throw new Error('Code already used');
  }
  
  transaction.update(codeRef, {
    uid,
    used: true,
    usedAt: new Date()
  });
});
```

**Impact:** Multiple participants could use same code
**Time:** 1 hour

---

## Priority 1: Fix Before Pilot Study

### 6. Missing Logout Route ⚠️
**File:** `app/api/auth/logout/route.ts` (MISSING)

Create this file - it's referenced but doesn't exist.

**Time:** 30 minutes

### 7. Incorrect Attempts Not Logged ⚠️
**File:** `app/problem/[id]/page.tsx`

**Current:** Only logs successful attempts

**Required:** Log ALL attempts including incorrect ones (essential for help-seeking analysis)

**Time:** 1 hour

### 8. Timer Starts Too Early ⚠️
**File:** `app/problem/[id]/page.tsx`

**Current:** Timer starts on page mount

**Fix:** Start timer when user focuses input field

**Time:** 30 minutes

### 9. No Firestore Security Rules ⚠️
**File:** `firestore.rules` (MISSING)

**Current:** Database likely wide open

**Impact:** Data can be read/modified by anyone

**Time:** 1 hour

### 10. TypeScript Build Errors Ignored ⚠️
**File:** `next.config.mjs`

```javascript
typescript: {
  ignoreBuildErrors: true, // ← REMOVE THIS
}
```

This masks type errors that could cause runtime bugs.

**Time:** 2-4 hours (fixing resulting errors)

---

## Quick Wins (Low Effort, High Impact)

### A. Add Environment Validation
**File:** Create `lib/env-validation.ts`

Ensures all required environment variables are set before startup.

**Time:** 15 minutes

### B. Add Error Boundaries
**File:** Create `components/error-boundary.tsx`

Prevents white screen of death, improves UX.

**Time:** 30 minutes

### C. Add Rate Limiting
**Package:** `@upstash/ratelimit`

Protect access code endpoint from brute force.

**Time:** 1 hour

### D. Add Loading States
**Files:** Various page components

Replace "Loading..." text with proper spinners and skeleton loaders.

**Time:** 2 hours

---

## Testing Checklist

Before any real participants:

- [ ] Test math validation with 20+ equivalent expressions
- [ ] Test AI tutor with 10+ realistic conversations
- [ ] Test access code system (verify no duplicates)
- [ ] Test data logging (verify all metrics captured)
- [ ] Test survey flow (verify cannot skip)
- [ ] Test with different browsers (Chrome, Firefox, Safari)
- [ ] Test on mobile devices
- [ ] Conduct pilot study with 5-10 test participants

---

## Data Integrity Checks

After pilot study, verify:

- [ ] All log entries have valid timestamps
- [ ] No duplicate step completions
- [ ] timeSpent values are reasonable (0-3600 seconds)
- [ ] aiInteractionCount matches chatHistory records
- [ ] Survey responses are complete (no missing fields)
- [ ] All UIDs correspond to valid access codes

---

## Deployment Environment Variables

Required `.env` file:

```env
# Firebase Client (public)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (secret - never commit)
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=

# OpenAI (secret)
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=400

# Admin Security (secret)
ADMIN_API_KEY=

# Optional
NODE_ENV=production
```

---

## Emergency Contacts / Support

- **Next.js Issues:** https://nextjs.org/docs
- **Firebase Issues:** https://firebase.google.com/support
- **OpenAI Issues:** https://platform.openai.com/docs
- **Nerdamer Docs:** http://nerdamer.com/

---

## Estimated Total Fix Time

| Priority | Tasks | Time Estimate |
|----------|-------|---------------|
| P0 | 5 critical issues | 15-20 hours |
| P1 | 5 high-priority issues | 8-10 hours |
| Testing | Comprehensive testing | 8-12 hours |
| **TOTAL** | **Before pilot-ready** | **31-42 hours** |

With focused effort: **1 full week** of development.

---

## Risk Level by Component

| Component | Risk | Issue |
|-----------|------|-------|
| Math Validation | 🔴 CRITICAL | Non-functional |
| AI Chat | 🔴 CRITICAL | Non-functional |
| Access Codes | 🔴 CRITICAL | Race condition |
| Admin Routes | 🔴 CRITICAL | No auth |
| Data Logging | 🟡 HIGH | Incomplete |
| Session Mgmt | 🟡 HIGH | Security gaps |
| UI/UX | 🟢 LOW | Mostly fine |

---

## Next Steps

1. **Today:** Fix P0 issues 1, 2, 3 (remove answer display, install packages)
2. **This Week:** Complete all P0 fixes
3. **Next Week:** Complete P1 fixes + comprehensive testing
4. **Week 3:** Pilot study with 5-10 test users
5. **Week 4+:** Full deployment (if pilot successful)

**Do not skip the pilot study!** It's essential for validating the system works correctly before collecting real research data.

---

**Last Updated:** March 5, 2026  
**Status:** URGENT - ACTION REQUIRED
