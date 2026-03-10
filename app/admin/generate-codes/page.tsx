'use client';

/**
 * Admin: Generate Access Codes — Revamped UI
 * Editorial minimal aesthetic to match the full component suite
 */

import { useState } from 'react';
import { Download, Copy, Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export default function GenerateCodesPage() {
  const [adminKey, setAdminKey] = useState('');
  const [count, setCount] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codes, setCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setError(null);
    setCodes([]);
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/generate-access-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminKey}`,
        },
        body: JSON.stringify({ count }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate codes');
      }
      const { codes: generated } = await response.json();
      setCodes(generated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!codes.length) return;
    const csv = 'access_code\n' + codes.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `access_codes_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(codes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasCodes = codes.length > 0;

  return (
    <>
      <style>{adminStyles}</style>
      <div className="admin-root">

        {/* ── Top bar ── */}
        <header className="admin-topbar">
          <span className="admin-topbar-title">Admin</span>
          <div className="admin-divider-v" />
          <span className="admin-topbar-sub">Generate Access Codes</span>
        </header>

        <div className="admin-body">

          {/* ── Page header ── */}
          <div className="admin-page-header">
            <p className="admin-eyebrow">Researcher tools</p>
            <h1 className="admin-title">Generate Access Codes</h1>
            <p className="admin-subtitle">
              Create batches of unique one-time access codes for study participants.
            </p>
          </div>

          {/* ── Main grid ── */}
          <div className="admin-grid">

            {/* ── Left: form ── */}
            <div className="admin-form-col">
              <div className="admin-card">
                <div className="admin-card-header">
                  <p className="admin-card-label">Configuration</p>
                  <p className="admin-card-title">Create new codes</p>
                </div>
                <div className="admin-card-body">

                  {/* Admin key */}
                  <div className="admin-field">
                    <label className="admin-field-label" htmlFor="adminKey">
                      Admin API key
                    </label>
                    <input
                      id="adminKey"
                      type="password"
                      className="admin-input"
                      placeholder="••••••••••••"
                      value={adminKey}
                      onChange={(e) => setAdminKey(e.target.value)}
                      disabled={isLoading}
                      autoComplete="off"
                    />
                  </div>

                  {/* Count */}
                  <div className="admin-field">
                    <div className="admin-field-label-row">
                      <label className="admin-field-label" htmlFor="count">
                        Number of codes
                      </label>
                      <span className="admin-field-hint">1 – 1000</span>
                    </div>
                    <div className="admin-count-row">
                      <button
                        className="admin-count-btn"
                        type="button"
                        onClick={() => setCount((n) => Math.max(1, n - 1))}
                        disabled={isLoading || count <= 1}
                      >−</button>
                      <input
                        id="count"
                        type="number"
                        className="admin-input admin-count-input"
                        min="1"
                        max="1000"
                        value={count}
                        onChange={(e) =>
                          setCount(Math.min(1000, Math.max(1, parseInt(e.target.value) || 1)))
                        }
                        disabled={isLoading}
                      />
                      <button
                        className="admin-count-btn"
                        type="button"
                        onClick={() => setCount((n) => Math.min(1000, n + 1))}
                        disabled={isLoading || count >= 1000}
                      >+</button>
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="admin-error">
                      <AlertCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                      {error}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    className="admin-submit"
                    onClick={handleGenerate}
                    disabled={isLoading || count < 1 || !adminKey}
                    type="button"
                  >
                    {isLoading
                      ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                      : <ArrowRight size={14} />
                    }
                    {isLoading ? 'Generating…' : `Generate ${count} code${count !== 1 ? 's' : ''}`}
                  </button>
                </div>
              </div>

              {/* ── Instructions ── */}
              <div className="admin-instructions">
                <p className="admin-instructions-label">Instructions</p>
                <ol className="admin-instructions-list">
                  <li>Generate the number of codes needed for your participants.</li>
                  <li>Download the CSV or copy codes to distribute.</li>
                  <li>Each code is single-use — once entered, it's linked to a participant UID.</li>
                  <li>Each participant gets a unique UID for one-to-one data mapping.</li>
                </ol>
              </div>
            </div>

            {/* ── Right: results ── */}
            <div className="admin-results-col">
              {hasCodes ? (
                <div className="admin-card" style={{ flex: 1 }}>
                  <div className="admin-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <p className="admin-card-label">Output</p>
                        <p className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <CheckCircle2 size={15} color="#4a7c59" />
                          {codes.length} code{codes.length !== 1 ? 's' : ''} generated
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="admin-action-btn" onClick={handleDownloadCSV} type="button">
                          <Download size={13} />
                          CSV
                        </button>
                        <button
                          className={`admin-action-btn${copied ? ' copied' : ''}`}
                          onClick={handleCopyAll}
                          type="button"
                        >
                          <Copy size={13} />
                          {copied ? 'Copied!' : 'Copy all'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Code grid */}
                  <div className="admin-codes-scroll">
                    <div className="admin-codes-grid">
                      {codes.map((code, idx) => (
                        <div key={idx} className="admin-code-chip">
                          <span className="admin-code-idx">{String(idx + 1).padStart(2, '0')}</span>
                          <span className="admin-code-val">{code}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Empty state */
                <div className="admin-empty">
                  <div className="admin-empty-inner">
                    <p className="admin-empty-title">No codes yet</p>
                    <p className="admin-empty-sub">
                      Configure and generate a batch on the left.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const adminStyles = `
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

  .admin-root {
    min-height: 100vh;
    background: var(--surface);
    font-family: var(--sans);
    color: var(--ink);
  }

  /* ── Top bar ── */
  .admin-topbar {
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
    gap: 14px;
  }
  .admin-topbar-title {
    font-family: var(--mono);
    font-size: 0.6875rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--accent);
    background: var(--accent-soft);
    border: 1px solid #e8c4b0;
    padding: 2px 8px;
    border-radius: 2px;
  }
  .admin-divider-v {
    width: 1px;
    height: 18px;
    background: var(--border);
  }
  .admin-topbar-sub {
    font-family: var(--mono);
    font-size: 0.75rem;
    letter-spacing: 0.06em;
    color: var(--ink-soft);
  }

  /* ── Body ── */
  .admin-body {
    max-width: 1100px;
    margin: 0 auto;
    padding: 48px 32px 80px;
    display: flex;
    flex-direction: column;
    gap: 40px;
    animation: fadeUp 0.35s ease both;
  }

  /* ── Page header ── */
  .admin-page-header {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-bottom: 32px;
    border-bottom: 1px solid var(--border);
  }
  .admin-eyebrow {
    font-family: var(--mono);
    font-size: 0.6875rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ink-muted);
  }
  .admin-title {
    font-family: var(--serif);
    font-size: 1.875rem;
    color: var(--ink);
    line-height: 1.15;
  }
  .admin-subtitle {
    font-size: 0.9rem;
    color: var(--ink-soft);
    line-height: 1.65;
    max-width: 480px;
  }

  /* ── Grid ── */
  .admin-grid {
    display: grid;
    grid-template-columns: 380px 1fr;
    gap: 32px;
    align-items: start;
  }
  .admin-form-col {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  .admin-results-col {
    display: flex;
    flex-direction: column;
    min-height: 320px;
  }

  /* ── Card ── */
  .admin-card {
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 6px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .admin-card-header {
    padding: 20px 24px 16px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
  }
  .admin-card-label {
    font-family: var(--mono);
    font-size: 0.625rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ink-muted);
    margin-bottom: 4px;
  }
  .admin-card-title {
    font-family: var(--sans);
    font-size: 0.9375rem;
    font-weight: 500;
    color: var(--ink);
  }
  .admin-card-body {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  /* ── Form fields ── */
  .admin-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .admin-field-label-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }
  .admin-field-label {
    font-family: var(--mono);
    font-size: 0.6875rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--ink-muted);
  }
  .admin-field-hint {
    font-family: var(--mono);
    font-size: 0.625rem;
    color: var(--ink-muted);
    letter-spacing: 0.06em;
  }
  .admin-input {
    height: 42px;
    padding: 0 14px;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: var(--surface);
    font-family: var(--mono);
    font-size: 0.875rem;
    color: var(--ink);
    outline: none;
    width: 100%;
    transition: border-color 0.15s;
  }
  .admin-input:focus { border-color: var(--ink); background: #fff; }
  .admin-input:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Count stepper */
  .admin-count-row {
    display: flex;
    align-items: center;
    gap: 0;
  }
  .admin-count-btn {
    width: 42px;
    height: 42px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--ink-soft);
    font-size: 1.125rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, color 0.15s;
    flex-shrink: 0;
  }
  .admin-count-btn:first-child { border-radius: 4px 0 0 4px; border-right: none; }
  .admin-count-btn:last-child  { border-radius: 0 4px 4px 0; border-left: none; }
  .admin-count-btn:hover:not(:disabled) { background: var(--surface-alt); color: var(--ink); }
  .admin-count-btn:disabled { opacity: 0.35; cursor: not-allowed; }
  .admin-count-input {
    border-radius: 0;
    text-align: center;
    border-left: none;
    border-right: none;
    flex: 1;
  }
  /* hide number spinners */
  .admin-count-input::-webkit-inner-spin-button,
  .admin-count-input::-webkit-outer-spin-button { -webkit-appearance: none; }
  .admin-count-input[type=number] { -moz-appearance: textfield; }

  /* Error */
  .admin-error {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 14px;
    border-radius: 4px;
    border: 1px solid #e8c4bf;
    background: #fdf4f3;
    font-size: 0.8125rem;
    color: #7a2e24;
    line-height: 1.5;
  }

  /* Submit */
  .admin-submit {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    height: 44px;
    border: none;
    border-radius: 4px;
    background: var(--ink);
    color: #fff;
    font-family: var(--sans);
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.15s;
  }
  .admin-submit:disabled { opacity: 0.28; cursor: not-allowed; }
  .admin-submit:not(:disabled):hover { opacity: 0.85; }

  /* ── Instructions ── */
  .admin-instructions {
    border-left: 2px solid var(--border);
    padding: 4px 16px;
  }
  .admin-instructions-label {
    font-family: var(--mono);
    font-size: 0.625rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink-muted);
    margin-bottom: 8px;
  }
  .admin-instructions-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 6px;
    counter-reset: inst;
  }
  .admin-instructions-list li {
    font-size: 0.8125rem;
    color: var(--ink-soft);
    line-height: 1.6;
    display: flex;
    gap: 10px;
    counter-increment: inst;
  }
  .admin-instructions-list li::before {
    content: counter(inst, decimal-leading-zero);
    font-family: var(--mono);
    font-size: 0.625rem;
    color: var(--ink-muted);
    letter-spacing: 0.06em;
    margin-top: 3px;
    flex-shrink: 0;
  }

  /* ── Results ── */
  .admin-action-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 6px 12px;
    border: 1px solid var(--border);
    border-radius: 3px;
    background: none;
    font-family: var(--mono);
    font-size: 0.6875rem;
    letter-spacing: 0.06em;
    color: var(--ink-soft);
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s, background 0.15s;
    white-space: nowrap;
  }
  .admin-action-btn:hover { border-color: var(--ink); color: var(--ink); }
  .admin-action-btn.copied {
    border-color: #4a7c59;
    color: #4a7c59;
    background: #f3faf5;
  }

  /* Scrollable code list */
  .admin-codes-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 20px 24px;
    max-height: 480px;
  }
  .admin-codes-scroll::-webkit-scrollbar { width: 4px; }
  .admin-codes-scroll::-webkit-scrollbar-track { background: transparent; }
  .admin-codes-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }

  .admin-codes-grid {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .admin-code-chip {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 8px 12px;
    border-radius: 3px;
    transition: background 0.1s;
  }
  .admin-code-chip:hover { background: var(--surface-alt); }
  .admin-code-idx {
    font-family: var(--mono);
    font-size: 0.625rem;
    color: var(--ink-muted);
    letter-spacing: 0.06em;
    width: 20px;
    flex-shrink: 0;
  }
  .admin-code-val {
    font-family: var(--mono);
    font-size: 0.875rem;
    color: var(--ink);
    letter-spacing: 0.12em;
  }

  /* Empty state */
  .admin-empty {
    flex: 1;
    border: 1px dashed var(--border);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 320px;
  }
  .admin-empty-inner {
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .admin-empty-title {
    font-family: var(--serif);
    font-size: 1rem;
    color: var(--ink-muted);
  }
  .admin-empty-sub {
    font-family: var(--mono);
    font-size: 0.6875rem;
    color: var(--ink-muted);
    letter-spacing: 0.04em;
  }

  @media (max-width: 800px) {
    .admin-grid { grid-template-columns: 1fr; }
    .admin-body { padding: 32px 20px 60px; }
    .admin-topbar { padding: 0 20px; }
  }
`;