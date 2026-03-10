'use client';

/**
 * Landing Page — Revamped UI
 * Editorial minimal aesthetic to match the full component suite
 */

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';

export default function Home() {
  const router = useRouter();
  const { uid, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && uid) router.replace('/select-mode');
  }, [uid, isLoading, router]);

  if (isLoading) {
    return (
      <>
        <style>{landingStyles}</style>
        <main className="landing-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 size={22} style={{ color: 'var(--ink-muted)', animation: 'spin 1s linear infinite' }} />
        </main>
      </>
    );
  }

  return (
    <>
      <style>{landingStyles}</style>
      <main className="landing-root">

        {/* ── Nav ── */}
        <nav className="landing-nav">
          <span className="landing-wordmark">LearnPlus</span>
          <button
            className="landing-nav-cta"
            onClick={() => router.push('/access-code')}
            type="button"
          >
            Enter study
            <ArrowRight size={13} />
          </button>
        </nav>

        {/* ── Hero ── */}
        <div className="landing-hero">

          {/* Left: copy */}
          <div className="landing-copy">
            <div className="landing-copy-inner">
              <p className="landing-eyebrow">MSc Dissertation · 2026</p>

              <h1 className="landing-title">
                How does AI shape the way we learn?
              </h1>

              <p className="landing-body">
                LearnPlus is a research platform comparing independent
                problem-solving with guided, step-by-step AI tutoring;
                measuring learning outcomes, cognitive load, and engagement
                across both modes.
              </p>

              {/* Meta strip */}
              <div className="landing-meta">
                <div className="landing-meta-item">
                  <span className="landing-meta-label">Topic</span>
                  <span className="landing-meta-val">Differentiation</span>
                </div>
                <div className="landing-meta-div" />
                <div className="landing-meta-item">
                  <span className="landing-meta-label">Study modes</span>
                  <span className="landing-meta-val">Solo · AI-Assisted</span>
                </div>
                <div className="landing-meta-div" />
                <div className="landing-meta-item">
                  <span className="landing-meta-label">Format</span>
                  <span className="landing-meta-val">Step-by-step</span>
                </div>
              </div>

              <button
                className="landing-cta"
                onClick={() => router.push('/access-code')}
                type="button"
              >
                Get started
                <ArrowRight size={16} />
              </button>

              <p className="landing-cta-sub">
                You'll need an access code from the study coordinator.
              </p>
            </div>
          </div>

          {/* Right: image */}
          <div className="landing-image-col">
            <div className="landing-image-wrap">
              <Image
                src="/heroImage.jpg"
                alt="Student learning with an AI tutor"
                width={560}
                height={620}
                priority
                className="landing-image"
              />
              {/* Decorative frame lines */}
              <div className="landing-frame-tl" />
              <div className="landing-frame-br" />
            </div>
          </div>
        </div>

        {/* ── Footer strip ── */}
        <footer className="landing-footer">
          <span className="landing-footer-text">
            Part of an MSc research dissertation. All interactions are recorded for analysis.
          </span>
          <span className="landing-footer-text">LearnPlus © 2025</span>
        </footer>
      </main>
    </>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const landingStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Serif+Display&family=DM+Sans:wght@400;500&display=swap');

  :root {
    --ink: #1a1814;
    --ink-soft: #6b6660;
    --ink-muted: #716d6b;
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
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .landing-root {
    min-height: 100vh;
    background: var(--surface);
    font-family: var(--sans);
    color: var(--ink);
    display: flex;
    flex-direction: column;
  }

  /* ── Nav ── */
  .landing-nav {
    height: 60px;
    padding: 0 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }
  .landing-wordmark {
    font-family: var(--serif);
    font-size: 1.125rem;
    color: var(--ink);
    letter-spacing: -0.01em;
  }
  .landing-nav-cta {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--mono);
    font-size: 0.75rem;
    letter-spacing: 0.06em;
    color: var(--ink-soft);
    background: none;
    border: 1px solid var(--border);
    border-radius: 3px;
    padding: 6px 14px;
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s;
  }
  .landing-nav-cta:hover {
    border-color: var(--ink);
    color: var(--ink);
  }

  /* ── Hero ── */
  .landing-hero {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    padding: 72px 48px 80px;
    gap: 72px;
    align-items: center;
  }

  /* ── Copy ── */
  .landing-copy {
    animation: fadeUp 0.5s ease both;
  }
  .landing-copy-inner {
    display: flex;
    flex-direction: column;
    gap: 28px;
    max-width: 500px;
  }
  .landing-eyebrow {
    font-family: var(--mono);
    font-size: 0.6875rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--ink-muted);
  }
  .landing-title {
    font-family: var(--serif);
    font-size: clamp(2rem, 3.5vw, 3rem);
    line-height: 1.1;
    color: var(--ink);
    letter-spacing: -0.01em;
  }
  .landing-body {
    font-size: 1rem;
    color: var(--ink-soft);
    line-height: 1.75;
  }

  /* Meta strip */
  .landing-meta {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 20px 0;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }
  .landing-meta-item {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .landing-meta-label {
    font-family: var(--mono);
    font-size: 0.5625rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ink-muted);
  }
  .landing-meta-val {
    font-family: var(--mono);
    font-size: 0.75rem;
    color: var(--ink-soft);
    letter-spacing: 0.03em;
  }
  .landing-meta-div {
    width: 1px;
    height: 28px;
    background: var(--border);
    flex-shrink: 0;
  }

  /* CTA */
  .landing-cta {
    display: flex;
    align-items: center;
    gap: 10px;
    width: fit-content;
    padding: 14px 28px;
    border: none;
    border-radius: 4px;
    background: var(--ink);
    color: #fff;
    font-family: var(--sans);
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.15s;
  }
  .landing-cta:hover {
    opacity: 0.88;
    transform: translateY(-1px);
  }
  .landing-cta-sub {
    font-family: var(--mono);
    font-size: 0.6875rem;
    color: var(--ink-muted);
    letter-spacing: 0.04em;
    margin-top: -12px;
  }

  /* ── Image ── */
  .landing-image-col {
    display: flex;
    justify-content: center;
    animation: fadeIn 0.6s 0.15s ease both;
  }
  .landing-image-wrap {
    position: relative;
    width: 100%;
    max-width: 480px;
  }
  .landing-image {
    width: 100%;
    height: auto;
    border-radius: 6px;
    object-fit: cover;
    display: block;
    position: relative;
    z-index: 1;
  }

  /* Decorative offset frame */
  .landing-frame-tl {
    position: absolute;
    top: -12px;
    left: -12px;
    width: 60px;
    height: 60px;
    border-top: 2px solid var(--border);
    border-left: 2px solid var(--border);
    border-radius: 2px 0 0 0;
    z-index: 0;
  }
  .landing-frame-br {
    position: absolute;
    bottom: -12px;
    right: -12px;
    width: 60px;
    height: 60px;
    border-bottom: 2px solid var(--accent);
    border-right: 2px solid var(--accent);
    border-radius: 0 0 2px 0;
    z-index: 0;
  }

  /* ── Footer ── */
  .landing-footer {
    padding: 16px 48px;
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }
  .landing-footer-text {
    font-family: var(--mono);
    font-size: 0.6875rem;
    color: var(--ink-muted);
    letter-spacing: 0.04em;
  }

  /* ── Responsive ── */
  @media (max-width: 860px) {
    .landing-hero {
      grid-template-columns: 1fr;
      padding: 48px 24px 64px;
      gap: 48px;
    }
    .landing-copy-inner { max-width: 100%; }
    .landing-image-col { order: -1; }
    .landing-image-wrap { max-width: 360px; }
    .landing-nav { padding: 0 24px; }
    .landing-footer { padding: 16px 24px; flex-direction: column; gap: 6px; align-items: flex-start; }
  }
`;