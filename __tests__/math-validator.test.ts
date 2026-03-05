/**
 * Math Validator Test Suite
 * 
 * Comprehensive tests for the math validation module.
 * Tests algebraic equivalence, notation handling, and edge cases.
 */

import { validateMathExpression, validateStepAnswer } from '../lib/math-validator';

describe('Math Validator - Basic Equivalence', () => {
  test('identical expressions should match', () => {
    const result = validateMathExpression('2x + 3', '2x + 3');
    expect(result.isCorrect).toBe(true);
  });

  test('reordered terms should match', () => {
    const result = validateMathExpression('3x^2 + 4x', '4x + 3x^2');
    expect(result.isCorrect).toBe(true);
  });

  test('different expressions should not match', () => {
    const result = validateMathExpression('2x + 1', '2x + 2');
    expect(result.isCorrect).toBe(false);
  });

  test('constant zero should match zero', () => {
    const result = validateMathExpression('0', '0');
    expect(result.isCorrect).toBe(true);
  });
});

describe('Math Validator - Notation Variations', () => {
  test('should accept ** and ^ for exponents', () => {
    const result1 = validateMathExpression('x**2', 'x^2');
    expect(result1.isCorrect).toBe(true);

    const result2 = validateMathExpression('x^2', 'x**2');
    expect(result2.isCorrect).toBe(true);
  });

  test('should handle implicit multiplication', () => {
    const result1 = validateMathExpression('2x', '2*x');
    expect(result1.isCorrect).toBe(true);

    const result2 = validateMathExpression('3x^2', '3*x^2');
    expect(result2.isCorrect).toBe(true);
  });

  test('should handle spaces', () => {
    const result = validateMathExpression('2 x + 3', '2x+3');
    expect(result.isCorrect).toBe(true);
  });

  test('should handle case insensitivity', () => {
    const result1 = validateMathExpression('2X', '2x');
    expect(result1.isCorrect).toBe(true);

    const result2 = validateMathExpression('SIN(x)', 'sin(x)');
    expect(result2.isCorrect).toBe(true);
  });
});

describe('Math Validator - Algebraic Simplification', () => {
  test('should simplify complex expressions', () => {
    const result = validateMathExpression('x + x', '2x');
    expect(result.isCorrect).toBe(true);
  });

  test('should recognize equivalent polynomial forms', () => {
    const result = validateMathExpression('(x+1)^2', 'x^2 + 2x + 1');
    expect(result.isCorrect).toBe(true);
  });

  test('should handle factored vs expanded forms', () => {
    const result = validateMathExpression('(x+2)(x+3)', 'x^2 + 5x + 6');
    expect(result.isCorrect).toBe(true);
  });

  test('should simplify fractions', () => {
    const result = validateMathExpression('2x/2', 'x');
    expect(result.isCorrect).toBe(true);
  });
});

describe('Math Validator - Calculus Derivatives', () => {
  test('power rule: d/dx(x^2) = 2x', () => {
    const result = validateMathExpression('2x', '2*x');
    expect(result.isCorrect).toBe(true);
  });

  test('power rule: d/dx(x^3) = 3x^2', () => {
    const result = validateMathExpression('3x^2', '3*x^2');
    expect(result.isCorrect).toBe(true);
  });

  test('constant multiple: d/dx(5x^2) = 10x', () => {
    const result = validateMathExpression('10x', '10*x');
    expect(result.isCorrect).toBe(true);
  });

  test('sum rule: d/dx(x^2 + x) = 2x + 1', () => {
    const result = validateMathExpression('2x + 1', '1 + 2x');
    expect(result.isCorrect).toBe(true);
  });

  test('polynomial: d/dx(2x^3 + 3x^2 - 5x + 7) = 6x^2 + 6x - 5', () => {
    const result = validateMathExpression('6x^2 + 6x - 5', '6x^2 + 6x - 5');
    expect(result.isCorrect).toBe(true);
  });
});

describe('Math Validator - Trigonometric Functions', () => {
  test('d/dx(sin(x)) = cos(x)', () => {
    const result = validateMathExpression('cos(x)', 'cos(x)');
    expect(result.isCorrect).toBe(true);
  });

  test('d/dx(cos(x)) = -sin(x)', () => {
    const result = validateMathExpression('-sin(x)', '-sin(x)');
    expect(result.isCorrect).toBe(true);
  });

  test('constant multiple: d/dx(3sin(x)) = 3cos(x)', () => {
    const result = validateMathExpression('3cos(x)', '3*cos(x)');
    expect(result.isCorrect).toBe(true);
  });

  test('chain rule: d/dx(sin(2x)) = 2cos(2x)', () => {
    const result = validateMathExpression('2cos(2x)', '2*cos(2*x)');
    expect(result.isCorrect).toBe(true);
  });
});

describe('Math Validator - Exponential and Logarithmic', () => {
  test('exponential: e^x derivative', () => {
    const result = validateMathExpression('e^x', 'e^x');
    expect(result.isCorrect).toBe(true);
  });

  test('natural log: d/dx(ln(x)) = 1/x', () => {
    const result = validateMathExpression('1/x', '1/x');
    expect(result.isCorrect).toBe(true);
  });

  test('exponential with coefficient', () => {
    const result = validateMathExpression('2e^x', '2*e^x');
    expect(result.isCorrect).toBe(true);
  });
});

describe('Math Validator - Edge Cases', () => {
  test('empty user answer should fail', () => {
    const result = validateMathExpression('', '2x');
    expect(result.isCorrect).toBe(false);
    expect(result.errorType).toBe('syntax_error');
  });

  test('whitespace-only answer should fail', () => {
    const result = validateMathExpression('   ', '2x');
    expect(result.isCorrect).toBe(false);
    expect(result.errorType).toBe('syntax_error');
  });

  test('should handle negative coefficients', () => {
    const result = validateMathExpression('-2x', '-2*x');
    expect(result.isCorrect).toBe(true);
  });

  test('should handle multiple variables (if supported)', () => {
    const result = validateMathExpression('2x + 3y', '3y + 2x');
    expect(result.isCorrect).toBe(true);
  });

  test('invalid syntax should return error', () => {
    const result = validateMathExpression('2x +', '2x');
    expect(result.isCorrect).toBe(false);
    expect(result.errorType).toBeDefined();
  });

  test('mismatched parentheses should return error', () => {
    const result = validateMathExpression('(2x + 3', '2x + 3');
    expect(result.isCorrect).toBe(false);
  });
});

describe('Math Validator - Real Problem Answers', () => {
  // Problem 1: f(x) = 2x² + 3x - 5
  test('Problem 1 - Step 1: Identify Rule', () => {
    const result = validateMathExpression('Power Rule', 'Power Rule');
    expect(result.isCorrect).toBe(true);
  });

  test('Problem 1 - Final Answer: 4x + 3', () => {
    const result1 = validateMathExpression('4x + 3', '4x + 3');
    expect(result1.isCorrect).toBe(true);

    const result2 = validateMathExpression('3 + 4x', '4x + 3');
    expect(result2.isCorrect).toBe(true);
  });

  // Problem 2: f(x) = sin(x) + cos(x)
  test('Problem 2 - Final Answer: cos(x) - sin(x)', () => {
    const result1 = validateMathExpression('cos(x) - sin(x)', 'cos(x) - sin(x)');
    expect(result1.isCorrect).toBe(true);

    const result2 = validateMathExpression('-sin(x) + cos(x)', 'cos(x) - sin(x)');
    expect(result2.isCorrect).toBe(true);
  });

  // Problem 3: f(x) = (3x + 1)²
  test('Problem 3 - Final Answer: 6(3x + 1)', () => {
    const result1 = validateMathExpression('6(3x + 1)', '6(3x + 1)');
    expect(result1.isCorrect).toBe(true);

    const result2 = validateMathExpression('18x + 6', '6(3x + 1)');
    expect(result2.isCorrect).toBe(true);
  });

  // Problem 4: f(x) = x³ - 2x² + 4x - 7
  test('Problem 4 - Final Answer: 3x² - 4x + 4', () => {
    const result1 = validateMathExpression('3x^2 - 4x + 4', '3x^2 - 4x + 4');
    expect(result1.isCorrect).toBe(true);

    const result2 = validateMathExpression('3x**2 - 4x + 4', '3x^2 - 4x + 4');
    expect(result2.isCorrect).toBe(true);
  });

  // Problem 5: f(x) = e^x + ln(x)
  test('Problem 5 - Final Answer: e^x + 1/x', () => {
    const result1 = validateMathExpression('e^x + 1/x', 'e^x + 1/x');
    expect(result1.isCorrect).toBe(true);
  });
});

describe('validateStepAnswer - Step Type Handling', () => {
  test('should provide rule-specific feedback', () => {
    const result = validateStepAnswer('wrong', 'Power Rule', 'rule');
    expect(result.isCorrect).toBe(false);
    expect(result.message).toContain('rule');
  });

  test('should provide chain-rule-specific feedback', () => {
    const result = validateStepAnswer('wrong', '6(3x+1)', 'chain-rule');
    expect(result.isCorrect).toBe(false);
    expect(result.message).toContain('Chain rule');
  });

  test('should validate correct answers with step types', () => {
    const result = validateStepAnswer('Power Rule', 'Power Rule', 'rule');
    expect(result.isCorrect).toBe(true);
  });
});

describe('Math Validator - Stress Tests', () => {
  test('should handle very long expressions', () => {
    const expr = 'x^10 + x^9 + x^8 + x^7 + x^6 + x^5 + x^4 + x^3 + x^2 + x + 1';
    const result = validateMathExpression(expr, expr);
    expect(result.isCorrect).toBe(true);
  });

  test('should handle nested functions', () => {
    const result = validateMathExpression('sin(cos(x))', 'sin(cos(x))');
    expect(result.isCorrect).toBe(true);
  });

  test('should handle complex fractions', () => {
    const result = validateMathExpression('(x^2 + 1)/(x + 1)', '(x^2 + 1)/(x + 1)');
    expect(result.isCorrect).toBe(true);
  });
});
