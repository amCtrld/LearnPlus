'use client';

/**
 * Problem Step Component — Revamped UI
 * Editorial minimal aesthetic to match problem-page and chat-panel
 */

import { useState } from 'react';
import { CheckCircle2, XCircle, HelpCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Step, StudyMode } from '@/lib/types';
import { MathMessage } from './math-message';

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
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const isAnswered = feedback === 'correct';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || isAnswered || isSubmitting) return;
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const isCorrect = await onSubmit(answer);
      setAttempts((n) => n + 1);

      if (isCorrect) {
        setFeedback('correct');
        setFeedbackMsg('Correct — moving to the next step.');
      } else {
        setFeedback('incorrect');
        setFeedbackMsg(
          attempts >= 1
            ? 'Still not quite right. Consider asking for a hint.'
            : 'Not quite. Check your work and try again.'
        );
      }
    } catch {
      setFeedback('incorrect');
      setFeedbackMsg('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        .step-root {
          display: flex;
          flex-direction: column;
          gap: 24px;
          font-family: var(--sans, 'DM Sans', system-ui, sans-serif);
        }

        /* ── Question ── */
        .step-question {
          font-size: 1rem;
          color: var(--ink, #1a1814);
          line-height: 1.7;
        }

        /* ── Answer field ── */
        .answer-label {
          display: block;
          font-family: var(--mono, 'DM Mono', monospace);
          font-size: 0.6875rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--ink-muted, #a8a29e);
          margin-bottom: 8px;
        }
        .answer-input-row {
          display: flex;
          gap: 8px;
          align-items: stretch;
        }
        .answer-input {
          flex: 1;
          height: 44px;
          padding: 0 14px;
          border: 1px solid var(--border, #e5dfd8);
          border-radius: 4px;
          background: var(--surface, #faf9f7);
          font-family: var(--mono, monospace);
          font-size: 0.9375rem;
          color: var(--ink, #1a1814);
          outline: none;
          transition: border-color 0.15s;
        }
        .answer-input::placeholder { color: var(--ink-muted, #a8a29e); }
        .answer-input:focus { border-color: var(--ink, #1a1814); }
        .answer-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .answer-input.correct {
          border-color: #4a7c59;
          background: #f3faf5;
        }
        .answer-input.incorrect {
          border-color: #b94a3a;
          background: #fdf4f3;
        }

        /* Submit button */
        .submit-btn {
          height: 44px;
          padding: 0 20px;
          border-radius: 4px;
          border: none;
          background: var(--ink, #1a1814);
          color: #fff;
          font-family: var(--sans, system-ui, sans-serif);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          transition: opacity 0.15s, background 0.15s;
          flex-shrink: 0;
        }
        .submit-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .submit-btn.answered {
          background: #4a7c59;
          opacity: 1;
        }

        /* ── Feedback ── */
        .feedback {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 4px;
          font-size: 0.875rem;
          line-height: 1.55;
          animation: feedbackIn 0.2s ease both;
        }
        @keyframes feedbackIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .feedback.correct {
          background: #f3faf5;
          border: 1px solid #c2dece;
          color: #2d5a3d;
        }
        .feedback.incorrect {
          background: #fdf4f3;
          border: 1px solid #e8c4bf;
          color: #7a2e24;
        }
        .feedback-icon { flex-shrink: 0; margin-top: 1px; }

        /* ── Hint ── */
        .hint-toggle {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: 1px solid var(--border, #e5dfd8);
          border-radius: 3px;
          padding: 6px 12px;
          font-family: var(--mono, monospace);
          font-size: 0.75rem;
          letter-spacing: 0.06em;
          color: var(--ink-soft, #6b6660);
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
          width: fit-content;
        }
        .hint-toggle:hover:not(:disabled) {
          border-color: var(--ink, #1a1814);
          color: var(--ink, #1a1814);
        }
        .hint-toggle:disabled { opacity: 0.4; cursor: not-allowed; }

        .hint-box {
          border-left: 2px solid var(--border, #e5dfd8);
          padding: 8px 14px;
          font-size: 0.875rem;
          color: var(--ink-soft, #6b6660);
          line-height: 1.65;
          animation: feedbackIn 0.2s ease both;
        }

        /* ── Bottom actions ── */
        .step-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .ask-ai-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--accent-soft, #f5ece6);
          border: 1px solid #e8c4b0;
          border-radius: 3px;
          padding: 7px 14px;
          font-family: var(--mono, monospace);
          font-size: 0.75rem;
          letter-spacing: 0.06em;
          color: var(--accent, #c45a2a);
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }
        .ask-ai-btn:hover { background: #eeddd3; border-color: #d9a48a; }
        .ask-ai-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .attempts-label {
          margin-left: auto;
          font-family: var(--mono, monospace);
          font-size: 0.6875rem;
          color: var(--ink-muted, #a8a29e);
          letter-spacing: 0.06em;
        }
      `}</style>

      <div className="step-root">

        {/* Question */}
        <div className="step-question"><MathMessage content={step.question} /></div>

        {/* Answer input */}
        <div>
          <label className="answer-label" htmlFor={`answer-${stepIndex}`}>
            Your answer
          </label>
          <form onSubmit={handleSubmit}>
            <div className="answer-input-row">
              <input
                id={`answer-${stepIndex}`}
                className={`answer-input${feedback ? ` ${feedback}` : ''}`}
                placeholder="e.g. 3x² + 4x"
                value={answer}
                onChange={(e) => {
                  setAnswer(e.target.value);
                  if (feedback === 'incorrect') setFeedback(null);
                }}
                disabled={isAnswered || isSubmitting}
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="submit"
                className={`submit-btn${isAnswered ? ' answered' : ''}`}
                disabled={!answer.trim() || isAnswered || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                ) : isAnswered ? (
                  <><CheckCircle2 size={14} /> Correct</>
                ) : (
                  'Submit'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Feedback */}
        {feedback && (
          <div className={`feedback ${feedback}`}>
            {feedback === 'correct'
              ? <CheckCircle2 size={15} className="feedback-icon" />
              : <XCircle size={15} className="feedback-icon" />
            }
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Hint */}
        {step.hint && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              className="hint-toggle"
              type="button"
              onClick={() => setShowHint((v) => !v)}
              disabled={isAnswered}
            >
              <HelpCircle size={12} />
              {showHint ? 'Hide hint' : 'Show hint'}
              {showHint ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
            {showHint && (
              <div className="hint-box"><MathMessage content={step.hint} /></div>
            )}
          </div>
        )}

        {/* Bottom actions */}
        <div className="step-actions">
          {mode === 'ai-assisted' && !isAnswered && (
            <button
              type="button"
              className="ask-ai-btn"
              disabled={isSubmitting}
              onClick={onAskAI}
            >
              Ask AI tutor
            </button>
          )}
          {attempts > 0 && (
            <span className="attempts-label">
              {attempts} attempt{attempts !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </>
  );
}