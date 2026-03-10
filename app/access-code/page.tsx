'use client';

/**
 * Access Code Entry Page — Revamped UI
 * Editorial minimal aesthetic to match the full component suite
 */

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AccessCodeInput } from '@/components/access-code-input';
import { useAuth } from '@/components/auth-provider';

export default function AccessCodePage() {
  const router = useRouter();
  const { uid, isLoading } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!isLoading && uid) {
      setIsRedirecting(true);
      router.push('/select-mode');
    }
  }, [uid, isLoading, router]);

  const handleSuccess = () => {
    setIsRedirecting(true);
    router.push('/select-mode');
  };

  if (isLoading || isRedirecting) {
    return (
      <>
        <style>{accessStyles}</style>
        <main className="access-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 size={22} style={{ color: 'var(--ink-muted)', animation: 'spin 1s linear infinite' }} />
        </main>
      </>
    );
  }

  return (
    <>
      <style>{accessStyles}</style>
      <main className="access-root">

        {/* ── Wordmark ── */}
        <header className="access-wordmark">
          <span className="access-wordmark-text">Calculus Study</span>
        </header>

        <div className="access-body">

          {/* ── Left: copy ── */}
          <div className="access-copy">
            <p className="access-eyebrow">Research Study</p>
            <h1 className="access-title">Calculus<br />Learning<br />Study</h1>
            <p className="access-desc">
              An interactive research study on calculus learning — with and without AI assistance.
              You'll work through a set of differentiation problems, and your interactions will be
              recorded for analysis.
            </p>

            {/* Metadata strip */}
            <div className="access-meta">
              <div className="access-meta-item">
                <span className="access-meta-label">Topic</span>
                <span className="access-meta-value">Differentiation</span>
              </div>
              <div className="access-meta-divider" />
              <div className="access-meta-item">
                <span className="access-meta-label">Format</span>
                <span className="access-meta-value">Step-by-step</span>
              </div>
              <div className="access-meta-divider" />
              <div className="access-meta-item">
                <span className="access-meta-label">Modes</span>
                <span className="access-meta-value">Solo · AI-Assisted</span>
              </div>
            </div>
          </div>

          {/* ── Right: form panel ── */}
          <div className="access-panel">
            <div className="access-panel-header">
              <p className="access-panel-label">Entry</p>
              <p className="access-panel-title">Enter your access code</p>
              <p className="access-panel-sub">
                You should have received a unique code from the study coordinator.
              </p>
            </div>

            <div className="access-panel-body">
              <AccessCodeInput onSuccess={handleSuccess} />
            </div>

            <div className="access-panel-footer">
              <span className="access-footer-label">Note</span>
              <p className="access-footer-text">
                Each access code is single-use and tied to your session. Do not share it.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const accessStyles = `
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

  .access-root {
    min-height: 100vh;
    background: var(--surface);
    font-family: var(--sans);
    color: var(--ink);
    display: flex;
    flex-direction: column;
  }

  /* ── Wordmark ── */
  .access-wordmark {
    padding: 20px 40px;
    border-bottom: 1px solid var(--border);
  }
  .access-wordmark-text {
    font-family: var(--mono);
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--ink-muted);
  }

  /* ── Body: two-col ── */
  .access-body {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    max-width: 1100px;
    width: 100%;
    margin: 0 auto;
    padding: 80px 40px;
    gap: 80px;
    align-items: center;
    animation: fadeUp 0.4s ease both;
  }

  /* ── Copy column ── */
  .access-copy {
    display: flex;
    flex-direction: column;
    gap: 28px;
  }
  .access-eyebrow {
    font-family: var(--mono);
    font-size: 0.6875rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--ink-muted);
  }
  .access-title {
    font-family: var(--serif);
    font-size: clamp(2.5rem, 5vw, 3.75rem);
    line-height: 1.05;
    color: var(--ink);
    letter-spacing: -0.01em;
  }
  .access-desc {
    font-size: 0.9375rem;
    color: var(--ink-soft);
    line-height: 1.75;
    max-width: 380px;
  }

  /* Meta strip */
  .access-meta {
    display: flex;
    align-items: center;
    gap: 20px;
    padding-top: 4px;
  }
  .access-meta-item {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .access-meta-label {
    font-family: var(--mono);
    font-size: 0.5625rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ink-muted);
  }
  .access-meta-value {
    font-family: var(--mono);
    font-size: 0.75rem;
    color: var(--ink-soft);
    letter-spacing: 0.04em;
  }
  .access-meta-divider {
    width: 1px;
    height: 28px;
    background: var(--border);
    flex-shrink: 0;
  }

  /* ── Panel column ── */
  .access-panel {
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .access-panel-header {
    padding: 28px 28px 20px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .access-panel-label {
    font-family: var(--mono);
    font-size: 0.6125rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ink-muted);
  }
  .access-panel-title {
    font-family: var(--serif);
    font-size: 1.25rem;
    color: var(--ink);
  }
  .access-panel-sub {
    font-size: 0.8125rem;
    color: var(--ink-soft);
    line-height: 1.55;
  }

  .access-panel-body {
    padding: 28px;
    flex: 1;
  }

  .access-panel-footer {
    padding: 16px 28px;
    border-top: 1px solid var(--border);
    background: var(--surface);
    display: flex;
    align-items: baseline;
    gap: 10px;
  }
  .access-footer-label {
    font-family: var(--mono);
    font-size: 0.5625rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ink-muted);
    flex-shrink: 0;
  }
  .access-footer-text {
    font-size: 0.75rem;
    color: var(--ink-muted);
    line-height: 1.55;
  }

  /* ── Responsive ── */
  @media (max-width: 760px) {
    .access-body {
      grid-template-columns: 1fr;
      padding: 40px 24px 60px;
      gap: 48px;
    }
    .access-title {
      font-size: 2.5rem;
    }
    .access-wordmark { padding: 16px 24px; }
  }
`;