/**
 * Sample problem data for the calculus learning study
 * These are derivative problems for participants to solve step-by-step
 * 
 * Performance: Problem data is cached for 1 hour (static content)
 */

import { Problem } from './types';
import { problemCache, createCacheKey } from './cache';

export const problems: Problem[] = [
  {
    id: 1,
    title: 'Power Function',
    expression: 'f(x) = x³',
    steps: [
      {
        id: '1-1',
        question: 'What is the derivative of x³?',
        expectedAnswer: '3x²',
        hint: 'Use the power rule: d/dx(xⁿ) = nxⁿ⁻¹',
      },
    ],
  },
  {
    id: 2,
    title: 'Polynomial',
    expression: 'f(x) = x³ + 2x² - 5x + 1',
    steps: [
      {
        id: '2-1',
        question: 'What is the derivative of the first term (x³)?',
        expectedAnswer: '3x²',
        hint: 'Apply the power rule to each term separately',
      },
      {
        id: '2-2',
        question: 'What is the derivative of the second term (2x²)?',
        expectedAnswer: '4x',
        hint: 'Remember to multiply the coefficient by the power',
      },
      {
        id: '2-3',
        question: 'What is the derivative of the third term (-5x)?',
        expectedAnswer: '-5',
        hint: 'The derivative of a linear term is its coefficient',
      },
      {
        id: '2-4',
        question: 'Combine all terms. What is f\'(x)?',
        expectedAnswer: '3x² + 4x - 5',
        hint: 'Add all the individual derivatives together',
      },
    ],
  },
  {
    id: 3,
    title: 'Product Rule',
    expression: 'f(x) = (x² + 1)(x - 2)',
    steps: [
      {
        id: '3-1',
        question: 'Using the product rule, identify u and v. If u = x² + 1 and v = x - 2, what is u\'?',
        expectedAnswer: '2x',
        hint: 'Find the derivative of the first function',
      },
      {
        id: '3-2',
        question: 'What is v\' (the derivative of x - 2)?',
        expectedAnswer: '1',
        hint: 'The derivative of x is 1, and the derivative of a constant is 0',
      },
      {
        id: '3-3',
        question: 'Apply product rule: f\'(x) = u\'v + uv\'. Simplify the expression.',
        expectedAnswer: '3x² - 4x + 1',
        hint: 'u\'v + uv\' = (2x)(x - 2) + (x² + 1)(1)',
      },
    ],
  },
  {
    id: 4,
    title: 'Quotient Rule',
    expression: 'f(x) = (x² + 1)/(x - 1)',
    steps: [
      {
        id: '4-1',
        question: 'Identify u and v for the quotient rule. If u = x² + 1, what is u\'?',
        expectedAnswer: '2x',
        hint: 'Find the derivative of the numerator',
      },
      {
        id: '4-2',
        question: 'If v = x - 1, what is v\'?',
        expectedAnswer: '1',
        hint: 'Find the derivative of the denominator',
      },
      {
        id: '4-3',
        question: 'Apply quotient rule: f\'(x) = (u\'v - uv\')/v². What is the numerator?',
        expectedAnswer: '2x² - 2x - (x² + 1)',
        hint: '(u\'v - uv\') = (2x)(x - 1) - (x² + 1)(1)',
      },
      {
        id: '4-4',
        question: 'Simplify the numerator. What do you get?',
        expectedAnswer: 'x² - 2x - 1',
        hint: 'Combine like terms: 2x² - 2x - x² - 1',
      },
    ],
  },
  {
    id: 5,
    title: 'Chain Rule',
    expression: 'f(x) = (3x² + 2)⁴',
    steps: [
      {
        id: '5-1',
        question: 'For chain rule, identify the outer function. If u = 3x² + 2, what is the outer function?',
        expectedAnswer: 'u⁴ or u to the power 4',
        hint: 'The outer function is something raised to the 4th power',
      },
      {
        id: '5-2',
        question: 'What is the derivative of u⁴ with respect to u?',
        expectedAnswer: '4u³',
        hint: 'Use the power rule',
      },
      {
        id: '5-3',
        question: 'What is the derivative of u = 3x² + 2 with respect to x?',
        expectedAnswer: '6x',
        hint: 'Apply power rule to each term',
      },
      {
        id: '5-4',
        question: 'Apply chain rule: f\'(x) = (du/dx)(dy/du). Substitute u = 3x² + 2. What is f\'(x)?',
        expectedAnswer: '4(3x² + 2)³ · 6x or 24x(3x² + 2)³',
        hint: 'f\'(x) = 4u³ · 6x where u = 3x² + 2',
      },
    ],
  },
];

/**
 * Get problem by ID with caching
 * Performance: Cached for 1 hour
 */
export function getProblemById(id: number): Problem | undefined {
  const cacheKey = createCacheKey('problem', id);
  
  // Check cache first
  const cached = problemCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Fetch and cache
  const problem = problems.find((p) => p.id === id);
  if (problem) {
    problemCache.set(cacheKey, problem);
  }
  
  return problem;
}

/**
 * Get next problem ID with caching
 */
export function getNextProblemId(currentId: number): number | null {
  const cacheKey = createCacheKey('next-problem', currentId);
  
  // Check cache first
  const cached = problemCache.get(cacheKey);
  if (cached !== null) {
    return cached;
  }
  
  // Fetch and cache
  const nextId = currentId + 1;
  const result = problems.find((p) => p.id === nextId) ? nextId : null;
  problemCache.set(cacheKey, result);
  
  return result;
}

/**
 * Get total problems count (cached)
 */
export function getTotalProblems(): number {
  return problems.length;
}
