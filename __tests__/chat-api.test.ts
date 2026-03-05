/**
 * Chat API Integration Tests
 * 
 * Tests the full flow of the chat API endpoint with AI tutor integration
 * Note: These tests mock OpenAI API calls to avoid actual API usage during testing
 */

import { NextRequest } from 'next/server';
import { POST } from '../app/api/chat/route';

// Mock the AI tutor module
jest.mock('../lib/ai-tutor', () => ({
  getAITutorResponse: jest.fn().mockResolvedValue({
    message: 'Let me guide you through this. What rule do you think applies here?',
    tokensUsed: 45,
    model: 'gpt-4o-mini',
    timestamp: new Date(),
  }),
  validateAIResponse: jest.fn().mockResolvedValue({
    isValid: true,
  }),
  getFallbackResponse: jest.fn().mockReturnValue(
    'Try thinking about which differentiation rule applies.'
  ),
  estimateCost: jest.fn().mockReturnValue(0.00002),
}));

// Mock Firebase
jest.mock('../lib/firebase', () => ({
  getAdminFirestore: jest.fn().mockReturnValue({
    collection: jest.fn().mockReturnValue({
      add: jest.fn().mockResolvedValue({ id: 'mock-doc-id' }),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({
        docs: [],
      }),
    }),
  }),
}));

describe('Chat API - POST /api/chat', () => {
  const createRequest = (body: any) => {
    return new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  };

  test('should return AI response for valid request', async () => {
    const request = createRequest({
      uid: 'test-user-123',
      problemId: 1,
      stepId: '1-1',
      currentStep: 'What is the derivative of x^3?',
      userMessage: 'Can you give me a hint?',
      mode: 'ai-assisted',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBeTruthy();
    expect(data.tokensUsed).toBeDefined();
    expect(data.model).toBeDefined();
  });

  test('should reject request without uid', async () => {
    const request = createRequest({
      problemId: 1,
      stepId: '1-1',
      currentStep: 'Test question',
      userMessage: 'Help',
      mode: 'ai-assisted',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid');
  });

  test('should reject request without problemId', async () => {
    const request = createRequest({
      uid: 'test-user',
      stepId: '1-1',
      currentStep: 'Test question',
      userMessage: 'Help',
      mode: 'ai-assisted',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid');
  });

  test('should reject request without stepId', async () => {
    const request = createRequest({
      uid: 'test-user',
      problemId: 1,
      currentStep: 'Test question',
      userMessage: 'Help',
      mode: 'ai-assisted',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid');
  });

  test('should reject request without userMessage', async () => {
    const request = createRequest({
      uid: 'test-user',
      problemId: 1,
      stepId: '1-1',
      currentStep: 'Test question',
      mode: 'ai-assisted',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid');
  });

  test('should reject chat in control mode', async () => {
    const request = createRequest({
      uid: 'test-user',
      problemId: 1,
      stepId: '1-1',
      currentStep: 'Test question',
      userMessage: 'Help',
      mode: 'control',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('not available');
  });

  test('should return 404 for invalid problemId', async () => {
    const request = createRequest({
      uid: 'test-user',
      problemId: 9999,
      stepId: '1-1',
      currentStep: 'Test question',
      userMessage: 'Help',
      mode: 'ai-assisted',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain('Problem not found');
  });

  test('should return 404 for invalid stepId', async () => {
    const request = createRequest({
      uid: 'test-user',
      problemId: 1,
      stepId: 'invalid-step',
      currentStep: 'Test question',
      userMessage: 'Help',
      mode: 'ai-assisted',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain('Step not found');
  });

  test('should handle various question types', async () => {
    const questionTypes = [
      'Can you give me a hint?',
      'I don\'t understand',
      'What rule should I use?',
      'Help me solve this',
      'Explain the concept',
    ];

    for (const question of questionTypes) {
      const request = createRequest({
        uid: 'test-user',
        problemId: 1,
        stepId: '1-1',
        currentStep: 'What is the derivative of x^3?',
        userMessage: question,
        mode: 'ai-assisted',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBeTruthy();
    }
  });

  test('should work with different problems', async () => {
    for (let problemId = 1; problemId <= 5; problemId++) {
      const request = createRequest({
        uid: 'test-user',
        problemId,
        stepId: `${problemId}-1`,
        currentStep: 'Test question',
        userMessage: 'Help',
        mode: 'ai-assisted',
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    }
  });
});

describe('Chat API - Fallback Handling', () => {
  const createRequest = (body: any) => {
    return new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  };

  test('should use fallback when AI generation fails', async () => {
    // Mock AI to throw error
    const aiTutor = require('../lib/ai-tutor');
    aiTutor.getAITutorResponse.mockRejectedValueOnce(new Error('API Error'));

    const request = createRequest({
      uid: 'test-user',
      problemId: 1,
      stepId: '1-1',
      currentStep: 'Test question',
      userMessage: 'Help',
      mode: 'ai-assisted',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBeTruthy();
    expect(data.model).toBe('fallback');

    // Restore mock
    aiTutor.getAITutorResponse.mockResolvedValue({
      message: 'Normal response',
      tokensUsed: 45,
      model: 'gpt-4o-mini',
      timestamp: new Date(),
    });
  });

  test('should use fallback when validation fails', async () => {
    // Mock validation to fail
    const aiTutor = require('../lib/ai-tutor');
    aiTutor.validateAIResponse.mockResolvedValueOnce({
      isValid: false,
      reason: 'Answer leakage detected',
    });

    const request = createRequest({
      uid: 'test-user',
      problemId: 1,
      stepId: '1-1',
      currentStep: 'Test question',
      userMessage: 'Help',
      mode: 'ai-assisted',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBeTruthy();

    // Restore mock
    aiTutor.validateAIResponse.mockResolvedValue({
      isValid: true,
    });
  });
});
