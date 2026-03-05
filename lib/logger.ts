/**
 * Enhanced Logging utility for research data
 * Handles comprehensive event tracking that gets sent to server
 * Server then persists to Firestore with server-side timestamps
 * 
 * Phase 4 Improvements:
 * - Logs both correct AND incorrect attempts
 * - Tracks attempt number per step
 * - Timer starts on user interaction, not page load
 * - Server-side timestamps for accuracy
 * - AI interaction count per step (not per problem)
 * - Validation result logging
 */

import { LogEntry, StudyMode } from './types';

export interface AttemptPayload {
  uid: string;
  mode: StudyMode;
  problemId: number;
  stepId: string;
  studentAnswer: string;
  isCorrect: boolean;
  attemptNumber: number;
  timeSpent: number; // seconds
  aiInteractionCount: number;
  validationMessage?: string;
}

export interface EventPayload {
  uid: string;
  mode: StudyMode;
  problemId: number;
  stepId: string;
  isCorrect: boolean;
  timeSpent: number; // seconds
  aiInteractionCount?: number;
}

/**
 * Log a step attempt (both correct and incorrect) to the server
 * Server will persist to Firestore with server-side timestamp
 */
export async function logStepAttempt(payload: AttemptPayload): Promise<void> {
  try {
    const response = await fetch('/api/log-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        eventType: 'step_attempt',
        clientTimestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.error('Failed to log step attempt:', response.statusText);
    }
  } catch (error) {
    console.error('Error logging step attempt:', error);
  }
}

/**
 * Track AI interaction count per step (not per problem)
 * Used to measure help-seeking behavior at step level
 */
export function trackAiInteraction(problemId: number, stepId: string): void {
  const key = `ai_interactions_${problemId}_${stepId}`;
  const count = parseInt(sessionStorage.getItem(key) || '0', 10);
  sessionStorage.setItem(key, String(count + 1));
}

/**
 * Get AI interaction count for current step
 */
export function getAiInteractionCount(problemId: number, stepId: string): number {
  const key = `ai_interactions_${problemId}_${stepId}`;
  return parseInt(sessionStorage.getItem(key) || '0', 10);
}

/**
 * Reset AI interaction count for a step
 */
export function resetAiInteractionCount(problemId: number, stepId: string): void {
  const key = `ai_interactions_${problemId}_${stepId}`;
  sessionStorage.removeItem(key);
}

/**
 * Get attempt count for a step
 */
export function getStepAttemptCount(stepId: string): number {
  const key = `attempt_count_${stepId}`;
  return parseInt(sessionStorage.getItem(key) || '0', 10);
}

/**
 * Increment attempt count for a step
 */
export function incrementStepAttemptCount(stepId: string): number {
  const currentCount = getStepAttemptCount(stepId);
  const newCount = currentCount + 1;
  sessionStorage.setItem(`attempt_count_${stepId}`, String(newCount));
  return newCount;
}

/**
 * Reset attempt count for a step
 */
export function resetStepAttemptCount(stepId: string): void {
  sessionStorage.removeItem(`attempt_count_${stepId}`);
}

/**
 * Track step start time (on first interaction, not page load)
 */
export function startStepTimer(stepId: string): void {
  const key = `step_timer_${stepId}`;
  // Only start timer if not already started
  if (!sessionStorage.getItem(key)) {
    sessionStorage.setItem(key, String(Date.now()));
  }
}

/**
 * Get elapsed time for a step in seconds
 */
export function getStepElapsedTime(stepId: string): number {
  const startTime = sessionStorage.getItem(`step_timer_${stepId}`);
  if (!startTime) return 0;
  return Math.floor((Date.now() - parseInt(startTime, 10)) / 1000); // seconds
}

/**
 * Clear step timer
 */
export function clearStepTimer(stepId: string): void {
  sessionStorage.removeItem(`step_timer_${stepId}`);
}

/**
 * Log validation attempt (for research analysis)
 */
export async function logValidationAttempt(payload: {
  uid: string;
  problemId: number;
  stepId: string;
  studentAnswer: string;
  expectedAnswer: string;
  isCorrect: boolean;
  validationMessage?: string;
}): Promise<void> {
  try {
    const response = await fetch('/api/log-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        eventType: 'validation',
        clientTimestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.error('Failed to log validation:', response.statusText);
    }
  } catch (error) {
    console.error('Error logging validation:', error);
  }
}

/**
 * Log problem start event
 */
export async function logProblemStart(payload: {
  uid: string;
  mode: StudyMode;
  problemId: number;
}): Promise<void> {
  try {
    await fetch('/api/log-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        eventType: 'problem_start',
        clientTimestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error('Error logging problem start:', error);
  }
}

/**
 * Log problem completion event
 */
export async function logProblemCompletion(payload: {
  uid: string;
  mode: StudyMode;
  problemId: number;
  totalTimeSpent: number;
  totalAttempts: number;
  totalAiInteractions: number;
}): Promise<void> {
  try {
    await fetch('/api/log-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        eventType: 'problem_completion',
        clientTimestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error('Error logging problem completion:', error);
  }
}

/**
 * Clear all step-related data from session storage
 */
export function clearStepData(stepId: string): void {
  clearStepTimer(stepId);
  resetStepAttemptCount(stepId);
}

/**
 * Clear all problem-related data from session storage
 */
export function clearProblemData(problemId: number): void {
  // Clear all step-related data for this problem
  const keysToRemove: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (
      key.includes(`_${problemId}_`) || 
      key.startsWith(`step_timer_${problemId}-`) ||
      key.startsWith(`attempt_count_${problemId}-`)
    )) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => sessionStorage.removeItem(key));
}

