# AI Tutor Integration Guide

## Overview

This guide provides complete implementation details for replacing the placeholder AI responses with a real OpenAI-powered calculus tutor.

---

## Step 1: Set Up OpenAI Account

1. **Create Account:** https://platform.openai.com/signup
2. **Add Payment Method:** Required for API access
3. **Generate API Key:** 
   - Go to https://platform.openai.com/api-keys
   - Click "Create new secret key"
   - Copy key (starts with `sk-proj-...`)
   - **IMPORTANT:** Store securely, never commit to Git

---

## Step 2: Install OpenAI SDK

```bash
npm install openai
npm install @types/openai --save-dev
```

**Verify installation:**
```bash
npm list openai
```

---

## Step 3: Configure Environment Variables

Add to `.env.local` (create if doesn't exist):

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-your-key-here
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=400
OPENAI_TEMPERATURE=0.7
```

**Never commit `.env.local`!** Add to `.gitignore`:

```gitignore
.env.local
.env*.local
```

---

## Step 4: Create AI Tutor Module

Create: `lib/ai-tutor.ts`

```typescript
/**
 * AI Tutor Module - OpenAI Integration
 * Provides Socratic tutoring for calculus problems
 */

import OpenAI from 'openai';
import { Problem, Step } from './types';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configuration
const CONFIG = {
  model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
  maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '400'),
  temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
};

export interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

export interface TutorResponse {
  message: string;
  tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
  };
  model: string;
}

/**
 * Generates system prompt for AI tutor
 * Constrains AI to provide guidance without revealing answers
 */
function generateSystemPrompt(problem: Problem, step: Step): string {
  return `You are a patient and encouraging calculus tutor helping students learn differentiation.

## Current Context
**Problem Expression:** ${problem.expression}
**Problem Title:** ${problem.title}
**Current Step:** ${step.question}
**Expected Answer (DO NOT REVEAL):** ${step.expectedAnswer}

## Your Role and Constraints

### MUST DO:
1. Guide students using the Socratic method (ask questions)
2. Provide incremental hints when students are stuck
3. Explain relevant differentiation rules (power, product, quotient, chain)
4. Encourage students to attempt problems before giving detailed help
5. Help students identify their errors if they show incorrect work
6. Use clear mathematical notation
7. Be patient and encouraging

### MUST NOT DO:
1. NEVER give the direct answer immediately
2. NEVER solve the problem completely for the student
3. NEVER reveal the expected answer (${step.expectedAnswer})
4. NEVER do the calculation for them
5. NEVER say "the answer is..." or similar phrases

### Response Guidelines:
- Keep responses under 100 words
- Ask 1-2 guiding questions when possible
- If student is very stuck, provide ONE small hint, then ask them to try
- Reference specific differentiation rules by name
- Use encouraging language ("Good thinking!", "You're on the right track!")

### Example Good Response:
"Great question! This problem uses the power rule. Remember: when you have x^n, the derivative is n·x^(n-1). Can you try applying this to your expression?"

### Example Bad Response (DON'T DO THIS):
"The answer is ${step.expectedAnswer}. You get this by applying the power rule..."

Remember: Your goal is to help them LEARN, not just get the answer.`;
}

/**
 * Detects if AI response accidentally reveals the answer
 * Implements safety check to prevent answer leakage
 */
function containsAnswer(message: string, expectedAnswer: string): boolean {
  // Normalize both strings for comparison
  const normalizeForCheck = (s: string) =>
    s.toLowerCase()
      .replace(/\s+/g, '')
      .replace(/\*/g, '')
      .replace(/\^/g, '');

  const normalizedMessage = normalizeForCheck(message);
  const normalizedAnswer = normalizeForCheck(expectedAnswer);

  // Check if answer appears in message
  if (normalizedMessage.includes(normalizedAnswer)) {
    return true;
  }

  // Check for common answer-revealing patterns
  const revealingPatterns = [
    /the answer is/i,
    /it equals/i,
    /you get\s+\d/i,
    /the result is/i,
    /the derivative is\s+\d/i,
  ];

  return revealingPatterns.some(pattern => pattern.test(message));
}

/**
 * Generates fallback response if AI reveals answer
 */
function generateFallbackResponse(): string {
  const fallbacks = [
    "Let me guide you step by step instead. First, identify which differentiation rule applies here. What do you think?",
    "Rather than giving the answer, let's work through this together. What differentiation rule do you think applies to this expression?",
    "I want to help you learn, not just get the answer. Can you tell me what you know about the power rule?",
    "Let's break this down into smaller steps. What's the first thing you notice about the expression?",
  ];

  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

/**
 * Main function: Generate AI tutor response
 */
export async function generateTutorResponse(
  problem: Problem,
  step: Step,
  userMessage: string,
  conversationHistory: ChatHistoryItem[] = []
): Promise<TutorResponse> {
  try {
    // Validate inputs
    if (!userMessage || userMessage.trim().length === 0) {
      throw new Error('User message is empty');
    }

    // Build messages array for OpenAI
    const systemPrompt = generateSystemPrompt(problem, step);
    
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
      // Include conversation history
      ...conversationHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      // Add current user message
      {
        role: 'user',
        content: userMessage,
      },
    ];

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: CONFIG.model,
      messages: messages,
      temperature: CONFIG.temperature,
      max_tokens: CONFIG.maxTokens,
      presence_penalty: 0.1, // Encourage diverse responses
      frequency_penalty: 0.1, // Reduce repetition
    });

    // Extract response
    const aiMessage = completion.choices[0].message.content || '';

    // Safety check: Does response reveal the answer?
    if (containsAnswer(aiMessage, step.expectedAnswer)) {
      console.warn('AI response contained answer, using fallback', {
        problemId: problem.id,
        stepId: step.id,
        aiMessage,
      });

      return {
        message: generateFallbackResponse(),
        tokenUsage: {
          prompt: completion.usage?.prompt_tokens || 0,
          completion: completion.usage?.completion_tokens || 0,
          total: completion.usage?.total_tokens || 0,
        },
        model: completion.model,
      };
    }

    // Return successful response
    return {
      message: aiMessage,
      tokenUsage: {
        prompt: completion.usage?.prompt_tokens || 0,
        completion: completion.usage?.completion_tokens || 0,
        total: completion.usage?.total_tokens || 0,
      },
      model: completion.model,
    };
  } catch (error) {
    console.error('Error generating AI tutor response:', error);

    // Handle specific OpenAI errors
    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        throw new Error('OpenAI API key is invalid');
      } else if (error.status === 429) {
        throw new Error('OpenAI API rate limit exceeded');
      }
    }

    throw new Error('Failed to generate AI response');
  }
}

/**
 * Validates OpenAI configuration on startup
 */
export function validateOpenAIConfig(): void {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  if (!apiKey.startsWith('sk-')) {
    throw new Error('OPENAI_API_KEY appears to be invalid (should start with sk-)');
  }

  console.log('OpenAI configuration validated successfully');
}
```

---

## Step 5: Update API Route

Replace: `app/api/chat/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase';
import { getProblem } from '@/lib/course-data';
import { generateTutorResponse, ChatHistoryItem } from '@/lib/ai-tutor';
import { StudyMode } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { uid, problemId, stepId, userMessage, mode } = await request.json();

    // Validate input
    if (!uid || typeof problemId !== 'number' || !stepId || !userMessage) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    // Only available in AI-assisted mode
    if (mode !== 'ai-assisted') {
      return NextResponse.json(
        { error: 'Chat not available in control mode' },
        { status: 403 }
      );
    }

    // Get problem and step context
    const problem = getProblem(problemId);
    if (!problem) {
      return NextResponse.json(
        { error: 'Problem not found' },
        { status: 404 }
      );
    }

    const step = problem.steps.find(s => s.id === stepId);
    if (!step) {
      return NextResponse.json(
        { error: 'Step not found' },
        { status: 404 }
      );
    }

    // Retrieve conversation history from Firestore
    const db = getAdminFirestore();
    const historySnapshot = await db
      .collection('chatHistory')
      .where('uid', '==', uid)
      .where('problemId', '==', problemId)
      .where('stepId', '==', stepId)
      .orderBy('timestamp', 'asc')
      .limit(20) // Last 20 messages for context
      .get();

    const conversationHistory: ChatHistoryItem[] = [];
    historySnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.role === 'user') {
        conversationHistory.push({
          role: 'user',
          content: data.content,
        });
      } else if (data.role === 'assistant') {
        conversationHistory.push({
          role: 'assistant',
          content: data.content,
        });
      }
    });

    // Generate AI response
    const tutorResponse = await generateTutorResponse(
      problem,
      step,
      userMessage,
      conversationHistory
    );

    // Save user message to Firestore
    await db.collection('chatHistory').add({
      uid,
      problemId,
      stepId,
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    });

    // Save AI response to Firestore
    await db.collection('chatHistory').add({
      uid,
      problemId,
      stepId,
      role: 'assistant',
      content: tutorResponse.message,
      timestamp: new Date(),
    });

    // Log token usage for cost tracking
    await db.collection('aiUsageMetrics').add({
      uid,
      problemId,
      stepId,
      timestamp: new Date(),
      model: tutorResponse.model,
      promptTokens: tutorResponse.tokenUsage.prompt,
      completionTokens: tutorResponse.tokenUsage.completion,
      totalTokens: tutorResponse.tokenUsage.total,
    });

    // Return response
    return NextResponse.json(
      { 
        message: tutorResponse.message,
        // Include usage in development
        ...(process.env.NODE_ENV === 'development' && {
          debug: {
            tokens: tutorResponse.tokenUsage,
            model: tutorResponse.model,
          },
        }),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in chat endpoint:', error);

    // Return user-friendly error
    return NextResponse.json(
      { error: 'Failed to get AI response. Please try again.' },
      { status: 500 }
    );
  }
}
```

---

## Step 6: Create Test Suite

Create: `__tests__/ai-tutor.test.ts`

```typescript
import { generateTutorResponse } from '../lib/ai-tutor';
import { Problem, Step } from '../lib/types';

// Mock problem for testing
const testProblem: Problem = {
  id: 1,
  title: 'Test Problem',
  expression: 'x^3 + 2x^2',
  steps: [
    {
      id: '1-1',
      question: 'What is the derivative of x^3?',
      expectedAnswer: '3x^2',
      hint: 'Use the power rule',
    },
  ],
};

const testStep = testProblem.steps[0];

describe('AI Tutor', () => {
  // Note: These tests require valid OPENAI_API_KEY
  // Skip in CI unless key is configured
  const isConfigured = !!process.env.OPENAI_API_KEY;

  test.skipIf(!isConfigured)('generates response for simple question', async () => {
    const response = await generateTutorResponse(
      testProblem,
      testStep,
      "I don't know where to start"
    );

    expect(response.message).toBeTruthy();
    expect(response.message.length).toBeGreaterThan(10);
    expect(response.tokenUsage.total).toBeGreaterThan(0);
  });

  test.skipIf(!isConfigured)('does not reveal answer', async () => {
    const response = await generateTutorResponse(
      testProblem,
      testStep,
      "What's the answer?"
    );

    // Should not contain the exact answer
    expect(response.message.toLowerCase()).not.toContain('3x^2');
    expect(response.message.toLowerCase()).not.toContain('3x2');
  });

  test.skipIf(!isConfigured)('provides guidance for power rule', async () => {
    const response = await generateTutorResponse(
      testProblem,
      testStep,
      "Can you explain the power rule?"
    );

    expect(response.message.toLowerCase()).toContain('power');
    expect(response.message).toBeTruthy();
  });

  test.skipIf(!isConfigured)('uses conversation history', async () => {
    const history = [
      { role: 'user' as const, content: "I'm confused" },
      { role: 'assistant' as const, content: "Let's start with the power rule..." },
    ];

    const response = await generateTutorResponse(
      testProblem,
      testStep,
      "Can you explain more?",
      history
    );

    expect(response.message).toBeTruthy();
  });
});
```

---

## Step 7: Add Startup Validation

Update: `app/layout.tsx`

```typescript
import { validateOpenAIConfig } from '@/lib/ai-tutor';

// Validate configuration on server startup
if (typeof window === 'undefined') {
  try {
    validateOpenAIConfig();
  } catch (error) {
    console.error('OpenAI configuration error:', error);
    // In production, this should prevent startup
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
}
```

---

## Step 8: Monitor Usage and Costs

### Create Cost Monitoring Dashboard

Create: `app/admin/ai-usage/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';

export default function AIUsagePage() {
  const [usage, setUsage] = useState({
    totalTokens: 0,
    estimatedCost: 0,
    messageCount: 0,
  });

  useEffect(() => {
    fetch('/api/admin/ai-usage')
      .then(res => res.json())
      .then(data => setUsage(data));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">AI Usage Metrics</h1>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 border rounded">
          <div className="text-3xl font-bold">{usage.messageCount}</div>
          <div className="text-sm text-gray-600">Total Messages</div>
        </div>
        
        <div className="p-4 border rounded">
          <div className="text-3xl font-bold">
            {usage.totalTokens.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Total Tokens</div>
        </div>
        
        <div className="p-4 border rounded">
          <div className="text-3xl font-bold">
            ${usage.estimatedCost.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">Estimated Cost</div>
        </div>
      </div>
    </div>
  );
}
```

### Create Usage API Route

Create: `app/api/admin/ai-usage/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase';

export async function GET(request: NextRequest) {
  try {
    const db = getAdminFirestore();
    
    // Get all usage metrics
    const snapshot = await db.collection('aiUsageMetrics').get();
    
    let totalTokens = 0;
    let messageCount = snapshot.size;
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      totalTokens += data.totalTokens || 0;
    });
    
    // Estimate cost (GPT-4 Turbo pricing)
    const costPerMillionTokens = 10; // $10 per 1M tokens (approximate)
    const estimatedCost = (totalTokens / 1000000) * costPerMillionTokens;
    
    return NextResponse.json({
      totalTokens,
      messageCount,
      estimatedCost,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    );
  }
}
```

---

## Step 9: Testing Checklist

### Manual Testing

1. **Basic Conversation:**
   - [ ] Ask for hint
   - [ ] Ask for explanation
   - [ ] Ask "what's the answer"
   - [ ] Verify no direct answer given

2. **Conversation Context:**
   - [ ] Ask follow-up question
   - [ ] Verify AI remembers previous messages
   - [ ] Test across multiple steps

3. **Error Handling:**
   - [ ] Test with invalid API key
   - [ ] Test with network error
   - [ ] Verify graceful degradation

4. **Safety Checks:**
   - [ ] Verify answer never revealed
   - [ ] Test fallback responses
   - [ ] Check for appropriate guidance level

### Automated Testing

```bash
npm run test:ai
```

---

## Step 10: Cost Optimization

### Current Pricing (GPT-4 Turbo)
- Input: $10 per 1M tokens
- Output: $30 per 1M tokens

### Estimated Study Costs

**Scenario: 50 participants, AI-assisted mode**

- Average messages per problem: 5
- Average tokens per message: 500
- Total problems: 5

Calculation:
```
50 participants × 5 problems × 5 messages × 500 tokens = 625,000 tokens

Cost: (625K / 1M) × $10 = $6.25 for input
      (625K / 1M) × $30 = $18.75 for output
Total: ~$25 per 50 participants
```

### Optimization Strategies

1. **Use GPT-3.5-Turbo** (75% cheaper):
   ```typescript
   OPENAI_MODEL=gpt-3.5-turbo
   ```
   Cost: ~$6 per 50 participants

2. **Reduce max_tokens**:
   ```typescript
   OPENAI_MAX_TOKENS=300  // Instead of 400
   ```

3. **Limit conversation history**:
   ```typescript
   .limit(10)  // Instead of 20
   ```

4. **Cache common responses** (for pilot):
   - Store responses to common questions
   - Use cache for identical queries

---

## Common Issues & Troubleshooting

### Issue 1: "Invalid API Key"

**Symptoms:** 401 error from OpenAI

**Solutions:**
1. Verify key in `.env.local`
2. Check key starts with `sk-proj-` or `sk-`
3. Regenerate key if necessary
4. Ensure no extra spaces in `.env.local`

### Issue 2: Rate Limit Exceeded

**Symptoms:** 429 error

**Solutions:**
1. Upgrade OpenAI tier
2. Implement request queuing
3. Add retry with exponential backoff:

```typescript
async function generateWithRetry(
  problem: Problem,
  step: Step,
  message: string,
  retries = 3
): Promise<TutorResponse> {
  try {
    return await generateTutorResponse(problem, step, message);
  } catch (error) {
    if (retries > 0 && error.status === 429) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return generateWithRetry(problem, step, message, retries - 1);
    }
    throw error;
  }
}
```

### Issue 3: AI Reveals Answer

**Symptoms:** Safety check triggers fallback

**Solutions:**
1. Strengthen system prompt
2. Add more specific constraints
3. Use lower temperature (more focused):
   ```typescript
   OPENAI_TEMPERATURE=0.5
   ```

### Issue 4: Slow Response Times

**Symptoms:** Chat feels laggy

**Solutions:**
1. Use streaming responses:
   ```typescript
   stream: true
   ```
2. Show typing indicator immediately
3. Set timeout on client

---

## Production Checklist

Before deploying AI tutor:

- [ ] OpenAI API key configured
- [ ] Budget alerts set in OpenAI dashboard
- [ ] Usage monitoring dashboard working
- [ ] Safety checks verified (no answer leakage)
- [ ] Error handling tested
- [ ] Rate limiting configured
- [ ] Fallback responses tested
- [ ] Cost estimates calculated
- [ ] Conversation history working
- [ ] Token usage logged

---

## Ethical Considerations

1. **Informed Consent:** Participants should know AI is involved
2. **Data Privacy:** Chat logs contain participant reasoning - handle carefully
3. **Bias:** AI may have subtle biases - monitor for unfairness
4. **Consistency:** AI responses vary - document this as limitation

Add to consent form:
> "In the AI-assisted mode, you will interact with an AI tutoring system powered by OpenAI's GPT-4. Your conversations will be recorded for research analysis."

---

## Next Steps

After AI integration:

1. Test with 5-10 users
2. Review chat logs for quality
3. Adjust system prompts if needed
4. Monitor costs during pilot
5. Collect user feedback on AI helpfulness
6. Ready for full study

---

**Estimated Implementation Time:** 6-8 hours  
**Testing Time:** 3-4 hours  
**Total:** 9-12 hours

**Priority:** 🔴 CRITICAL - Core experimental condition
