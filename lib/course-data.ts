/**
 * Course curriculum data for the LMS
 * Contains the calculus problems and steps for the study
 */

import { Problem } from './types';

export const PROBLEMS: Problem[] = [
  {
    id: 1,
    title: 'Basic Polynomial Differentiation',
    expression: 'x^3 + 2x^2 - 5x + 1',
    steps: [
      {
        id: '1-1',
        question: 'What is the derivative of x^3?',
        expectedAnswer: '3x^2',
        hint: 'Use the power rule: d/dx(x^n) = n*x^(n-1)',
      },
      {
        id: '1-2',
        question: 'What is the derivative of 2x^2?',
        expectedAnswer: '4x',
        hint: 'Apply the power rule to this term.',
      },
      {
        id: '1-3',
        question: 'What is the derivative of -5x?',
        expectedAnswer: '-5',
        hint: 'A linear term differentiates to its coefficient.',
      },
      {
        id: '1-4',
        question: 'What is the derivative of the constant 1?',
        expectedAnswer: '0',
        hint: 'Constants always differentiate to zero.',
      },
      {
        id: '1-5',
        question: 'Combine all the derivatives: What is f\'(x)?',
        expectedAnswer: '3x^2 + 4x - 5',
        hint: 'Add up all the derivatives from the previous steps.',
      },
    ],
  },
  {
    id: 2,
    title: 'Product Rule Application',
    expression: '(x^2 + 1)(x^3 - 2x)',
    steps: [
      {
        id: '2-1',
        question: 'Identify u and v where f(x) = u * v. What is u?',
        expectedAnswer: 'x^2 + 1',
        hint: 'u is the first factor in the product.',
      },
      {
        id: '2-2',
        question: 'What is du/dx?',
        expectedAnswer: '2x',
        hint: 'Differentiate u = x^2 + 1.',
      },
      {
        id: '2-3',
        question: 'What is v?',
        expectedAnswer: 'x^3 - 2x',
        hint: 'v is the second factor in the product.',
      },
      {
        id: '2-4',
        question: 'What is dv/dx?',
        expectedAnswer: '3x^2 - 2',
        hint: 'Differentiate v = x^3 - 2x.',
      },
      {
        id: '2-5',
        question: 'Apply the product rule: d/dx(uv) = u(dv/dx) + v(du/dx). What is f\'(x)?',
        expectedAnswer: '(x^2 + 1)(3x^2 - 2) + (x^3 - 2x)(2x)',
        hint: 'Substitute u, v, du/dx, dv/dx into the product rule formula.',
      },
    ],
  },
  {
    id: 3,
    title: 'Chain Rule Practice',
    expression: '(3x^2 + 5)^4',
    steps: [
      {
        id: '3-1',
        question: 'Identify the outer function. If f(x) = (u)^4, what is u?',
        expectedAnswer: '3x^2 + 5',
        hint: 'The inner function is the one being raised to the 4th power.',
      },
      {
        id: '3-2',
        question: 'What is du/dx?',
        expectedAnswer: '6x',
        hint: 'Differentiate u = 3x^2 + 5.',
      },
      {
        id: '3-3',
        question: 'Apply the chain rule: df/dx = df/du * du/dx. What is f\'(x)?',
        expectedAnswer: '4(3x^2 + 5)^3 * 6x',
        hint: 'First differentiate the outer function, then multiply by du/dx.',
      },
      {
        id: '3-4',
        question: 'Simplify f\'(x).',
        expectedAnswer: '24x(3x^2 + 5)^3',
        hint: 'Multiply 4 * 6x to get 24x.',
      },
    ],
  },
  {
    id: 4,
    title: 'Quotient Rule',
    expression: '(x^2 + 3) / (x^2 - 1)',
    steps: [
      {
        id: '4-1',
        question: 'Identify the numerator (u) and denominator (v). What is u?',
        expectedAnswer: 'x^2 + 3',
        hint: 'u is the top of the fraction.',
      },
      {
        id: '4-2',
        question: 'What is du/dx?',
        expectedAnswer: '2x',
        hint: 'Differentiate u = x^2 + 3.',
      },
      {
        id: '4-3',
        question: 'What is v?',
        expectedAnswer: 'x^2 - 1',
        hint: 'v is the bottom of the fraction.',
      },
      {
        id: '4-4',
        question: 'What is dv/dx?',
        expectedAnswer: '2x',
        hint: 'Differentiate v = x^2 - 1.',
      },
      {
        id: '4-5',
        question: 'Apply the quotient rule: f\'(x) = (v*du/dx - u*dv/dx) / v^2. What is f\'(x)?',
        expectedAnswer: '((x^2 - 1)(2x) - (x^2 + 3)(2x)) / (x^2 - 1)^2',
        hint: 'Substitute into the quotient rule formula carefully.',
      },
      {
        id: '4-6',
        question: 'Simplify the numerator: (x^2 - 1)(2x) - (x^2 + 3)(2x) = ?',
        expectedAnswer: '-8x',
        hint: 'Expand both products and combine like terms.',
      },
    ],
  },
  {
    id: 5,
    title: 'Mixed Rules: Complex Expression',
    expression: 'sin(x) * e^(2x)',
    steps: [
      {
        id: '5-1',
        question: 'This requires the product rule. What is u?',
        expectedAnswer: 'sin(x)',
        hint: 'Identify the first factor.',
      },
      {
        id: '5-2',
        question: 'What is du/dx?',
        expectedAnswer: 'cos(x)',
        hint: 'The derivative of sin(x) is cos(x).',
      },
      {
        id: '5-3',
        question: 'What is v?',
        expectedAnswer: 'e^(2x)',
        hint: 'Identify the second factor.',
      },
      {
        id: '5-4',
        question: 'What is dv/dx? (This requires the chain rule)',
        expectedAnswer: '2*e^(2x)',
        hint: 'The derivative of e^u is e^u * du/dx.',
      },
      {
        id: '5-5',
        question: 'Apply the product rule: f\'(x) = u*dv/dx + v*du/dx. What is f\'(x)?',
        expectedAnswer: 'sin(x)*2*e^(2x) + e^(2x)*cos(x)',
        hint: 'Substitute all components into the product rule.',
      },
    ],
  },
];

export function getProblem(id: number): Problem | undefined {
  return PROBLEMS.find((p) => p.id === id);
}

export function getNextProblemId(currentId: number): number | null {
  const nextProblem = PROBLEMS.find((p) => p.id > currentId);
  return nextProblem ? nextProblem.id : null;
}

export function getTotalProblems(): number {
  return PROBLEMS.length;
}
