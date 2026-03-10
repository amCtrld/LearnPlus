'use client';

/**
 * Dashboard Page — Revamped UI
 * Editorial minimal aesthetic to match the full component suite
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, LogOut, ArrowRight, CheckCircle2, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { PROBLEMS, getTotalProblems } from '@/lib/course-data';
import { firestore } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Session } from '@/lib/types';

export default function DashboardPage() {
  const router = useRouter();
  const { uid, logout } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) { router.push('/access-code'); return; }

    const loadSession = async () => {
      try {
        const sessionRef = doc(firestore, 'sessions', uid);
        const sessionDoc = await getDoc(sessionRef);
        if (sessionDoc.exists()) {
          setSession(sessionDoc.data() as Session);
        } else {
          throw new Error('Session not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load session');
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, [uid, router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    logout();
    router.push('/access-code');
  };

  if (isLoading) {
    return (
      <>
        <style>{dashStyles}</style>
        <main className="dash-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <Loader2 size={24} style={{ color: 'var(--ink-muted)', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
              Loading
            </p>
          </div>
        </main>
      </>
    );
  }

  if (!session) {
    return (
      <>
        <style>{dashStyles}</style>
        <main className="dash-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ maxWidth: 400, width: '100%', border: '1px solid var(--border)', borderRadius: 6, padding: 32, background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <AlertCircle size={15} color="var(--accent)" />
              <span style={{ fontFamily: 'var(--mono)', fontSize: '0.6875rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)' }}>Error</span>
            </div>
            <p style={{ fontSize: '0.9375rem', color: 'var(--ink)', marginBottom: 24, lineHeight: 1.6 }}>
              {error || 'Failed to load your session. Please try again.'}
            </p>
            <button className="dash-btn-primary" onClick={() => router.push('/access-code')} style={{ width: '100%' }}>
              Return to access code
            </button>
          </div>
        </main>
      </>
    );
  }

  const completedCount = session.completedProblems.length;
  const totalCount = getTotalProblems();
  const progressPercent = (completedCount / totalCount) * 100;
  const nextProblemId = session.currentProblemId;
  const isAI = session.mode === 'ai-assisted';
  const allDone = completedCount === totalCount;

  return (
    <>
      <style>{dashStyles}</style>
      <div className="dash-root">

        {/* ── Top bar ── */}
        <header className="dash-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span className="dash-topbar-title">Calculus Study</span>
            <div className="dash-divider-v" />
            <span className={`dash-mode-badge ${isAI ? 'ai' : 'solo'}`}>
              {isAI ? 'AI-Assisted' : 'Solo Mode'}
            </span>
          </div>
          <button className="dash-btn-ghost" onClick={handleLogout}>
            <LogOut size={13} />
            Exit study
          </button>
        </header>

        {/* ── Body ── */}
        <div className="dash-body">

          {/* ── Stat row ── */}
          <div className="dash-stats">
            <div className="dash-stat">
              <span className="dash-stat-value">{completedCount}</span>
              <span className="dash-stat-label">Completed</span>
            </div>
            <div className="dash-stat-divider" />
            <div className="dash-stat">
              <span className="dash-stat-value">{totalCount - completedCount}</span>
              <span className="dash-stat-label">Remaining</span>
            </div>
            <div className="dash-stat-divider" />
            <div className="dash-stat">
              <span className="dash-stat-value">{Math.round(progressPercent)}%</span>
              <span className="dash-stat-label">Progress</span>
            </div>
          </div>

          {/* ── Progress bar ── */}
          <div className="dash-progress-block">
            <div className="dash-progress-track">
              <div className="dash-progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
            {allDone && (
              <p className="dash-done-msg">
                <CheckCircle2 size={13} style={{ marginRight: 6, flexShrink: 0 }} />
                All problems complete — great work.
              </p>
            )}
          </div>

          {/* ── Section header ── */}
          <div className="dash-section-header">
            <span className="dash-section-label">Problem set</span>
            <span className="dash-section-count">{totalCount} problems</span>
          </div>

          {/* ── Problem list ── */}
          <div className="dash-problem-list">
            {PROBLEMS.map((problem, idx) => {
              const isCompleted = session.completedProblems.includes(problem.id);
              const isCurrent = problem.id === nextProblemId;
              const isLocked = problem.id > nextProblemId;

              return (
                <div
                  key={problem.id}
                  className={`dash-problem-row${isCurrent ? ' current' : ''}${isLocked ? ' locked' : ''}${isCompleted ? ' completed' : ''}`}
                >
                  {/* Index + status */}
                  <div className="dash-problem-index">
                    {isCompleted ? (
                      <CheckCircle2 size={15} color="#4a7c59" />
                    ) : isLocked ? (
                      <Lock size={13} color="var(--ink-muted)" />
                    ) : (
                      <span className="dash-problem-num">{String(idx + 1).padStart(2, '0')}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="dash-problem-info">
                    <p className="dash-problem-title">{problem.title}</p>
                    <p className="dash-problem-expr">{problem.expression}</p>
                  </div>

                  {/* Meta + action */}
                  <div className="dash-problem-meta">
                    <span className="dash-steps-label">
                      {problem.steps.length} step{problem.steps.length !== 1 ? 's' : ''}
                    </span>
                    <button
                      className={`dash-problem-btn${isCurrent ? ' primary' : ''}${isCompleted ? ' review' : ''}`}
                      onClick={() => router.push(`/problem/${problem.id}`)}
                      disabled={isLocked}
                    >
                      {isCompleted ? 'Review' : isCurrent ? 'Start' : 'Open'}
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Tips strip ── */}
          <div className={`dash-tips${isAI ? ' ai' : ''}`}>
            <p className="dash-tips-label">Tips</p>
            <p className="dash-tips-text">
              Work through problems sequentially. Each problem has multiple steps — answer them carefully.
              {isAI && ' You can ask the AI tutor for hints at any time during problem solving.'}
              {' '}After each problem you'll answer a brief reflection survey.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const dashStyles = `
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

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .dash-root {
    min-height: 100vh;
    background: var(--surface);
    font-family: var(--sans);
    color: var(--ink);
  }

  /* ── Top bar ── */
  .dash-topbar {
    position: sticky;
    top: 0;
    z-index: 20;
    height: 56px;
    padding: 0 32px;
    background: rgba(250,249,247,0.9);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .dash-topbar-title {
    font-family: var(--mono);
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ink-soft);
  }
  .dash-divider-v {
    width: 1px;
    height: 18px;
    background: var(--border);
  }
  .dash-mode-badge {
    font-family: var(--mono);
    font-size: 0.6875rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 3px 9px;
    border-radius: 2px;
    border: 1px solid;
  }
  .dash-mode-badge.ai {
    background: var(--accent-soft);
    color: var(--accent);
    border-color: #e8c4b0;
  }
  .dash-mode-badge.solo {
    background: var(--surface-alt);
    color: var(--ink-soft);
    border-color: var(--border);
  }
  .dash-btn-ghost {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--mono);
    font-size: 0.75rem;
    letter-spacing: 0.04em;
    color: var(--ink-soft);
    background: none;
    border: none;
    cursor: pointer;
    transition: color 0.15s;
    padding: 6px 0;
  }
  .dash-btn-ghost:hover { color: var(--ink); }

  /* ── Body ── */
  .dash-body {
    max-width: 860px;
    margin: 0 auto;
    padding: 48px 32px 80px;
    display: flex;
    flex-direction: column;
    gap: 36px;
    animation: fadeUp 0.35s ease both;
  }

  /* ── Stats ── */
  .dash-stats {
    display: flex;
    align-items: center;
    gap: 32px;
  }
  .dash-stat {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .dash-stat-value {
    font-family: var(--serif);
    font-size: 2rem;
    color: var(--ink);
    line-height: 1;
  }
  .dash-stat-label {
    font-family: var(--mono);
    font-size: 0.625rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink-muted);
  }
  .dash-stat-divider {
    width: 1px;
    height: 36px;
    background: var(--border);
  }

  /* ── Progress ── */
  .dash-progress-block {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .dash-progress-track {
    height: 2px;
    background: var(--border);
    border-radius: 99px;
    overflow: hidden;
  }
  .dash-progress-fill {
    height: 100%;
    background: var(--ink);
    border-radius: 99px;
    transition: width 0.6s cubic-bezier(0.4,0,0.2,1);
  }
  .dash-done-msg {
    display: flex;
    align-items: center;
    font-size: 0.8125rem;
    color: #4a7c59;
    font-family: var(--mono);
    font-size: 0.75rem;
    letter-spacing: 0.04em;
  }

  /* ── Section header ── */
  .dash-section-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border);
  }
  .dash-section-label {
    font-family: var(--serif);
    font-size: 1.25rem;
    color: var(--ink);
  }
  .dash-section-count {
    font-family: var(--mono);
    font-size: 0.6875rem;
    letter-spacing: 0.1em;
    color: var(--ink-muted);
    text-transform: uppercase;
  }

  /* ── Problem rows ── */
  .dash-problem-list {
    display: flex;
    flex-direction: column;
  }
  .dash-problem-row {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 18px 0;
    border-bottom: 1px solid var(--border);
    transition: background 0.15s;
  }
  .dash-problem-row:first-child { border-top: none; }
  .dash-problem-row.locked { opacity: 0.4; }
  .dash-problem-row.current {
    background: none;
  }
  .dash-problem-row.completed .dash-problem-title {
    color: var(--ink-soft);
  }

  .dash-problem-index {
    width: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .dash-problem-num {
    font-family: var(--mono);
    font-size: 0.75rem;
    color: var(--ink-muted);
    letter-spacing: 0.06em;
  }

  .dash-problem-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }
  .dash-problem-title {
    font-size: 0.9375rem;
    font-weight: 500;
    color: var(--ink);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .dash-problem-expr {
    font-family: var(--mono);
    font-size: 0.8125rem;
    color: var(--accent);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dash-problem-meta {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-shrink: 0;
  }
  .dash-steps-label {
    font-family: var(--mono);
    font-size: 0.6875rem;
    color: var(--ink-muted);
    letter-spacing: 0.06em;
    white-space: nowrap;
  }
  .dash-problem-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 6px 14px;
    border-radius: 3px;
    border: 1px solid var(--border);
    background: none;
    font-family: var(--mono);
    font-size: 0.75rem;
    letter-spacing: 0.06em;
    color: var(--ink-soft);
    cursor: pointer;
    white-space: nowrap;
    transition: border-color 0.15s, color 0.15s, background 0.15s;
  }
  .dash-problem-btn:hover:not(:disabled) {
    border-color: var(--ink);
    color: var(--ink);
  }
  .dash-problem-btn.primary {
    background: var(--ink);
    color: #fff;
    border-color: var(--ink);
  }
  .dash-problem-btn.primary:hover { opacity: 0.85; }
  .dash-problem-btn.review {
    color: #4a7c59;
    border-color: #c2dece;
    background: #f3faf5;
  }
  .dash-problem-btn.review:hover { background: #e8f5ec; }
  .dash-problem-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  /* ── Tips ── */
  .dash-tips {
    border-left: 2px solid var(--border);
    padding: 4px 16px;
  }
  .dash-tips.ai { border-left-color: var(--accent); }
  .dash-tips-label {
    font-family: var(--mono);
    font-size: 0.625rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink-muted);
    margin-bottom: 5px;
  }
  .dash-tips-text {
    font-size: 0.8125rem;
    color: var(--ink-soft);
    line-height: 1.65;
  }

  /* ── Shared buttons ── */
  .dash-btn-primary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: 4px;
    border: none;
    background: var(--ink);
    color: #fff;
    font-family: var(--sans);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.15s;
  }
  .dash-btn-primary:hover { opacity: 0.85; }

  @media (max-width: 600px) {
    .dash-topbar { padding: 0 16px; }
    .dash-body { padding: 32px 16px 60px; }
    .dash-stats { gap: 20px; }
    .dash-stat-value { font-size: 1.5rem; }
    .dash-steps-label { display: none; }
  }
`;