/**
 * Test utilities and helpers for integration and E2E tests
 */

import { NextRequest } from 'next/server';

/**
 * Create a mock NextRequest for API testing
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
    cookies?: Record<string, string>;
  } = {}
): NextRequest {
  const { method = 'GET', headers = {}, body, cookies = {} } = options;

  const requestUrl = url.startsWith('http') ? url : `http://localhost:3000${url}`;
  
  const request = new NextRequest(requestUrl, {
    method,
    headers: new Headers({
      'Content-Type': 'application/json',
      ...headers,
    }),
    body: body ? JSON.stringify(body) : undefined,
  });

  // Mock cookies
  Object.entries(cookies).forEach(([key, value]) => {
    (request as any).cookies.set(key, value);
  });

  return request;
}

/**
 * Generate a test access code
 */
export function generateTestAccessCode(): string {
  return `TEST-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
}

/**
 * Create a test user session
 */
export interface TestSession {
  userId: string;
  accessCode: string;
  mode: 'control' | 'ai_assisted';
  sessionCookie: string;
}

export function createTestSession(overrides?: Partial<TestSession>): TestSession {
  const userId = `test-user-${Date.now()}`;
  const accessCode = generateTestAccessCode();
  
  return {
    userId,
    accessCode,
    mode: 'control',
    sessionCookie: `session=${userId}`,
    ...overrides,
  };
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Mock environment variables for testing
 */
export function mockEnv(vars: Record<string, string>): () => void {
  const originalEnv = { ...process.env };
  
  Object.entries(vars).forEach(([key, value]) => {
    process.env[key] = value;
  });
  
  // Return cleanup function
  return () => {
    process.env = originalEnv;
  };
}

/**
 * Create a mock admin request with API key
 */
export function createAdminRequest(
  url: string,
  options: Parameters<typeof createMockRequest>[1] = {}
): NextRequest {
  return createMockRequest(url, {
    ...options,
    headers: {
      ...options.headers,
      'x-admin-key': process.env.ADMIN_API_KEY || 'test-admin-key',
    },
  });
}

/**
 * Parse JSON response
 */
export async function parseResponse(response: Response): Promise<any> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Test data generators
 */
export const testData = {
  /**
   * Generate a valid math answer
   */
  mathAnswer: (problemId: string): string => {
    const answers: Record<string, string> = {
      'diff-basics-1': '2x',
      'diff-basics-2': '3x^2',
      'diff-basics-3': '4x^3',
      'diff-product-1': '2x + x^2',
      'diff-quotient-1': '(2x(x+1) - x^2) / (x+1)^2',
    };
    return answers[problemId] || '0';
  },

  /**
   * Generate an invalid math answer
   */
  invalidMathAnswer: (): string => {
    return 'not a valid expression';
  },

  /**
   * Generate survey responses
   */
  surveyResponses: () => ({
    difficulty: 3,
    aiHelpfulness: 4,
    learningExperience: 5,
    feedback: 'Test feedback for survey',
  }),

  /**
   * Generate chat messages
   */
  chatMessage: (type: 'question' | 'help' | 'hint' = 'help'): string => {
    const messages = {
      question: 'How do I differentiate this function?',
      help: 'I need help with the power rule',
      hint: 'Can you give me a hint?',
    };
    return messages[type];
  },
};

/**
 * Delay helper for testing timing
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a test database entry (mock)
 */
export interface TestDatabaseEntry {
  id: string;
  timestamp: Date;
  data: any;
}

export function createTestDatabaseEntry(data: any): TestDatabaseEntry {
  return {
    id: `test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date(),
    data,
  };
}

/**
 * Assert response status
 */
export function assertResponseStatus(
  response: Response,
  expectedStatus: number
): void {
  if (response.status !== expectedStatus) {
    throw new Error(
      `Expected status ${expectedStatus}, got ${response.status}`
    );
  }
}

/**
 * Assert response contains data
 */
export async function assertResponseContains(
  response: Response,
  key: string
): Promise<any> {
  const data = await parseResponse(response);
  
  if (!(key in data)) {
    throw new Error(`Response does not contain key: ${key}`);
  }
  
  return data;
}

/**
 * Clean up test data (placeholder - implement as needed)
 */
export async function cleanupTestData(userId: string): Promise<void> {
  // In a real implementation, this would clean up test data from Firestore
  // For now, it's a placeholder
  console.log(`Cleaning up test data for user: ${userId}`);
}
