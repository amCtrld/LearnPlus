'use client';

/**
 * Mode Selection Page — Revamped UI
 * Editorial minimal aesthetic to match the full component suite
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, BookOpen, Brain, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { StudyMode } from '@/lib/types';

const MODES = [
  {
    id: 'control' as StudyMode,
    icon: BookOpen,
    label: 'Solo',
    sublabel: 'Work independently',
    description:
      'Solve each problem on your own without AI assistance.',
    features: ['No AI assistance', 'Full independent solving', 'Tests baseline knowledge'],
  },
  {
    id: 'ai-assisted' as StudyMode,
    icon: Brain,
    label: 'AI-Assisted',
    sublabel: 'Learn with a tutor',
    description:
      'It will guide you step-by-step and explain concepts without just handing you answers.',
    features: ['Hints on demand', 'Concept explanations', 'Step-by-step guidance'],
  },
];

export default function SelectModePage() {
  const router = useRouter();
  const { uid, isLoading: authLoading, updateSession } = useAuth();
  const [selected, setSelected] = useState<StudyMode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !uid) router.replace('/access-code');
  }, [authLoading, uid, router]);

  const handleContinue = async () => {
    if (!selected || !uid) return;
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/select-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, mode: selected }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save mode');
      }
      updateSession({ mode: selected });
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save mode');
      setIsLoading(false);
    }
  };

  if (authLoading || !uid) {
    return (
      <>
        <style>{modeStyles}</style>
        <main className="mode-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 size={22} style={{ color: 'var(--ink-muted)', animation: 'spin 1s linear infinite' }} />
        </main>
      </>
    );
  }

  return (
    <>
      <style>{modeStyles}</style>
      <main className="mode-root">
        <div className="mode-body">

          {/* ── Header ── */}
          <div className="mode-header">
            <p className="mode-eyebrow">Study setup</p>
            <h1 className="mode-title">Choose your mode</h1>
            <p className="mode-subtitle">
              This determines how you work through the calculus problem set.
              Your choice is permanent for this session.
            </p>
          </div>

          {/* ── Mode cards ── */}
          <div className="mode-cards">
            {MODES.map(({ id, icon: Icon, label, sublabel, description, features }) => {
              const isSelected = selected === id;
              return (
                <button
                  key={id}
                  className={`mode-card${isSelected ? ' selected' : ''}`}
                  onClick={() => setSelected(id)}
                  type="button"
                >
                  {/* Card top */}
                  <div className="mode-card-top">
                    <div className={`mode-card-icon${isSelected ? ' selected' : ''}`}>
                      <Icon size={18} />
                    </div>
                    <div className="mode-card-labels">
                      <span className="mode-card-label">{label}</span>
                      <span className="mode-card-sublabel">{sublabel}</span>
                    </div>
                    {/* Selection indicator */}
                    <div className={`mode-radio${isSelected ? ' selected' : ''}`}>
                      {isSelected && <div className="mode-radio-dot" />}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="mode-card-desc">{description}</p>

                  {/* Features */}
                  <ul className="mode-features">
                    {features.map((f) => (
                      <li key={f} className="mode-feature">
                        <span className={`mode-feature-dot${isSelected ? ' selected' : ''}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="mode-error">
              <AlertCircle size={13} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          {/* ── CTA ── */}
          <div className="mode-cta-block">
            <button
              className="mode-cta"
              onClick={handleContinue}
              disabled={!selected || isLoading}
              type="button"
            >
              {isLoading ? (
                <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <ArrowRight size={15} />
              )}
              {isLoading ? 'Starting…' : 'Begin study session'}
            </button>

            {/* Warning note */}
            <div className="mode-warning">
              <span className="mode-warning-label">Note</span>
              <p className="mode-warning-text">
                Your study mode cannot be changed once you begin.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const modeStyles = `
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
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .mode-root {
    min-height: 100vh;
    background: var(--surface);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 24px;
    font-family: var(--sans);
    color: var(--ink);
  }

  /* ── Body ── */
  .mode-body {
    width: 100%;
    max-width: 680px;
    display: flex;
    flex-direction: column;
    gap: 40px;
    animation: fadeUp 0.35s ease both;
  }

  /* ── Header ── */
  .mode-header {
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .mode-eyebrow {
    font-family: var(--mono);
    font-size: 0.6875rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ink-muted);
  }
  .mode-title {
    font-family: var(--serif);
    font-size: 2rem;
    color: var(--ink);
    line-height: 1.15;
  }
  .mode-subtitle {
    font-size: 0.9rem;
    color: var(--ink-soft);
    line-height: 1.65;
    max-width: 440px;
    margin: 0 auto;
  }

  /* ── Cards ── */
  .mode-cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .mode-card {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 24px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: #fff;
    cursor: pointer;
    text-align: left;
    transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
    position: relative;
    outline: none;
  }
  .mode-card:hover {
    border-color: #c8c2ba;
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(26,24,20,0.06);
  }
  .mode-card.selected {
    border-color: var(--ink);
    box-shadow: 0 4px 20px rgba(26,24,20,0.10);
    transform: translateY(-2px);
  }

  /* Card top row */
  .mode-card-top {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }
  .mode-card-icon {
    width: 36px;
    height: 36px;
    border-radius: 4px;
    background: var(--surface-alt);
    border: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--ink-soft);
    flex-shrink: 0;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
  }
  .mode-card-icon.selected {
    background: var(--ink);
    border-color: var(--ink);
    color: #fff;
  }
  .mode-card-labels {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .mode-card-label {
    font-family: var(--sans);
    font-size: 0.9375rem;
    font-weight: 500;
    color: var(--ink);
  }
  .mode-card-sublabel {
    font-family: var(--mono);
    font-size: 0.6875rem;
    letter-spacing: 0.06em;
    color: var(--ink-muted);
  }

  /* Radio indicator */
  .mode-radio {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 1px solid var(--border);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.15s;
    margin-top: 2px;
  }
  .mode-radio.selected { border-color: var(--ink); }
  .mode-radio-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--ink);
  }

  /* Description */
  .mode-card-desc {
    font-size: 0.8125rem;
    color: var(--ink-soft);
    line-height: 1.65;
  }

  /* Features */
  .mode-features {
    display: flex;
    flex-direction: column;
    gap: 6px;
    list-style: none;
    padding-top: 4px;
    border-top: 1px solid var(--border);
  }
  .mode-feature {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--mono);
    font-size: 0.6875rem;
    letter-spacing: 0.04em;
    color: var(--ink-soft);
  }
  .mode-feature-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--border);
    flex-shrink: 0;
    transition: background 0.15s;
  }
  .mode-feature-dot.selected { background: var(--ink); }

  /* ── Error ── */
  .mode-error {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-radius: 4px;
    border: 1px solid #e8c4bf;
    background: #fdf4f3;
    font-size: 0.8125rem;
    color: #7a2e24;
    font-family: var(--sans);
  }

  /* ── CTA ── */
  .mode-cta-block {
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: center;
  }
  .mode-cta {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 28px;
    border: none;
    border-radius: 4px;
    background: var(--ink);
    color: #fff;
    font-family: var(--sans);
    font-size: 0.9375rem;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.15s;
    width: 100%;
    justify-content: center;
  }
  .mode-cta:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  .mode-cta:not(:disabled):hover { opacity: 0.85; }

  /* Warning note */
  .mode-warning {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }
  .mode-warning-label {
    font-family: var(--mono);
    font-size: 0.625rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink-muted);
    flex-shrink: 0;
  }
  .mode-warning-text {
    font-size: 0.8125rem;
    color: var(--ink-muted);
    line-height: 1.5;
  }

  @media (max-width: 520px) {
    .mode-cards { grid-template-columns: 1fr; }
    .mode-title { font-size: 1.625rem; }
  }
`;