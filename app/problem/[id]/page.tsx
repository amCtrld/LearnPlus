'use client';

/**
 * Problem Solving Page — Revamped UI
 * Clean, professional, editorial-minimal aesthetic
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Home, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { getProblem, getNextProblemId } from '@/lib/course-data';
import { ProblemStep } from '@/components/problem-step';
import { SurveyModal } from '@/components/survey-modal';
import { ChatPanel } from '@/components/chat-panel';
import { MathMessage } from '@/components/math-message';
import {
  logStepAttempt,
  startStepTimer,
  getStepElapsedTime,
  resetAiInteractionCount,
  getAiInteractionCount,
} from '@/lib/logger';
import { Session } from '@/lib/types';

// ─── Inline styles (no Tailwind dependency for new tokens) ───────────────────
const styles = {
  root: {
    fontFamily: "'DM Serif Display', Georgia, serif",
    '--ink': '#1a1814',
    '--ink-soft': '#6b6660',
    '--ink-muted': '#a8a29e',
    '--surface': '#faf9f7',
    '--surface-alt': '#f2ede8',
    '--border': '#e5dfd8',
    '--accent': '#c45a2a',
    '--accent-soft': '#f5ece6',
    '--mono': "'DM Mono', 'Courier New', monospace",
  },
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--surface)',
        gap: '12px',
        fontFamily: styles.root.fontFamily,
      }}
    >
      <Loader2
        style={{
          width: 28,
          height: 28,
          color: 'var(--ink-muted)',
          animation: 'spin 1s linear infinite',
        }}
      />
      <p
        style={{
          fontSize: '0.8125rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--ink-muted)',
          fontFamily: 'var(--mono)',
        }}
      >
        Loading problem
      </p>
    </main>
  );
}

function ErrorScreen({ error, onBack }) {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--surface)',
        padding: '24px',
      }}
    >
      <div
        style={{
          maxWidth: 400,
          width: '100%',
          border: '1px solid var(--border)',
          borderRadius: 4,
          padding: '32px',
          background: '#fff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <AlertCircle size={16} color="var(--accent)" />
          <span
            style={{
              fontSize: '0.75rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              fontFamily: 'var(--mono)',
            }}
          >
            Error
          </span>
        </div>
        <p style={{ color: 'var(--ink)', fontSize: '0.9375rem', marginBottom: 24 }}>
          {error || 'Problem not found or session error'}
        </p>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.8125rem',
            color: 'var(--ink-soft)',
            background: 'none',
            border: '1px solid var(--border)',
            padding: '8px 16px',
            borderRadius: 3,
            cursor: 'pointer',
            fontFamily: 'var(--mono)',
          }}
        >
          <ArrowLeft size={13} />
          Return to dashboard
        </button>
      </div>
    </main>
  );
}

function ProgressBar({ current, total }) {
  const percent = ((current + 1) / total) * 100;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div
        style={{
          flex: 1,
          height: 2,
          background: 'var(--border)',
          borderRadius: 99,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${percent}%`,
            background: 'var(--ink)',
            transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      </div>
      <span
        style={{
          fontSize: '0.75rem',
          fontFamily: 'var(--mono)',
          color: 'var(--ink-muted)',
          whiteSpace: 'nowrap',
          minWidth: 60,
          textAlign: 'right',
        }}
      >
        {current + 1} / {total}
      </span>
    </div>
  );
}

function ModeChip({ mode }) {
  const isAI = mode === 'ai-assisted';
  return (
    <span
      style={{
        fontSize: '0.6875rem',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        fontFamily: 'var(--mono)',
        padding: '3px 8px',
        borderRadius: 2,
        background: isAI ? 'var(--accent-soft)' : 'var(--surface-alt)',
        color: isAI ? 'var(--accent)' : 'var(--ink-soft)',
        border: `1px solid ${isAI ? '#e8c4b0' : 'var(--border)'}`,
      }}
    >
      {isAI ? 'AI-Assisted' : 'Solo'}
    </span>
  );
}

function HintBanner({ mode }) {
  return (
    <div
      style={{
        borderLeft: '2px solid var(--accent)',
        paddingLeft: 16,
        paddingTop: 2,
        paddingBottom: 2,
      }}
    >
      <p
        style={{
          fontSize: '0.8125rem',
          color: 'var(--ink-soft)',
          lineHeight: 1.6,
        }}
      >
        {mode === 'ai-assisted'
          ? 'Use the AI Tutor to get hints and guidance — it won\'t just give away the answer.'
          : 'Work through each step carefully and verify your reasoning before submitting.'}
      </p>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ProblemPage() {
  const params = useParams();
  const router = useRouter();
  const { uid, session: authSession, updateSession } = useAuth();

  const problemId = parseInt(params.id as string, 10);
  const problem = getProblem(problemId);

  const [session, setSession] = useState<Session | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showSurvey, setShowSurvey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) { router.push('/access-code'); return; }
    if (!problem) { setError('Problem not found'); setIsLoading(false); return; }

    const loadSession = async () => {
      try {
        const response = await fetch(`/api/auth/session?uid=${encodeURIComponent(uid)}`);
        if (response.ok) {
          const { session: sessionData } = await response.json();
          setSession(sessionData as Session);
        } else {
          setError('Failed to load session');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load session');
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
    startStepTimer(`step-${currentStepIndex}`);

    return () => {
      resetAiInteractionCount(problemId, problem?.steps[currentStepIndex]?.id || '');
    };
  }, [uid, problemId, problem, router]);

  if (isLoading) return <LoadingScreen />;
  if (!problem || !session) return <ErrorScreen error={error} onBack={() => router.push('/dashboard')} />;

  const currentStep = problem.steps[currentStepIndex];
  const totalSteps = problem.steps.length;
  const isLastStep = currentStepIndex === totalSteps - 1;
  const isAI = session.mode === 'ai-assisted';

  const handleStepSubmit = async (answer: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/validate-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId, stepId: currentStep.id, studentAnswer: answer }),
      });
      const { isCorrect } = await response.json();

      if (isCorrect) {
        const elapsedTime = getStepElapsedTime(`step-${currentStepIndex}`);
        const aiInteractionCount = getAiInteractionCount(problemId, currentStep.id);

        await logStepAttempt({
          uid: uid!,
          mode: session.mode,
          problemId,
          stepId: currentStep.id,
          studentAnswer: answer,
          attemptNumber: 1,
          isCorrect: true,
          timeSpent: elapsedTime,
          aiInteractionCount,
        });

        if (isLastStep) {
          const newCompleted = [...session.completedProblems, problemId];
          const nextId = getNextProblemId(problemId);
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid, updates: { completedProblems: newCompleted, currentProblemId: nextId || problemId } }),
          });
          setSession((s) => s ? { ...s, completedProblems: newCompleted } : null);
          setShowSurvey(true);
        } else {
          setCurrentStepIndex((i) => i + 1);
          startStepTimer(`step-${currentStepIndex + 1}`);
        }
      }
      return isCorrect;
    } catch {
      return false;
    }
  };

  const handleSurveySubmit = async (responses: { mentalDemand: number; confidence: number; systemHelpfulness: number }) => {
    try {
      await fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, problemId, ...responses }),
      });
      const nextId = getNextProblemId(problemId);
      router.push(nextId ? `/problem/${nextId}` : '/dashboard');
    } catch (err) {
      console.error('Survey error:', err);
    }
  };

  return (
    <>
      {/* Google Fonts — add to your _document.tsx or layout instead */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Serif+Display&family=DM+Sans:wght@400;500&display=swap');

        :root {
          --ink: #1a1814;
          --ink-soft: #6b6660;
          --ink-muted: #a8a29e;
          --surface: #faf9f7;
          --surface-alt: #f2ede8;
          --border: #e5dfd8;
          --accent: #c45a2a;
          --accent-soft: #f5ece6;
          --mono: 'DM Mono', 'Courier New', monospace;
          --sans: 'DM Sans', system-ui, sans-serif;
          --serif: 'DM Serif Display', Georgia, serif;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .problem-root {
          min-height: 100vh;
          background: var(--surface);
          font-family: var(--sans);
          color: var(--ink);
        }

        /* ── Top nav bar ── */
        .topbar {
          position: sticky;
          top: 0;
          z-index: 20;
          background: rgba(250,249,247,0.9);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid var(--border);
          padding: 0 32px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .topbar-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .topbar-title {
          font-family: var(--mono);
          font-size: 0.75rem;
          letter-spacing: 0.08em;
          color: var(--ink-soft);
          text-transform: uppercase;
        }
        .divider-v {
          width: 1px;
          height: 18px;
          background: var(--border);
        }

        .btn-ghost {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--mono);
          font-size: 0.75rem;
          color: var(--ink-soft);
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px 0;
          transition: color 0.15s;
          letter-spacing: 0.04em;
        }
        .btn-ghost:hover { color: var(--ink); }

        /* ── Layout ── */
        .layout {
          display: grid;
          max-width: 1280px;
          margin: 0 auto;
          padding: 40px 32px 80px;
          gap: 32px;
        }
        .layout.with-chat {
          grid-template-columns: 1fr 360px;
        }
        .layout.solo {
          grid-template-columns: 1fr;
          max-width: 800px;
        }

        /* ── Main column ── */
        .main-col {
          display: flex;
          flex-direction: column;
          gap: 32px;
          animation: fadeUp 0.35s ease both;
        }

        /* ── Problem header ── */
        .problem-header {
          padding-bottom: 24px;
          border-bottom: 1px solid var(--border);
        }
        .problem-label {
          font-family: var(--mono);
          font-size: 0.6875rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ink-muted);
          margin-bottom: 8px;
        }
        .problem-title {
          font-family: var(--serif);
          font-size: 1.625rem;
          color: var(--ink);
          line-height: 1.25;
          margin-bottom: 10px;
        }
        .problem-expression {
          font-family: var(--mono);
          font-size: 1rem;
          color: var(--accent);
          letter-spacing: 0.02em;
        }

        /* ── Progress ── */
        .progress-row {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .progress-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .progress-label {
          font-family: var(--mono);
          font-size: 0.6875rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--ink-muted);
        }
        .progress-count {
          font-family: var(--mono);
          font-size: 0.6875rem;
          color: var(--ink-muted);
        }
        .progress-track {
          height: 2px;
          background: var(--border);
          border-radius: 99px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: var(--ink);
          border-radius: 99px;
          transition: width 0.5s cubic-bezier(0.4,0,0.2,1);
        }

        /* Steps trail (dots) */
        .step-dots {
          display: flex;
          gap: 6px;
          align-items: center;
          flex-wrap: wrap;
        }
        .step-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--border);
          transition: background 0.3s, transform 0.3s;
        }
        .step-dot.done { background: var(--ink); }
        .step-dot.active {
          background: var(--accent);
          transform: scale(1.4);
        }

        /* ── Step card ── */
        .step-card {
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 6px;
          overflow: hidden;
          animation: fadeUp 0.3s ease both;
        }
        .step-card-header {
          padding: 20px 24px 16px;
          border-bottom: 1px solid var(--border);
          background: var(--surface);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .step-number {
          font-family: var(--mono);
          font-size: 0.6875rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--ink-muted);
        }
        .step-card-body {
          padding: 24px;
        }

        /* ── Hint banner ── */
        .hint-banner {
          border-left: 2px solid var(--border);
          padding: 4px 16px;
        }
        .hint-text {
          font-size: 0.8125rem;
          color: var(--ink-soft);
          line-height: 1.65;
          font-family: var(--sans);
        }
        .hint-banner.ai-mode {
          border-left-color: var(--accent);
        }
        .hint-banner.ai-mode .hint-text {
          color: var(--accent);
        }

        /* ── Chat column ── */
        .chat-col {
          position: sticky;
          top: 72px;
          padding: 10px;
          height: calc(100vh - 88px);
          display: flex;
          flex-direction: column;
          border: 1px solid var(--border);
          border-radius: 6px;
          overflow: hidden;
          background: #fff;
          animation: fadeUp 0.4s 0.1s ease both;
        }
        .chat-col-header {
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
          background: var(--surface);
          flex-shrink: 0;
        }
        .chat-col-label {
          font-family: var(--mono);
          font-size: 0.6875rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--ink-muted);
          margin-bottom: 2px;
        }
        .chat-col-title {
          font-family: var(--sans);
          font-size: 0.9375rem;
          font-weight: 500;
          color: var(--ink);
        }
        .chat-col-body {
          flex: 1;
          overflow: hidden;
          padding: 0.5rem;
        }

        /* ── Mode badge ── */
        .mode-badge {
          font-family: var(--mono);
          font-size: 0.6875rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 3px 9px;
          border-radius: 2px;
          border: 1px solid;
        }
        .mode-badge.ai {
          background: var(--accent-soft);
          color: var(--accent);
          border-color: #e8c4b0;
        }
        .mode-badge.solo {
          background: var(--surface-alt);
          color: var(--ink-soft);
          border-color: var(--border);
        }

        @media (max-width: 860px) {
          .layout.with-chat {
            grid-template-columns: 1fr;
          }
          .chat-col {
            position: static;
            height: 480px;
          }
        }
        @media (max-width: 600px) {
          .topbar { padding: 0 16px; }
          .layout { padding: 24px 16px 60px; }
        }
      `}</style>

      <div className="problem-root">
        {/* ── Top bar ── */}
        <header className="topbar">
          <div className="topbar-left">
            <button className="btn-ghost" onClick={() => router.push('/dashboard')}>
              <ArrowLeft size={13} />
              Dashboard
            </button>
            <div className="divider-v" />
            <span className="topbar-title">Problem {problemId}</span>
          </div>
          <span className={`mode-badge ${isAI ? 'ai' : 'solo'}`}>
            {isAI ? 'AI-Assisted' : 'Solo Mode'}
          </span>
        </header>

        {/* ── Body grid ── */}
        <div className={`layout ${isAI ? 'with-chat' : 'solo'}`}>

          {/* ── Main column ── */}
          <div className="main-col">

            {/* Problem header */}
            <div className="problem-header">
              <p className="problem-label">Calculus · Step-by-step</p>
              <h1 className="problem-title">{problem.title}</h1>
              <div className="problem-expression"><MathMessage content={problem.expression} /></div>
            </div>

            {/* Progress */}
            <div className="progress-row">
              <div className="progress-label-row">
                <span className="progress-label">Progress</span>
                <span className="progress-count">
                  Step {currentStepIndex + 1} of {totalSteps}
                </span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
                />
              </div>
              {/* Step dots */}
              <div className="step-dots">
                {problem.steps.map((_, i) => (
                  <div
                    key={i}
                    className={`step-dot${i < currentStepIndex ? ' done' : i === currentStepIndex ? ' active' : ''}`}
                  />
                ))}
              </div>
            </div>

            {/* Step card */}
            <div className="step-card">
              <div className="step-card-header">
                <span className="step-number">Step {currentStepIndex + 1}</span>
                {/* Mode chip in card header */}
                <span className={`mode-badge ${isAI ? 'ai' : 'solo'}`} style={{ fontSize: '0.625rem' }}>
                  {isAI ? 'AI-Assisted' : 'Solo'}
                </span>
              </div>
              <div className="step-card-body">
                <ProblemStep
                  key={`step-${currentStepIndex}`}
                  step={currentStep}
                  stepIndex={currentStepIndex}
                  totalSteps={totalSteps}
                  mode={session.mode}
                  onSubmit={handleStepSubmit}
                  onAskAI={() => console.log('[v0] AI chat panel available')}
                />
              </div>
            </div>

            {/* Hint */}
            <div className={`hint-banner ${isAI ? 'ai-mode' : ''}`}>
              <p className="hint-text">
                {isAI
                  ? 'Ask the AI Tutor for hints — it guides without giving away the answer.'
                  : 'Work carefully through each step and verify your reasoning before submitting.'}
              </p>
            </div>
          </div>

          {/* ── Chat column (AI mode only) ── */}
          {isAI && (
            <aside className="chat-col p-4">
              <div className="chat-col-header">
                <p className="chat-col-label">AI Tutor</p>
                <p className="chat-col-title">Ask for guidance</p>
              </div>
              <div className="chat-col-body">
                <ChatPanel
                  uid={uid!}
                  problemId={problemId}
                  currentStep={currentStep}
                  mode={session.mode}
                />
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Survey modal */}
      {session && (
        <SurveyModal
          isOpen={showSurvey}
          problemId={problemId}
          mode={session.mode}
          onSubmit={handleSurveySubmit}
        />
      )}
    </>
  );
}