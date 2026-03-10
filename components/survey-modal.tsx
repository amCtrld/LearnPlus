'use client';

/**
 * Cognitive Load Survey Modal — Revamped UI
 * Editorial minimal aesthetic to match problem-page, chat-panel, problem-step
 */

import { useState } from 'react';
import { Loader2, ArrowRight } from 'lucide-react';
import { StudyMode } from '@/lib/types';

interface SurveyModalProps {
  isOpen: boolean;
  problemId: number;
  mode: StudyMode;
  onSubmit: (responses: {
    mentalDemand: number;
    confidence: number;
    systemHelpfulness: number;
  }) => Promise<void>;
}

const SCALE = [1, 2, 3, 4, 5, 6, 7];

const QUESTIONS = [
  {
    id: 'mentalDemand',
    question: 'How mentally demanding was this problem?',
    low: 'Very easy',
    high: 'Very hard',
  },
  {
    id: 'confidence',
    question: 'How confident are you in your solution?',
    low: 'Not at all',
    high: 'Very confident',
  },
  {
    id: 'systemHelpfulness',
    question: 'How helpful was the AI tutor?',
    low: 'Not helpful',
    high: 'Extremely helpful',
    aiOnly: true,
  },
];

export function SurveyModal({ isOpen, problemId, mode, onSubmit }: SurveyModalProps) {
  const isAI = mode === 'ai-assisted';

  const [values, setValues] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hovered, setHovered] = useState<Record<string, number>>({});

  const visibleQuestions = QUESTIONS.filter((q) => !q.aiOnly || isAI);
  const isComplete = visibleQuestions.every((q) => values[q.id] !== undefined);

  const handleSubmit = async () => {
    if (!isComplete || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        mentalDemand: values.mentalDemand,
        confidence: values.confidence,
        systemHelpfulness: isAI ? values.systemHelpfulness : 0,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        .survey-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(26, 24, 20, 0.45);
          backdrop-filter: blur(3px);
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          animation: backdropIn 0.2s ease both;
        }
        @keyframes backdropIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .survey-modal {
          background: #fff;
          border: 1px solid var(--border, #e5dfd8);
          border-radius: 6px;
          width: 100%;
          max-width: 560px;
          overflow: hidden;
          animation: modalIn 0.25s cubic-bezier(0.34,1.2,0.64,1) both;
        }
        @keyframes modalIn {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Header */
        .survey-header {
          padding: 28px 32px 20px;
          border-bottom: 1px solid var(--border, #e5dfd8);
          background: var(--surface, #faf9f7);
        }
        .survey-eyebrow {
          font-family: var(--mono, 'DM Mono', monospace);
          font-size: 0.6875rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ink-muted, #a8a29e);
          margin-bottom: 6px;
        }
        .survey-title {
          font-family: var(--serif, 'DM Serif Display', Georgia, serif);
          font-size: 1.375rem;
          color: var(--ink, #1a1814);
          line-height: 1.2;
        }
        .survey-sub {
          font-size: 0.8125rem;
          color: var(--ink-soft, #6b6660);
          margin-top: 5px;
          line-height: 1.5;
        }

        /* Body */
        .survey-body {
          padding: 28px 32px;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        /* Question block */
        .survey-question {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .survey-q-text {
          font-size: 0.9375rem;
          color: var(--ink, #1a1814);
          line-height: 1.5;
          font-family: var(--sans, system-ui, sans-serif);
        }

        /* Scale row */
        .scale-row {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .scale-buttons {
          display: flex;
          gap: 4px;
        }
        .scale-btn {
          flex: 1;
          height: 40px;
          border: 1px solid var(--border, #e5dfd8);
          border-radius: 3px;
          background: var(--surface, #faf9f7);
          font-family: var(--mono, monospace);
          font-size: 0.8125rem;
          color: var(--ink-soft, #6b6660);
          cursor: pointer;
          transition: border-color 0.12s, background 0.12s, color 0.12s, transform 0.1s;
          position: relative;
        }
        .scale-btn:hover {
          border-color: var(--ink, #1a1814);
          color: var(--ink, #1a1814);
          background: var(--surface-alt, #f2ede8);
          transform: translateY(-1px);
        }
        .scale-btn.selected {
          border-color: var(--ink, #1a1814);
          background: var(--ink, #1a1814);
          color: #fff;
          transform: translateY(-1px);
        }
        .scale-btn.hovered-range {
          background: var(--surface-alt, #f2ede8);
          border-color: #c8c2ba;
        }

        /* Scale labels */
        .scale-labels {
          display: flex;
          justify-content: space-between;
        }
        .scale-label {
          font-family: var(--mono, monospace);
          font-size: 0.625rem;
          letter-spacing: 0.06em;
          color: var(--ink-muted, #a8a29e);
        }

        /* Divider */
        .survey-divider {
          height: 1px;
          background: var(--border, #e5dfd8);
        }

        /* Footer */
        .survey-footer {
          padding: 20px 32px 28px;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .survey-progress {
          font-family: var(--mono, monospace);
          font-size: 0.6875rem;
          color: var(--ink-muted, #a8a29e);
          letter-spacing: 0.06em;
          flex: 1;
        }
        .survey-submit {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 22px;
          border: none;
          border-radius: 4px;
          background: var(--ink, #1a1814);
          color: #fff;
          font-family: var(--sans, system-ui, sans-serif);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .survey-submit:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .survey-submit:not(:disabled):hover { opacity: 0.85; }

        @media (max-width: 520px) {
          .survey-header, .survey-body, .survey-footer { padding-left: 20px; padding-right: 20px; }
          .scale-btn { height: 36px; font-size: 0.75rem; }
        }
      `}</style>

      <div className="survey-backdrop">
        <div className="survey-modal">

          {/* Header */}
          <div className="survey-header">
            <p className="survey-eyebrow">Problem {problemId} complete</p>
            <h2 className="survey-title">Quick reflection</h2>
            <p className="survey-sub">
              Three short questions — your answers help us understand your experience.
            </p>
          </div>

          {/* Questions */}
          <div className="survey-body">
            {visibleQuestions.map((q, qi) => {
              const selected = values[q.id];
              const hov = hovered[q.id];

              return (
                <div key={q.id}>
                  {qi > 0 && <div className="survey-divider" style={{ marginBottom: 28 }} />}
                  <div className="survey-question">
                    <p className="survey-q-text">
                      <span style={{
                        fontFamily: 'var(--mono, monospace)',
                        fontSize: '0.6875rem',
                        letterSpacing: '0.1em',
                        color: 'var(--ink-muted)',
                        marginRight: 8,
                      }}>
                        {qi + 1}/{visibleQuestions.length}
                      </span>
                      {q.question}
                    </p>
                    <div className="scale-row">
                      <div className="scale-buttons">
                        {SCALE.map((n) => (
                          <button
                            key={n}
                            className={`scale-btn${selected === n ? ' selected' : ''}${
                              hov && n <= hov && selected !== n ? ' hovered-range' : ''
                            }`}
                            onClick={() => setValues((v) => ({ ...v, [q.id]: n }))}
                            onMouseEnter={() => setHovered((h) => ({ ...h, [q.id]: n }))}
                            onMouseLeave={() => setHovered((h) => ({ ...h, [q.id]: 0 }))}
                            type="button"
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                      <div className="scale-labels">
                        <span className="scale-label">{q.low}</span>
                        <span className="scale-label">{q.high}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="survey-footer">
            <span className="survey-progress">
              {Object.keys(values).filter(k => visibleQuestions.find(q => q.id === k)).length}
              {' / '}
              {visibleQuestions.length} answered
            </span>
            <button
              className="survey-submit"
              onClick={handleSubmit}
              disabled={!isComplete || isSubmitting}
              type="button"
            >
              {isSubmitting ? (
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <ArrowRight size={14} />
              )}
              Continue
            </button>
          </div>
        </div>
      </div>
    </>
  );
}