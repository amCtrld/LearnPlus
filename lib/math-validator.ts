/**
 * Math Validation Module
 * 
 * Provides symbolic math validation using Nerdamer for algebraic equivalence checking.
 * Handles differentiation problems by comparing symbolic expressions rather than strings.
 * 
 * Features:
 * - Symbolic equivalence (3x^2 + 4x === 4x + 3x^2)
 * - Algebraic simplification
 * - Multiple notation support (x^2 vs x**2)
 * - Trigonometric function handling
 * - Logarithm and exponential support
 */

import nerdamer from 'nerdamer';
import 'nerdamer/Algebra';
import 'nerdamer/Calculus';
import 'nerdamer/Solve';

export interface ValidationResult {
  isCorrect: boolean;
  message: string;
  normalizedUserAnswer?: string;
  normalizedExpectedAnswer?: string;
  errorType?: 'parse_error' | 'syntax_error' | 'equivalence_failed';
}

/**
 * Normalize mathematical expression for comparison
 * - Converts ** to ^ for exponents
 * - Removes spaces
 * - Handles implicit multiplication (2x -> 2*x)
 * - Standardizes function names
 */
function normalizeExpression(expr: string): string {
  let normalized = expr
    .trim()
    .replace(/\s+/g, '') // Remove all spaces
    .replace(/\*\*/g, '^') // Convert ** to ^
    .replace(/×/g, '*') // Convert × to *
    .replace(/÷/g, '/') // Convert ÷ to /
    .toLowerCase(); // Standardize case

  // Handle implicit multiplication: 2x -> 2*x, 3sin(x) -> 3*sin(x)
  normalized = normalized.replace(/(\d)([a-z])/g, '$1*$2');
  normalized = normalized.replace(/(\))(\()/g, '$1*$2');
  normalized = normalized.replace(/(\d)(\()/g, '$1*$2');
  normalized = normalized.replace(/(\))([a-z])/g, '$1*$2');

  return normalized;
}

/**
 * Check if expression contains only allowed characters for calculus differentiation
 */
function isValidCalculusExpression(expr: string): boolean {
  // Allow: numbers, operators, variables (x,y,z), functions (sin,cos,tan,ln,log,exp), parentheses
  const validPattern = /^[0-9+\-*/^().xyzsincotan le]+$/;
  return validPattern.test(expr.replace(/\s/g, ''));
}

/**
 * Parse expression using Nerdamer with error handling
 */
function parseExpression(expr: string): any {
  try {
    return nerdamer(expr);
  } catch (error) {
    // Try adding explicit multiplication for common patterns
    const withExplicitMult = expr
      .replace(/(\d)([a-z])/gi, '$1*$2')
      .replace(/(\))(\()/g, '$1*$2');
    
    try {
      return nerdamer(withExplicitMult);
    } catch (retryError) {
      throw new Error(`Cannot parse expression: ${expr}`);
    }
  }
}

/**
 * Compare two mathematical expressions for algebraic equivalence
 * 
 * @param userAnswer - User's submitted answer
 * @param expectedAnswer - Correct answer from problem data
 * @returns ValidationResult with comparison details
 */
export function validateMathExpression(
  userAnswer: string,
  expectedAnswer: string
): ValidationResult {
  // Handle empty inputs
  if (!userAnswer || userAnswer.trim() === '') {
    return {
      isCorrect: false,
      message: 'Please enter an answer',
      errorType: 'syntax_error',
    };
  }

  if (!expectedAnswer || expectedAnswer.trim() === '') {
    return {
      isCorrect: false,
      message: 'Expected answer not configured',
      errorType: 'syntax_error',
    };
  }

  try {
    // Normalize both expressions
    const normalizedUser = normalizeExpression(userAnswer);
    const normalizedExpected = normalizeExpression(expectedAnswer);

    // Quick check: if normalized strings match exactly, it's correct
    if (normalizedUser === normalizedExpected) {
      return {
        isCorrect: true,
        message: 'Correct! Your answer matches exactly.',
        normalizedUserAnswer: normalizedUser,
        normalizedExpectedAnswer: normalizedExpected,
      };
    }

    // Validate expression format
    if (!isValidCalculusExpression(normalizedUser)) {
      return {
        isCorrect: false,
        message: 'Invalid mathematical expression. Please check your syntax.',
        errorType: 'syntax_error',
      };
    }

    // Parse expressions using Nerdamer
    let userExpr, expectedExpr;
    
    try {
      userExpr = parseExpression(normalizedUser);
      expectedExpr = parseExpression(normalizedExpected);
    } catch (parseError: any) {
      return {
        isCorrect: false,
        message: `Unable to parse expression: ${parseError.message}`,
        errorType: 'parse_error',
      };
    }

    // Simplify both expressions
    const simplifiedUser = userExpr.expand().simplify().toString();
    const simplifiedExpected = expectedExpr.expand().simplify().toString();

    // Check if simplified forms match
    if (simplifiedUser === simplifiedExpected) {
      return {
        isCorrect: true,
        message: 'Correct! Your answer is algebraically equivalent.',
        normalizedUserAnswer: simplifiedUser,
        normalizedExpectedAnswer: simplifiedExpected,
      };
    }

    // Try subtracting and checking if result is zero
    try {
      const difference = nerdamer(`(${normalizedUser})-(${normalizedExpected})`);
      const simplifiedDiff = difference.expand().simplify().toString();
      
      if (simplifiedDiff === '0' || simplifiedDiff === '0.0') {
        return {
          isCorrect: true,
          message: 'Correct! Your answer is algebraically equivalent.',
          normalizedUserAnswer: normalizedUser,
          normalizedExpectedAnswer: normalizedExpected,
        };
      }
    } catch (diffError) {
      // If difference check fails, continue to final comparison
    }

    // Try evaluating at multiple test points (for functions of x)
    if (normalizedUser.includes('x') && normalizedExpected.includes('x')) {
      const testPoints = [0, 1, -1, 2, -2, 0.5, -0.5, Math.PI, -Math.PI];
      let allMatch = true;

      for (const testValue of testPoints) {
        try {
          const userValue = nerdamer(normalizedUser, { x: testValue }).evaluate().text();
          const expectedValue = nerdamer(normalizedExpected, { x: testValue }).evaluate().text();
          
          const userNum = parseFloat(userValue);
          const expectedNum = parseFloat(expectedValue);
          
          // Check if values are close (within floating point tolerance)
          if (Math.abs(userNum - expectedNum) > 1e-10) {
            allMatch = false;
            break;
          }
        } catch (evalError) {
          // If evaluation fails at any point, skip this test
          allMatch = false;
          break;
        }
      }

      if (allMatch) {
        return {
          isCorrect: true,
          message: 'Correct! Your answer is algebraically equivalent.',
          normalizedUserAnswer: normalizedUser,
          normalizedExpectedAnswer: normalizedExpected,
        };
      }
    }

    // If we reach here, expressions are not equivalent
    return {
      isCorrect: false,
      message: 'Incorrect. Please check your work and try again.',
      normalizedUserAnswer: simplifiedUser,
      normalizedExpectedAnswer: simplifiedExpected,
      errorType: 'equivalence_failed',
    };

  } catch (error: any) {
    console.error('Math validation error:', error);
    return {
      isCorrect: false,
      message: 'Error validating expression. Please check your syntax.',
      errorType: 'parse_error',
    };
  }
}

/**
 * Validate step answer with detailed feedback
 * This is the main entry point used by the API
 */
export function validateStepAnswer(
  userAnswer: string,
  expectedAnswer: string,
  stepType: 'rule' | 'chain-rule' | 'answer' = 'answer'
): ValidationResult {
  const result = validateMathExpression(userAnswer, expectedAnswer);
  
  // Add step-specific feedback
  if (!result.isCorrect && stepType === 'rule') {
    result.message = 'Incorrect differentiation rule. Review the function form.';
  } else if (!result.isCorrect && stepType === 'chain-rule') {
    result.message = 'Chain rule application incorrect. Check inner/outer functions.';
  }
  
  return result;
}

/**
 * Test the validator with sample expressions (for development/debugging)
 */
export function testValidator(): void {
  const tests = [
    { user: '3x^2 + 4x', expected: '4x + 3x^2', shouldMatch: true },
    { user: '2*x', expected: '2x', shouldMatch: true },
    { user: 'x^2', expected: 'x**2', shouldMatch: true },
    { user: '0', expected: '0', shouldMatch: true },
    { user: 'sin(x)', expected: 'sin(x)', shouldMatch: true },
    { user: '2x + 1', expected: '2x + 2', shouldMatch: false },
  ];

  console.log('Math Validator Tests:');
  tests.forEach((test, i) => {
    const result = validateMathExpression(test.user, test.expected);
    const pass = result.isCorrect === test.shouldMatch;
    console.log(`Test ${i + 1}: ${pass ? '✓' : '✗'} - ${test.user} vs ${test.expected}`);
    if (!pass) {
      console.log(`  Expected: ${test.shouldMatch}, Got: ${result.isCorrect}`);
      console.log(`  Message: ${result.message}`);
    }
  });
}
