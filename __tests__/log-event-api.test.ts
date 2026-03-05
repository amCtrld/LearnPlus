/**
 * Log Event API Test Suite
 * 
 * Tests for Phase 4 enhanced logging API with multiple event types
 */

import { NextRequest } from 'next/server';
import { POST } from '../app/api/log-event/route';

// Mock Firebase Admin
jest.mock('../lib/firebase', () => ({
  getAdminFirestore: jest.fn().mockReturnValue({
    collection: jest.fn().mockReturnValue({
      add: jest.fn().mockResolvedValue({ id: 'mock-doc-id' }),
    }),
  }),
}));

// Mock FieldValue
jest.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    serverTimestamp: jest.fn().mockReturnValue('SERVER_TIMESTAMP'),
  },
}));

describe('Log Event API - POST /api/log-event', () => {
  const createRequest = (body: any) => {
    return new NextRequest('http://localhost:3000/api/log-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  };

  describe('step_attempt events', () => {
    test('should log correct step attempt', async () => {
      const request = createRequest({
        eventType: 'step_attempt',
        uid: 'test-user',
        clientTimestamp: new Date().toISOString(),
        mode: 'control',
        problemId: 1,
        stepId: '1-1',
        studentAnswer: '3x^2',
        isCorrect: true,
        attemptNumber: 1,
        timeSpent: 45,
        aiInteractionCount: 0,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.serverId).toBeDefined();
    });

    test('should log incorrect step attempt', async () => {
      const request = createRequest({
        eventType: 'step_attempt',
        uid: 'test-user',
        clientTimestamp: new Date().toISOString(),
        mode: 'ai-assisted',
        problemId: 1,
        stepId: '1-1',
        studentAnswer: '2x',
        isCorrect: false,
        attemptNumber: 2,
        timeSpent: 30,
        aiInteractionCount: 3,
        validationMessage: 'Not quite right',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    test('should require mode for step_attempt', async () => {
      const request = createRequest({
        eventType: 'step_attempt',
        uid: 'test-user',
        clientTimestamp: new Date().toISOString(),
        problemId: 1,
        stepId: '1-1',
        isCorrect: true,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('required fields');
    });

    test('should require problemId for step_attempt', async () => {
      const request = createRequest({
        eventType: 'step_attempt',
        uid: 'test-user',
        clientTimestamp: new Date().toISOString(),
        mode: 'control',
        stepId: '1-1',
        isCorrect: true,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
    });
  });

  describe('validation events', () => {
    test('should log validation event', async () => {
      const request = createRequest({
        eventType: 'validation',
        uid: 'test-user',
        clientTimestamp: new Date().toISOString(),
        problemId: 1,
        stepId: '1-1',
        studentAnswer: '3x^2',
        expectedAnswer: '3x^2',
        isCorrect: true,
        validationMessage: 'Correct! Well done.',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    test('should require problemId for validation', async () => {
      const request = createRequest({
        eventType: 'validation',
        uid: 'test-user',
        clientTimestamp: new Date().toISOString(),
        stepId: '1-1',
        isCorrect: true,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
    });
  });

  describe('problem_start events', () => {
    test('should log problem start', async () => {
      const request = createRequest({
        eventType: 'problem_start',
        uid: 'test-user',
        clientTimestamp: new Date().toISOString(),
        mode: 'control',
        problemId: 1,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    test('should require mode for problem_start', async () => {
      const request = createRequest({
        eventType: 'problem_start',
        uid: 'test-user',
        clientTimestamp: new Date().toISOString(),
        problemId: 1,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
    });
  });

  describe('problem_completion events', () => {
    test('should log problem completion', async () => {
      const request = createRequest({
        eventType: 'problem_completion',
        uid: 'test-user',
        clientTimestamp: new Date().toISOString(),
        mode: 'ai-assisted',
        problemId: 1,
        totalTimeSpent: 180,
        totalAttempts: 7,
        totalAiInteractions: 5,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    test('should handle zero metrics', async () => {
      const request = createRequest({
        eventType: 'problem_completion',
        uid: 'test-user',
        clientTimestamp: new Date().toISOString(),
        mode: 'control',
        problemId: 1,
        totalTimeSpent: 0,
        totalAttempts: 0,
        totalAiInteractions: 0,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
    });
  });

  describe('General validation', () => {
    test('should require eventType', async () => {
      const request = createRequest({
        uid: 'test-user',
        clientTimestamp: new Date().toISOString(),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('eventType');
    });

    test('should require uid', async () => {
      const request = createRequest({
        eventType: 'problem_start',
        clientTimestamp: new Date().toISOString(),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('uid');
    });

    test('should require clientTimestamp', async () => {
      const request = createRequest({
        eventType: 'problem_start',
        uid: 'test-user',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('clientTimestamp');
    });

    test('should reject unknown event type', async () => {
      const request = createRequest({
        eventType: 'unknown_event',
        uid: 'test-user',
        clientTimestamp: new Date().toISOString(),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Unknown event type');
    });
  });

  describe('Integration scenarios', () => {
    test('should log complete problem flow', async () => {
      // Problem start
      const startRequest = createRequest({
        eventType: 'problem_start',
        uid: 'test-user',
        clientTimestamp: new Date().toISOString(),
        mode: 'ai-assisted',
        problemId: 1,
      });
      const startResponse = await POST(startRequest);
      expect(startResponse.status).toBe(200);

      // Step attempts (incorrect then correct)
      const incorrectRequest = createRequest({
        eventType: 'step_attempt',
        uid: 'test-user',
        clientTimestamp: new Date().toISOString(),
        mode: 'ai-assisted',
        problemId: 1,
        stepId: '1-1',
        studentAnswer: '2x',
        isCorrect: false,
        attemptNumber: 1,
        timeSpent: 20,
        aiInteractionCount: 0,
      });
      const incorrectResponse = await POST(incorrectRequest);
      expect(incorrectResponse.status).toBe(200);

      const correctRequest = createRequest({
        eventType: 'step_attempt',
        uid: 'test-user',
        clientTimestamp: new Date().toISOString(),
        mode: 'ai-assisted',
        problemId: 1,
        stepId: '1-1',
        studentAnswer: '3x^2',
        isCorrect: true,
        attemptNumber: 2,
        timeSpent: 45,
        aiInteractionCount: 2,
      });
      const correctResponse = await POST(correctRequest);
      expect(correctResponse.status).toBe(200);

      // Problem completion
      const completionRequest = createRequest({
        eventType: 'problem_completion',
        uid: 'test-user',
        clientTimestamp: new Date().toISOString(),
        mode: 'ai-assisted',
        problemId: 1,
        totalTimeSpent: 180,
        totalAttempts: 8,
        totalAiInteractions: 6,
      });
      const completionResponse = await POST(completionRequest);
      expect(completionResponse.status).toBe(200);
    });

    test('should handle both study modes', async () => {
      const modes = ['control', 'ai-assisted'] as const;

      for (const mode of modes) {
        const request = createRequest({
          eventType: 'problem_start',
          uid: `test-user-${mode}`,
          clientTimestamp: new Date().toISOString(),
          mode,
          problemId: 1,
        });

        const response = await POST(request);
        expect(response.status).toBe(200);
      }
    });
  });
});
