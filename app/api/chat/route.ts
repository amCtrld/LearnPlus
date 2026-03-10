/**
 * POST /api/chat
 * AI-powered calculus tutor endpoint using OpenAI
 * Provides hints and guidance WITHOUT giving away full solutions
 * 
 * Request body: {
 *   uid: string
 *   problemId: number
 *   stepId: string
 *   currentStep: string (the step question)
 *   userMessage: string (student's query)
 *   mode: StudyMode
 *   conversationHistory?: ChatMessage[]
 * }
 * Response: { 
 *   message: string
 *   tokensUsed: number
 *   model: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { getProblem } from '@/lib/course-data';
import { 
  getAITutorResponse, 
  validateAIResponse, 
  getFallbackResponse,
  type ProblemContext,
  type ChatMessage,
} from '@/lib/ai-tutor';

/**
 * Retrieve conversation history from Firestore
 */
async function getConversationHistory(
  uid: string,
  problemId: number,
  stepId: string,
  limit: number = 10
): Promise<ChatMessage[]> {
  try {
    const db = getAdminFirestore();
    if (!db) return [];

    const snapshot = await db
      .collection('chatHistory')
      .where('uid', '==', uid)
      .where('problemId', '==', problemId)
      .where('stepId', '==', stepId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    const messages: ChatMessage[] = [];
    snapshot.docs.reverse().forEach((doc: any) => {
      const data = doc.data();
      messages.push(
        { role: 'user', content: data.userMessage },
        { role: 'assistant', content: data.aiMessage }
      );
    });

    return messages;
  } catch (error) {
    console.error('Error retrieving conversation history:', error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const { uid, problemId, stepId, currentStep, userMessage, mode } = await request.json();

    // Validate input
    if (!uid || typeof problemId !== 'number' || !stepId || !userMessage || !currentStep) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    // Only available in AI-assisted mode
    if (mode !== 'ai-assisted') {
      return NextResponse.json(
        { error: 'Chat not available in this mode' },
        { status: 403 }
      );
    }

    // Get problem data for context
    const problem = getProblem(problemId);
    if (!problem) {
      return NextResponse.json(
        { error: 'Problem not found' },
        { status: 404 }
      );
    }

    // Find current step details
    const step = problem.steps.find((s) => s.id === stepId);
    if (!step) {
      return NextResponse.json(
        { error: 'Step not found' },
        { status: 404 }
      );
    }

    // Retrieve conversation history for context
    const conversationHistory = await getConversationHistory(uid, problemId, stepId, 10);

    // Build problem context for AI
    const context: ProblemContext = {
      problemId,
      problemTitle: problem.title,
      expression: problem.expression,
      stepId,
      stepQuestion: step.question,
      stepHint: step.hint,
      conversationHistory,
    };

    // Generate AI tutor response
    let aiResponse;
    try {
      aiResponse = await getAITutorResponse(userMessage, context);
    } catch (error) {
      console.error('AI generation failed, using fallback:', error);
      // Use fallback response if AI fails
      return NextResponse.json({
        message: getFallbackResponse(context),
        tokensUsed: 0,
        model: 'fallback',
      }, { status: 200 });
    }

    // Validate AI response for answer leakage
    const validation = await validateAIResponse(aiResponse, step.expectedAnswer);
    if (!validation.isValid) {
      console.warn('AI response validation failed:', validation.reason);
      // Use fallback if validation fails
      return NextResponse.json({
        message: getFallbackResponse(context),
        tokensUsed: aiResponse.tokensUsed,
        model: aiResponse.model,
      }, { status: 200 });
    }

    // Save chat interaction to Firestore for research analysis
    try {
      const db = getAdminFirestore();
      if (db) {
        await db.collection('chatHistory').add({
          uid,
          problemId,
          stepId,
          timestamp: new Date(),
          userMessage,
          aiMessage: aiResponse.message,
          tokensUsed: aiResponse.tokensUsed,
          model: aiResponse.model,
          mode,
        });
      }
    } catch (err) {
      // Log to Firebase failed, but don't fail the request
      console.error('Failed to save chat history:', err);
    }

    // Return AI response to student
    return NextResponse.json({
      message: aiResponse.message,
      tokensUsed: aiResponse.tokensUsed,
      model: aiResponse.model,
    }, { status: 200 });

  } catch (error) {
    console.error('Error in chat endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
