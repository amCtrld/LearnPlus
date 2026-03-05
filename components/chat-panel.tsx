'use client';

/**
 * AI Chat Panel Component
 * Appears only in AI-Assisted mode
 * Provides a calculus tutor AI for step-by-step guidance
 * 
 * Constraints:
 * - Must NOT provide full solutions immediately
 * - Must guide step-by-step
 * - Must reference current problem
 * - Act as calculus tutor
 * - Encourage attempt before revealing answer
 */

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, MessageCircle } from 'lucide-react';
import { ChatMessage, Step, StudyMode } from '@/lib/types';
import { trackAiInteraction } from '@/lib/logger';

interface ChatPanelProps {
  uid: string;
  problemId: number;
  currentStep: Step;
  mode: StudyMode;
}

interface LocalChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function ChatPanel({ uid, problemId, currentStep, mode }: ChatPanelProps) {
  const [messages, setMessages] = useState<LocalChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Track AI interaction for this specific step
    trackAiInteraction(problemId, currentStep.id);

    // Add user message
    const userMessage: LocalChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid,
          problemId,
          stepId: currentStep.id,
          currentStep: currentStep.question,
          userMessage: input,
          mode,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();

      const aiMessage: LocalChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage: LocalChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = async (question: string) => {
    setInput(question);
    // The form will be submitted naturally through handleSendMessage
    // or user can click send
  };

  // Only render if in AI-Assisted mode
  if (mode !== 'ai-assisted') {
    return null;
  }

  return (
    <Card className="h-full flex flex-col border-l">
      <CardHeader className="shrink-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          AI Tutor
        </CardTitle>
        <CardDescription>
          Get hints and explanations without full solutions
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Chat History */}
        <ScrollArea className="flex-1 border rounded-lg p-4">
          <div className="space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-sm text-muted-foreground space-y-2 py-4">
                <p>Hi! I'm your calculus tutor.</p>
                <p>I can help explain concepts, give hints, or guide you step-by-step.</p>
                <p>Ask me a question to get started!</p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 text-sm ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2">
                <div className="bg-secondary text-secondary-foreground rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}

            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Quick Questions */}
        {messages.length === 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">Quick questions:</p>
            <div className="grid gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickQuestion('Can you give me a hint?')}
                className="text-xs justify-start"
              >
                Give me a hint
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickQuestion('Explain this concept')}
                className="text-xs justify-start"
              >
                Explain the concept
              </Button>
            </div>
          </div>
        )}

        {/* Chat Input */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            placeholder="Ask a question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="text-sm"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
