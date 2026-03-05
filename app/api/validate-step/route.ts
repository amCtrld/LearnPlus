/**
 * POST /api/validate-step
 * Validates a student's answer to a problem step using symbolic math validation
 * 
 * Request body: {
 *   problemId: number
 *   stepId: string
 *   studentAnswer: string
 * }
 * Response: { 
 *   isCorrect: boolean
 *   message: string
 *   normalizedUserAnswer?: string
 *   normalizedExpectedAnswer?: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getProblem } from '@/lib/course-data';
import { validateMathExpression, ValidationResult } from '@/lib/math-validator';

export async function POST(request: NextRequest) {
  try {
    const { problemId, stepId, studentAnswer } = await request.json();

    // Validate input
    if (typeof problemId !== 'number' || !stepId || !studentAnswer) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    // Get problem data
    const problem = getProblem(problemId);
    if (!problem) {
      return NextResponse.json(
        { error: 'Problem not found' },
        { status: 404 }
      );
    }

    // Get step data
    const step = problem.steps.find((s) => s.id === stepId);
    if (!step) {
      return NextResponse.json(
        { error: 'Step not found' },
        { status: 404 }
      );
    }

    // Validate using symbolic math validator
    const validationResult: ValidationResult = validateMathExpression(
      studentAnswer,
      step.expectedAnswer
    );

    // Return validation result with detailed feedback
    return NextResponse.json(
      {
        isCorrect: validationResult.isCorrect,
        message: validationResult.message,
        normalizedUserAnswer: validationResult.normalizedUserAnswer,
        normalizedExpectedAnswer: validationResult.normalizedExpectedAnswer,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error validating step:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
