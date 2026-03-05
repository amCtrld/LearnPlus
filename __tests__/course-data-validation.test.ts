/**
 * Integration test: Validate all expected answers from course-data.ts
 * This ensures the math validator works with all real problem data
 */

import { PROBLEMS } from '../lib/course-data';
import { validateMathExpression } from '../lib/math-validator';

describe('Course Data Validation - All Problems', () => {
  describe('Problem 1: Basic Polynomial Differentiation', () => {
    const problem = PROBLEMS[0];

    test('Step 1: d/dx(x^3) = 3x^2', () => {
      const result = validateMathExpression('3x^2', problem.steps[0].expectedAnswer);
      expect(result.isCorrect).toBe(true);
    });

    test('Step 2: d/dx(2x^2) = 4x', () => {
      const result = validateMathExpression('4x', problem.steps[1].expectedAnswer);
      expect(result.isCorrect).toBe(true);
    });

    test('Step 3: d/dx(-5x) = -5', () => {
      const result = validateMathExpression('-5', problem.steps[2].expectedAnswer);
      expect(result.isCorrect).toBe(true);
    });

    test('Step 4: d/dx(1) = 0', () => {
      const result = validateMathExpression('0', problem.steps[3].expectedAnswer);
      expect(result.isCorrect).toBe(true);
    });

    test('Step 5: Final answer 3x^2 + 4x - 5', () => {
      const result = validateMathExpression('3x^2 + 4x - 5', problem.steps[4].expectedAnswer);
      expect(result.isCorrect).toBe(true);
    });

    test('Step 5: Alternative ordering 4x + 3x^2 - 5', () => {
      const result = validateMathExpression('4x + 3x^2 - 5', problem.steps[4].expectedAnswer);
      expect(result.isCorrect).toBe(true);
    });
  });

  describe('Problem 2: Product Rule Application', () => {
    const problem = PROBLEMS[1];

    test('Step 1: u = x^2 + 1', () => {
      const result = validateMathExpression('x^2 + 1', problem.steps[0].expectedAnswer);
      expect(result.isCorrect).toBe(true);
    });

    test('Step 2: du/dx = 2x', () => {
      const result = validateMathExpression('2x', problem.steps[1].expectedAnswer);
      expect(result.isCorrect).toBe(true);
    });

    test('Step 3: v = x^3 - 2x', () => {
      const result = validateMathExpression('x^3 - 2x', problem.steps[2].expectedAnswer);
      expect(result.isCorrect).toBe(true);
    });

    test('Step 4: dv/dx = 3x^2 - 2', () => {
      const result = validateMathExpression('3x^2 - 2', problem.steps[3].expectedAnswer);
      expect(result.isCorrect).toBe(true);
    });

    test('Step 5: Product rule result', () => {
      const result = validateMathExpression(
        '(x^2 + 1)(3x^2 - 2) + (x^3 - 2x)(2x)',
        problem.steps[4].expectedAnswer
      );
      expect(result.isCorrect).toBe(true);
    });
  });

  describe('Problem 3: Chain Rule Practice', () => {
    const problem = PROBLEMS[2];

    test('Step 1: Inner function u = 3x^2 + 5', () => {
      const result = validateMathExpression('3x^2 + 5', problem.steps[0].expectedAnswer);
      expect(result.isCorrect).toBe(true);
    });

    test('Step 2: du/dx = 6x', () => {
      const result = validateMathExpression('6x', problem.steps[1].expectedAnswer);
      expect(result.isCorrect).toBe(true);
    });

    test('Step 3: Chain rule unsimplified', () => {
      const result = validateMathExpression(
        '4(3x^2 + 5)^3 * 6x',
        problem.steps[2].expectedAnswer
      );
      expect(result.isCorrect).toBe(true);
    });

    test('Step 4: Simplified form 24x(3x^2 + 5)^3', () => {
      const result = validateMathExpression('24x(3x^2 + 5)^3', problem.steps[3].expectedAnswer);
      expect(result.isCorrect).toBe(true);
    });

    test('Step 3 and 4: Should be equivalent', () => {
      const result = validateMathExpression(
        problem.steps[2].expectedAnswer,
        problem.steps[3].expectedAnswer
      );
      expect(result.isCorrect).toBe(true);
    });
  });

  describe('Problem 4: Quotient Rule', () => {
    const problem = PROBLEMS[3];

    test('Step 1: Numerator u = x^2 + 3', () => {
      const result = validateMathExpression('x^2 + 3', problem.steps[0].expectedAnswer);
      expect(result.isCorrect).toBe(true);
    });

    test('Step 2: du/dx = 2x', () => {
      const result = validateMathExpression('2x', problem.steps[1].expectedAnswer);
      expect(result.isCorrect).toBe(true);
    });

    test('Step 3: Denominator v = x^2 - 1', () => {
      const result = validateMathExpression('x^2 - 1', problem.steps[2].expectedAnswer);
      expect(result.isCorrect).toBe(true);
    });

    test('Step 4: dv/dx = 2x', () => {
      const result = validateMathExpression('2x', problem.steps[3].expectedAnswer);
      expect(result.isCorrect).toBe(true);
    });

    test('Step 5: Quotient rule formula', () => {
      const result = validateMathExpression(
        '((x^2 - 1)(2x) - (x^2 + 3)(2x)) / (x^2 - 1)^2',
        problem.steps[4].expectedAnswer
      );
      expect(result.isCorrect).toBe(true);
    });

    test('Step 6: Simplified numerator = -8x', () => {
      const result = validateMathExpression('-8x', problem.steps[5].expectedAnswer);
      expect(result.isCorrect).toBe(true);
    });
  });

  describe('Problem 5: Mixed Rules (Product + Chain)', () => {
    const problem = PROBLEMS[4];

    test('Step 1: u = sin(x)', () => {
      const result = validateMathExpression('sin(x)', problem.steps[0].expectedAnswer);
      expect(result.isCorrect).toBe(true);
    });

    test('Step 2: du/dx = cos(x)', () => {
      const result = validateMathExpression('cos(x)', problem.steps[1].expectedAnswer);
      expect(result.isCorrect).toBe(true);
    });

    test('Step 3: v = e^(2x)', () => {
      const result = validateMathExpression('e^(2x)', problem.steps[2].expectedAnswer);
      expect(result.isCorrect).toBe(true);
    });

    test('Step 4: dv/dx = 2*e^(2x)', () => {
      const result = validateMathExpression('2*e^(2x)', problem.steps[3].expectedAnswer);
      expect(result.isCorrect).toBe(true);
    });

    test('Step 5: Product rule result', () => {
      const result = validateMathExpression(
        'sin(x)*2*e^(2x) + e^(2x)*cos(x)',
        problem.steps[4].expectedAnswer
      );
      expect(result.isCorrect).toBe(true);
    });

    test('Step 5: Alternative form with coefficient ordering', () => {
      const result = validateMathExpression(
        '2*sin(x)*e^(2x) + cos(x)*e^(2x)',
        problem.steps[4].expectedAnswer
      );
      expect(result.isCorrect).toBe(true);
    });
  });

  describe('Edge Cases with Course Data', () => {
    test('Alternative notation: ** vs ^ for exponents', () => {
      const problem = PROBLEMS[0];
      const result = validateMathExpression('3x**2 + 4x - 5', problem.steps[4].expectedAnswer);
      expect(result.isCorrect).toBe(true);
    });

    test('Extra spaces should be ignored', () => {
      const problem = PROBLEMS[0];
      const result = validateMathExpression('3x^2  +  4x  -  5', problem.steps[4].expectedAnswer);
      expect(result.isCorrect).toBe(true);
    });

    test('Parentheses that don\'t change meaning', () => {
      const problem = PROBLEMS[0];
      const result = validateMathExpression('(3x^2) + (4x) - (5)', problem.steps[4].expectedAnswer);
      expect(result.isCorrect).toBe(true);
    });

    test('Implicit multiplication: 2x vs 2*x', () => {
      const problem = PROBLEMS[1];
      const result = validateMathExpression('2*x', problem.steps[1].expectedAnswer);
      expect(result.isCorrect).toBe(true);
    });
  });

  describe('Comprehensive All-Steps Validation', () => {
    test('All problem steps should validate their own expected answers', () => {
      let totalSteps = 0;
      let passedSteps = 0;

      PROBLEMS.forEach((problem) => {
        problem.steps.forEach((step) => {
          totalSteps++;
          const result = validateMathExpression(
            step.expectedAnswer,
            step.expectedAnswer
          );
          if (result.isCorrect) {
            passedSteps++;
          } else {
            console.error(
              `Failed validation for Problem ${problem.id}, Step ${step.id}: ${step.expectedAnswer}`
            );
          }
        });
      });

      expect(passedSteps).toBe(totalSteps);
      expect(totalSteps).toBeGreaterThan(0);
    });
  });
});
