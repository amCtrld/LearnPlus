# Math Validation Implementation Guide

## Overview

This guide provides step-by-step instructions to replace the placeholder string-based validation with proper symbolic math validation using Nerdamer.

---

## Step 1: Install Nerdamer

```bash
npm install nerdamer
npm install @types/nerdamer --save-dev
```

**Verify installation:**
```bash
npm list nerdamer
```

Should show: `nerdamer@1.x.x`

---

## Step 2: Create Math Validator Module

Create a new file: `lib/math-validator.ts`

```typescript
/**
 * Mathematical expression validator using symbolic computation
 * Ensures algebraically equivalent answers are accepted
 */

// @ts-ignore - Nerdamer types may be incomplete
import nerdamer from 'nerdamer';

// Import Nerdamer modules for algebra and calculus
require('nerdamer/Algebra');
require('nerdamer/Calculus');

export interface ValidationResult {
  isCorrect: boolean;
  normalizedStudent: string;
  normalizedExpected: string;
  error?: string;
  debugInfo?: {
    parsedStudent: string;
    parsedExpected: string;
    difference: string;
  };
}

/**
 * Validates a mathematical expression against the expected answer
 * Uses symbolic computation to accept equivalent forms
 * 
 * Examples of equivalent answers that should be accepted:
 * - "3x^2 + 4x" vs "4x + 3x^2" (different order)
 * - "6x" vs "3*2*x" (different factorization)
 * - "2x" vs "x + x" (algebraic equivalence)
 * 
 * @param studentAnswer The student's submitted answer
 * @param expectedAnswer The correct answer
 * @returns ValidationResult with correctness and debug info
 */
export function validateMathExpression(
  studentAnswer: string,
  expectedAnswer: string
): ValidationResult {
  try {
    // Handle empty answers
    if (!studentAnswer || studentAnswer.trim() === '') {
      return {
        isCorrect: false,
        normalizedStudent: '',
        normalizedExpected: expectedAnswer,
        error: 'Empty answer provided',
      };
    }

    if (!expectedAnswer || expectedAnswer.trim() === '') {
      console.error('Expected answer is empty - configuration error');
      return {
        isCorrect: false,
        normalizedStudent: studentAnswer,
        normalizedExpected: '',
        error: 'Configuration error: expected answer not set',
      };
    }

    // Preprocess answers for common formatting issues
    const preprocessed = preprocessExpression(studentAnswer);
    
    // Parse both expressions with Nerdamer
    let studentExpr = nerdamer(preprocessed);
    let expectedExpr = nerdamer(expectedAnswer);

    // Store original parsed forms for debugging
    const parsedStudent = studentExpr.toString();
    const parsedExpected = expectedExpr.toString();

    // Expand and simplify both expressions
    // This handles cases like (x+1)^2 vs x^2 + 2x + 1
    studentExpr = studentExpr.expand().simplify();
    expectedExpr = expectedExpr.expand().simplify();

    // Get normalized forms
    const normalizedStudent = studentExpr.toString();
    const normalizedExpected = expectedExpr.toString();

    // Check for exact match after normalization
    if (normalizedStudent === normalizedExpected) {
      return {
        isCorrect: true,
        normalizedStudent,
        normalizedExpected,
      };
    }

    // Check algebraic equivalence by subtraction
    // If (expected - student) simplifies to 0, they're equivalent
    const difference = nerdamer.subtract(expectedExpr, studentExpr);
    const simplifiedDiff = difference.simplify();
    const diffString = simplifiedDiff.toString();

    // Check if difference is zero (various representations)
    const isZero = 
      diffString === '0' || 
      diffString === '0.0' ||
      simplifiedDiff.text() === '0';

    return {
      isCorrect: isZero,
      normalizedStudent,
      normalizedExpected,
      debugInfo: {
        parsedStudent,
        parsedExpected,
        difference: diffString,
      },
    };
  } catch (error) {
    // Handle parse errors gracefully
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error('Math validation error:', {
      studentAnswer,
      expectedAnswer,
      error: errorMessage,
    });

    return {
      isCorrect: false,
      normalizedStudent: studentAnswer,
      normalizedExpected: expectedAnswer,
      error: `Could not parse mathematical expression: ${errorMessage}`,
    };
  }
}

/**
 * Preprocesses expressions to handle common student formatting variations
 * 
 * @param expr Raw expression from student
 * @returns Cleaned expression that Nerdamer can parse
 */
function preprocessExpression(expr: string): string {
  let processed = expr.trim();

  // Handle implicit multiplication: 2x → 2*x
  // But be careful not to break function names like sin, cos
  processed = processed.replace(/(\d)([a-z])/gi, '$1*$2');
  
  // Handle superscript characters (if student copies from somewhere)
  processed = processed.replace(/²/g, '^2');
  processed = processed.replace(/³/g, '^3');
  processed = processed.replace(/⁴/g, '^4');
  
  // Normalize whitespace
  processed = processed.replace(/\s+/g, '');
  
  // Handle double stars (Python-style exponentiation) → caret
  processed = processed.replace(/\*\*/g, '^');

  return processed;
}

/**
 * Special case handler for expressions that Nerdamer might struggle with
 * Returns true if expressions are equivalent by special rules
 */
function checkSpecialCases(student: string, expected: string): boolean {
  const cleanStudent = student.toLowerCase().replace(/\s+/g, '');
  const cleanExpected = expected.toLowerCase().replace(/\s+/g, '');

  // Direct string match after cleaning
  if (cleanStudent === cleanExpected) {
    return true;
  }

  // Handle "0" in various forms
  if ((cleanExpected === '0' || cleanExpected === '0.0') && 
      (cleanStudent === '0' || cleanStudent === '0.0')) {
    return true;
  }

  // Handle constant multiples that might be formatted differently
  // e.g., "24x" vs "24*x"
  if (cleanStudent === cleanExpected.replace(/\*/g, '')) {
    return true;
  }

  return false;
}

/**
 * Validates multiple acceptable answers (for steps with multiple valid forms)
 * 
 * @param studentAnswer Student's answer
 * @param acceptableAnswers Array of acceptable answers
 * @returns ValidationResult for the first matching answer, or failure
 */
export function validateMultipleAnswers(
  studentAnswer: string,
  acceptableAnswers: string[]
): ValidationResult {
  for (const expected of acceptableAnswers) {
    const result = validateMathExpression(studentAnswer, expected);
    if (result.isCorrect) {
      return result;
    }
  }

  // None matched
  return {
    isCorrect: false,
    normalizedStudent: studentAnswer,
    normalizedExpected: acceptableAnswers[0], // Show first as primary
    error: 'Answer does not match any acceptable form',
  };
}
```

---

## Step 3: Create Test Suite

Create: `__tests__/math-validator.test.ts`

```typescript
import { validateMathExpression, validateMultipleAnswers } from '../lib/math-validator';

describe('Math Validator - Basic Expressions', () => {
  test('accepts exact match', () => {
    const result = validateMathExpression('3x^2', '3x^2');
    expect(result.isCorrect).toBe(true);
  });

  test('accepts equivalent order', () => {
    const result = validateMathExpression('4x + 3x^2', '3x^2 + 4x');
    expect(result.isCorrect).toBe(true);
  });

  test('accepts algebraically equivalent forms', () => {
    expect(validateMathExpression('x + x', '2x').isCorrect).toBe(true);
    expect(validateMathExpression('3*2*x', '6x').isCorrect).toBe(true);
  });

  test('rejects incorrect answers', () => {
    expect(validateMathExpression('3x^2', '2x^2').isCorrect).toBe(false);
    expect(validateMathExpression('4x', '5x').isCorrect).toBe(false);
  });

  test('handles whitespace variations', () => {
    expect(validateMathExpression(' 3 x^2 ', '3x^2').isCorrect).toBe(true);
    expect(validateMathExpression('3x ^2', '3x^2').isCorrect).toBe(true);
  });
});

describe('Math Validator - Polynomial Expressions', () => {
  test('accepts different term order', () => {
    const result = validateMathExpression('3x^2 + 4x - 5', '4x - 5 + 3x^2');
    expect(result.isCorrect).toBe(true);
  });

  test('accepts expanded vs factored forms', () => {
    const result = validateMathExpression('x^2 - 1', '(x-1)(x+1)');
    expect(result.isCorrect).toBe(true);
  });

  test('handles negative coefficients', () => {
    expect(validateMathExpression('-5', '-5').isCorrect).toBe(true);
    expect(validateMathExpression('-2x', '-(2x)').isCorrect).toBe(true);
  });

  test('handles zero', () => {
    expect(validateMathExpression('0', '0').isCorrect).toBe(true);
    expect(validateMathExpression('x - x', '0').isCorrect).toBe(true);
  });
});

describe('Math Validator - Product Rule', () => {
  test('accepts unsimplified product rule result', () => {
    const unsimplified = '(x^2 + 1)(3x^2 - 2) + (x^3 - 2x)(2x)';
    const simplified = '5x^4 - 6x^2 - 2';
    
    const result = validateMathExpression(unsimplified, simplified);
    expect(result.isCorrect).toBe(true);
  });
});

describe('Math Validator - Chain Rule', () => {
  test('accepts different factorizations', () => {
    const form1 = '24x(3x^2 + 5)^3';
    const form2 = '4(3x^2 + 5)^3 * 6x';
    
    const result = validateMathExpression(form1, form2);
    expect(result.isCorrect).toBe(true);
  });
});

describe('Math Validator - Trigonometric Functions', () => {
  test('accepts trig derivatives', () => {
    expect(validateMathExpression('cos(x)', 'cos(x)').isCorrect).toBe(true);
  });

  test('accepts trig product rule', () => {
    const answer = 'sin(x)*2*e^(2*x) + e^(2*x)*cos(x)';
    const expected = '2*sin(x)*e^(2*x) + cos(x)*e^(2*x)';
    
    expect(validateMathExpression(answer, expected).isCorrect).toBe(true);
  });
});

describe('Math Validator - Error Handling', () => {
  test('handles empty student answer', () => {
    const result = validateMathExpression('', '3x^2');
    expect(result.isCorrect).toBe(false);
    expect(result.error).toContain('Empty');
  });

  test('handles malformed expressions gracefully', () => {
    const result = validateMathExpression('3x^', '3x^2');
    expect(result.isCorrect).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('handles invalid syntax', () => {
    const result = validateMathExpression('((3x^2', '3x^2');
    expect(result.isCorrect).toBe(false);
  });
});

describe('Math Validator - Multiple Acceptable Answers', () => {
  test('accepts any valid form from list', () => {
    const acceptable = [
      '24x(3x^2 + 5)^3',
      '4(3x^2 + 5)^3 * 6x',
      '6x * 4(3x^2 + 5)^3'
    ];
    
    const result1 = validateMultipleAnswers('24x(3x^2 + 5)^3', acceptable);
    expect(result1.isCorrect).toBe(true);
    
    const result2 = validateMultipleAnswers('6x * 4(3x^2 + 5)^3', acceptable);
    expect(result2.isCorrect).toBe(true);
  });
});

describe('Math Validator - Debug Info', () => {
  test('provides debug information', () => {
    const result = validateMathExpression('x + x', '2x');
    expect(result.debugInfo).toBeDefined();
    expect(result.debugInfo?.parsedStudent).toBeDefined();
    expect(result.debugInfo?.parsedExpected).toBeDefined();
  });
});
```

**Run tests:**
```bash
npm test math-validator
```

---

## Step 4: Update API Route

Update: `app/api/validate-step/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getProblem } from '@/lib/course-data';
import { validateMathExpression } from '@/lib/math-validator';

export async function POST(request: NextRequest) {
  try {
    const { problemId, stepId, studentAnswer } = await request.json();

    // Validate input
    if (typeof problemId !== 'number' || !stepId || !studentAnswer) {
      return NextResponse.json(
        { 
          error: 'Invalid request parameters',
          isCorrect: false 
        },
        { status: 400 }
      );
    }

    // Get problem data
    const problem = getProblem(problemId);
    if (!problem) {
      return NextResponse.json(
        { 
          error: 'Problem not found',
          isCorrect: false 
        },
        { status: 404 }
      );
    }

    // Get step data
    const step = problem.steps.find((s) => s.id === stepId);
    if (!step) {
      return NextResponse.json(
        { 
          error: 'Step not found',
          isCorrect: false 
        },
        { status: 404 }
      );
    }

    // Validate answer using Nerdamer symbolic math
    const validationResult = validateMathExpression(
      studentAnswer,
      step.expectedAnswer
    );

    // Log validation for debugging (remove in production)
    if (!validationResult.isCorrect) {
      console.log('Validation failed:', {
        problemId,
        stepId,
        studentAnswer,
        expectedAnswer: step.expectedAnswer,
        normalized: validationResult.normalizedStudent,
        error: validationResult.error,
      });
    }

    return NextResponse.json(
      { 
        isCorrect: validationResult.isCorrect,
        // Only include debug info in development
        ...(process.env.NODE_ENV === 'development' && {
          debug: validationResult.debugInfo,
        }),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error validating step:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        isCorrect: false 
      },
      { status: 500 }
    );
  }
}
```

---

## Step 5: Add Package.json Script

Update: `package.json`

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:math": "jest math-validator"
  },
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0"
  }
}
```

Configure Jest: `jest.config.js`

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
};
```

---

## Step 6: Validation Testing Checklist

Test with actual problem data:

### Problem 1: Polynomial
```typescript
validateMathExpression('3x^2', '3x^2') // ✓
validateMathExpression('4x', '4x') // ✓
validateMathExpression('3x^2 + 4x - 5', '3x^2 + 4x - 5') // ✓
validateMathExpression('4x - 5 + 3x^2', '3x^2 + 4x - 5') // ✓ (order)
```

### Problem 2: Product Rule
```typescript
validateMathExpression(
  '(x^2 + 1)(3x^2 - 2) + (x^3 - 2x)(2x)',
  '(x^2 + 1)(3x^2 - 2) + (x^3 - 2x)(2x)'
) // ✓
```

### Problem 3: Chain Rule
```typescript
validateMathExpression('24x(3x^2 + 5)^3', '24x(3x^2 + 5)^3') // ✓
validateMathExpression('4(3x^2 + 5)^3 * 6x', '24x(3x^2 + 5)^3') // ✓
```

### Problem 5: Trig + Exponential
```typescript
validateMathExpression(
  'sin(x)*2*e^(2*x) + e^(2*x)*cos(x)',
  '2*sin(x)*e^(2*x) + cos(x)*e^(2*x)'
) // ✓
```

---

## Step 7: Handle Edge Cases

### Update problem data if needed

Some problem steps have multiple valid answers. Update `lib/course-data.ts`:

```typescript
// For steps with multiple acceptable forms:
{
  id: '3-4',
  question: 'Simplify f\'(x).',
  expectedAnswer: '24x(3x^2 + 5)^3',
  alternativeAnswers: [ // Add this field
    '4(3x^2 + 5)^3 * 6x',
    '6x * 4(3x^2 + 5)^3',
  ],
  hint: 'Multiply 4 * 6x to get 24x.',
}
```

Update validation to check alternatives:

```typescript
// In validate-step/route.ts
const answers = [step.expectedAnswer];
if (step.alternativeAnswers) {
  answers.push(...step.alternativeAnswers);
}

const validationResult = validateMultipleAnswers(studentAnswer, answers);
```

---

## Step 8: Monitor in Production

Add validation analytics:

```typescript
// In validate-step/route.ts
import { getAdminFirestore } from '@/lib/firebase';

// After validation
if (process.env.NODE_ENV === 'production') {
  const db = getAdminFirestore();
  await db.collection('validationLogs').add({
    timestamp: new Date(),
    problemId,
    stepId,
    studentAnswer: validationResult.normalizedStudent,
    expectedAnswer: validationResult.normalizedExpected,
    isCorrect: validationResult.isCorrect,
    error: validationResult.error || null,
  });
}
```

---

## Common Issues & Troubleshooting

### Issue 1: "nerdamer is not a function"

**Solution:** Check import statement:
```typescript
// Use this:
import nerdamer from 'nerdamer';

// NOT this:
import { nerdamer } from 'nerdamer';
```

### Issue 2: "Cannot find module 'nerdamer/Algebra'"

**Solution:** Use require instead of import for modules:
```typescript
require('nerdamer/Algebra');
require('nerdamer/Calculus');
```

### Issue 3: Parse errors on valid expressions

**Solution:** Check preprocessing function is being applied:
```typescript
const preprocessed = preprocessExpression(studentAnswer);
let studentExpr = nerdamer(preprocessed);
```

### Issue 4: Exponentials not parsing

**Solution:** Ensure proper exponentiation syntax:
```typescript
// These work:
e^(2*x)
e^(2x)
exp(2*x)

// This doesn't:
e^2x  // needs parentheses
```

---

## Performance Considerations

Nerdamer is fast but not instant:
- Simple expression: ~1ms
- Complex polynomial: ~5ms
- Very complex (nested functions): ~20ms

These are acceptable for user-facing validation.

**If performance becomes an issue:**
1. Cache common validations
2. Use worker threads for heavy computation
3. Rate limit validation requests

---

## Validation Coverage Report

After implementation, verify coverage:

```bash
npm run test:math -- --coverage
```

Target: **100% coverage** for math-validator module.

---

## Next Steps

After implementing math validation:

1. ✅ Install Nerdamer
2. ✅ Create math-validator.ts
3. ✅ Create comprehensive test suite
4. ✅ Update API route
5. ✅ Run all tests
6. ✅ Test with actual problem data
7. ✅ Deploy to staging
8. ✅ Conduct user acceptance testing
9. ✅ Monitor validation logs
10. ✅ Ready for pilot study

---

**Estimated Implementation Time:** 4-6 hours  
**Testing Time:** 2-3 hours  
**Total:** 6-9 hours

**Priority:** 🔴 CRITICAL - Must complete before any participant testing
