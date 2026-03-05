/**
 * Core TypeScript types for LMS application
 * All user data is keyed by UID (generated from one-time access code)
 */

export type StudyMode = 'control' | 'ai-assisted';

/**
 * AccessCode - Managed by admin, used for one-time authentication
 * Ensures one participant = one UID, no duplicates
 */
export interface AccessCode {
  id?: string; // Firestore document ID
  code: string; // Unique 12-char alphanumeric code
  uid?: string; // Linked when code is used
  created: Date;
  used: boolean;
  usedAt?: Date;
}

/**
 * Session - Tracks a user's study session and progress
 */
export interface Session {
  uid: string; // Primary key - generated from access code
  mode: StudyMode;
  startTime: Date;
  endTime?: Date;
  currentProblemId: number;
  completedProblems: number[];
}

/**
 * Problem - A calculus problem to solve
 */
export interface Problem {
  id: number;
  title: string;
  expression: string; // The expression to differentiate (e.g., "x^3 + 2x^2 - 5x + 1")
  steps: Step[];
}

/**
 * Step - A single step within a problem
 */
export interface Step {
  id: string;
  question: string; // The question posed to the student
  expectedAnswer: string; // The expected derivative or answer
  hint?: string; // Optional hint for students
}

/**
 * LogEntry - Research data per step attempt
 * Used for analyzing cognitive load and learning patterns
 */
export interface LogEntry {
  uid: string;
  timestamp: Date;
  mode: StudyMode;
  problemId: number;
  stepId: string;
  isCorrect: boolean;
  timeSpent: number; // seconds
  aiInteractionCount: number; // 0 for control mode
}

/**
 * SurveyResponse - Cognitive load survey after problem
 * Uses 1-7 Likert scale (1=low, 7=high)
 */
export interface SurveyResponse {
  uid: string;
  problemId: number;
  timestamp: Date;
  mentalDemand: number; // 1-7 Likert
  confidence: number; // 1-7 Likert
  systemHelpfulness: number; // 1-7 Likert (0 for control mode)
}

/**
 * ChatMessage - AI chat message for AI-Assisted mode
 */
export interface ChatMessage {
  id: string;
  uid: string;
  problemId: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/**
 * AuthToken - Stored client-side for session management
 */
export interface AuthToken {
  uid: string;
  code: string; // The access code used
  issuedAt: Date;
  expiresAt: Date;
}
