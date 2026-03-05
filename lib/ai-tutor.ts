/**
 * AI Tutor Module
 * 
 * Provides intelligent tutoring using OpenAI's GPT models.
 * Helps students learn calculus concepts without giving away answers.
 * 
 * Safety Features:
 * - Never reveals expected answers directly
 * - Provides hints and guidance instead of solutions
 * - Maintains conversation context
 * - Tracks usage for research purposes
 */

import OpenAI from 'openai';

// Initialize OpenAI client
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

/**
 * System prompt that defines the AI tutor's behavior
 * Critical: Must prevent answer leakage while being helpful
 */
const SYSTEM_PROMPT = `You are an expert calculus tutor helping undergraduate students learn differentiation.

Your role is to guide students through problem-solving WITHOUT giving them direct answers.

CRITICAL RULES:
1. NEVER provide the final answer or expected answer directly
2. NEVER solve the problem completely for the student
3. DO provide hints, ask guiding questions, and explain concepts
4. DO help identify what rule to use (power rule, chain rule, etc.)
5. DO explain the steps conceptually
6. DO point out errors in their approach if they share their work
7. DO encourage them to try again with your hints

When a student is stuck:
- Ask them what they've tried so far
- Help them identify which differentiation rule applies
- Explain the concept behind the rule
- Give an analogous example with different numbers/variables
- Break the problem into smaller steps

When a student shows their work:
- Identify where they went right
- Point out specific errors without solving it for them
- Suggest what to reconsider or re-calculate

Remember: Your goal is to help them LEARN, not to help them get the answer quickly.`;

/**
 * Message format for OpenAI chat
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * AI tutor response
 */
export interface AIResponse {
  message: string;
  tokensUsed: number;
  model: string;
  timestamp: Date;
}

/**
 * Context about the current problem to help AI understand the situation
 */
export interface ProblemContext {
  problemId: number;
  problemTitle: string;
  expression: string;
  stepId: string;
  stepQuestion: string;
  stepHint?: string;
  previousAttempts?: string[];
  conversationHistory?: ChatMessage[];
}

/**
 * Generate AI tutor response based on student's question and context
 */
export async function getAITutorResponse(
  studentMessage: string,
  context: ProblemContext
): Promise<AIResponse> {
  try {
    const client = getOpenAIClient();

    // Build context-aware prompt
    const contextPrompt = buildContextPrompt(context);

    // Build messages array with conversation history
    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'system', content: contextPrompt },
    ];

    // Add conversation history if available
    if (context.conversationHistory && context.conversationHistory.length > 0) {
      messages.push(...context.conversationHistory);
    }

    // Add current student message
    messages.push({
      role: 'user',
      content: studentMessage,
    });

    // Call OpenAI API
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini', // Cost-effective model, good for tutoring
      messages: messages as OpenAI.Chat.ChatCompletionMessageParam[],
      temperature: 0.7, // Balanced creativity and consistency
      max_tokens: 500, // Reasonable response length
      presence_penalty: 0.3, // Encourage variety in responses
      frequency_penalty: 0.3, // Reduce repetition
    });

    const aiMessage = completion.choices[0]?.message?.content || 'I apologize, but I encountered an issue. Please try asking again.';
    const tokensUsed = completion.usage?.total_tokens || 0;

    return {
      message: aiMessage,
      tokensUsed,
      model: completion.model,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('AI Tutor Error:', error);
    
    // Provide helpful fallback message
    if (error instanceof Error && error.message.includes('API key')) {
      throw new Error('AI tutor is not configured. Please contact support.');
    }
    
    throw new Error('AI tutor is temporarily unavailable. Please try again or use hints.');
  }
}

/**
 * Build context prompt to give AI information about current problem
 */
function buildContextPrompt(context: ProblemContext): string {
  let prompt = `Current Problem Context:
- Problem: ${context.problemTitle}
- Expression to differentiate: ${context.expression}
- Current Step: ${context.stepQuestion}`;

  if (context.stepHint) {
    prompt += `\n- Hint available: ${context.stepHint}`;
  }

  if (context.previousAttempts && context.previousAttempts.length > 0) {
    prompt += `\n- Student's previous attempts: ${context.previousAttempts.join(', ')}`;
  }

  prompt += `\n\nRemember: Guide the student, don't solve it for them. Focus on helping them understand the concept and approach.`;

  return prompt;
}

/**
 * Check if a message contains potential answer leakage
 * This is a safety check to prevent AI from accidentally giving answers
 */
export function detectAnswerLeakage(
  aiMessage: string,
  expectedAnswer: string
): boolean {
  // Normalize both strings for comparison
  const normalize = (str: string) => 
    str.toLowerCase()
      .replace(/\s+/g, '')
      .replace(/\*/g, '')
      .replace(/\^/g, '');

  const normalizedAI = normalize(aiMessage);
  const normalizedExpected = normalize(expectedAnswer);

  // Check if expected answer appears in AI message
  // This is a simple check - could be enhanced with fuzzy matching
  return normalizedAI.includes(normalizedExpected);
}

/**
 * Validate AI response before sending to student
 * Ensures the response is appropriate and doesn't leak answers
 */
export async function validateAIResponse(
  aiResponse: AIResponse,
  expectedAnswer: string
): Promise<{ isValid: boolean; reason?: string }> {
  // Check for answer leakage
  if (detectAnswerLeakage(aiResponse.message, expectedAnswer)) {
    console.warn('AI response contained potential answer leakage:', {
      response: aiResponse.message,
      expectedAnswer,
    });
    
    return {
      isValid: false,
      reason: 'Response contained potential answer',
    };
  }

  // Check message is not empty
  if (!aiResponse.message || aiResponse.message.trim().length === 0) {
    return {
      isValid: false,
      reason: 'Empty response',
    };
  }

  // Response is valid
  return { isValid: true };
}

/**
 * Get a safe fallback response when AI fails or returns invalid response
 */
export function getFallbackResponse(context: ProblemContext): string {
  const responses = [
    `Let's think about this step by step. ${context.stepQuestion}. What differentiation rule do you think applies here?`,
    `This problem involves ${context.problemTitle.toLowerCase()}. Have you considered which rule might be useful? Try looking at the hint if you need guidance.`,
    `Let's break this down. For the expression ${context.expression}, what's the first step you would take?`,
  ];

  // Return a random fallback response
  return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Estimate cost of AI usage (for monitoring)
 * GPT-4o-mini pricing (as of 2024): ~$0.15/1M input tokens, ~$0.60/1M output tokens
 */
export function estimateCost(tokensUsed: number): number {
  // Rough estimate: average cost per 1000 tokens
  const avgCostPer1000Tokens = 0.0004; // $0.40 per 1M tokens average
  return (tokensUsed / 1000) * avgCostPer1000Tokens;
}
