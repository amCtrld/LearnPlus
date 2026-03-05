'use client';

/**
 * Problem Step Component
 * Displays a single step question and handles answer submission/validation
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, HelpCircle, Loader2 } from 'lucide-react';
import { Step, StudyMode } from '@/lib/types';

interface ProblemStepProps {
  step: Step;
  stepIndex: number;
  totalSteps: number;
  mode: StudyMode;
  onSubmit: (answer: string) => Promise<boolean>;
  onHint?: () => void;
  onAskAI?: () => void;
}

export function ProblemStep({
  step,
  stepIndex,
  totalSteps,
  mode,
  onSubmit,
  onHint,
  onAskAI,
}: ProblemStepProps) {
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'correct' | 'incorrect' | null;
    message?: string;
  }>({ type: null });
  const [showHint, setShowHint] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const isCorrect = await onSubmit(answer);

      if (isCorrect) {
        setFeedback({
          type: 'correct',
          message: 'Correct! Well done. Moving to the next step...',
        });
      } else {
        setFeedback({
          type: 'incorrect',
          message: 'Not quite right. Try again or ask for help.',
        });
      }
    } catch (error) {
      setFeedback({
        type: 'incorrect',
        message: 'Error submitting answer. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAnswered = feedback.type === 'correct';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Step {stepIndex + 1} of {totalSteps}
        </CardTitle>
        <CardDescription>{step.question}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Answer Input */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <label htmlFor="answer" className="text-sm font-medium">
              Your Answer
            </label>
            <Input
              id="answer"
              placeholder="Enter your answer (e.g., 3x^2 + 4x)"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={isAnswered || isSubmitting}
              className="text-base"
            />
            {/* REMOVED: Expected answer display - was showing answer to users! */}
          </div>

          {/* Feedback */}
          {feedback.type && (
            <Alert variant={feedback.type === 'correct' ? 'default' : 'destructive'}>
              <div className="flex items-start gap-2">
                {feedback.type === 'correct' ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertDescription>{feedback.message}</AlertDescription>
              </div>
            </Alert>
          )}

          {/* Hint */}
          {step.hint && (
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowHint(!showHint)}
                disabled={isAnswered}
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                {showHint ? 'Hide Hint' : 'Show Hint'}
              </Button>

              {showHint && (
                <Alert>
                  <AlertDescription className="text-sm">
                    {step.hint}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              type="submit"
              disabled={!answer || isAnswered || isSubmitting}
              className="flex-1"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isAnswered ? 'Answered' : 'Submit Answer'}
            </Button>

            {mode === 'ai-assisted' && !isAnswered && (
              <Button
                type="button"
                variant="secondary"
                disabled={isSubmitting}
                onClick={onAskAI}
              >
                Ask AI
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
