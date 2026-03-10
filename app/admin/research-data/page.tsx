'use client';

/**
 * Admin: Research Data Dashboard — Revamped UI
 * Editorial minimal aesthetic to match the full component suite
 */

import { useState } from 'react';
import { Download, Loader2, AlertCircle, ArrowRight, KeyRound } from 'lucide-react';

interface ResearchStats {
  totalParticipants: number;
  controlParticipants: number;
  aiAssistedParticipants: number;
  totalLogEntries: number;
  totalSurveyResponses: number;
  averageCompletionRate: number;
  averageMentalDemand: number;
  averageConfidence: number;
  averageSystemHelpfulness: number;
}

// ── Shared mini-components ───────────────────────────────────────────────────

function StatBar({ value, max = 7 }: { value: number; max?: number }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ height: 3, background: 'var(--border)', borderRadius: 99, overflow: 'hidden', flex: 1 }}>
      <div style={{ height: '100%', width: `${pct}%`, background: 'var(--ink)', borderRadius: 99, transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)' }} />
    </div>
  );
}

function ModeBar({ control, ai, total }: { control: number; ai: number; total: number }) {
  if (total === 0) return null;
  const ctrlPct = (control / total) * 100;
  const aiPct = (ai / total) * 100;
  return (
    <div style={{ height: 6, borderRadius: 99, overflow: 'hidden', display: 'flex', background: 'var(--border)' }}>
      <div style={{ width: `${ctrlPct}%`, background: 'var(--ink)', transition: 'width 0.6s ease' }} />
      <div style={{ width: `${aiPct}%`, background: 'var(--accent)', transition: 'width 0.6s ease' }} />
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function ResearchDataPage() {
  const [adminKey, setAdminKey] = useState('');
  const [stats, setStats] = useState<ResearchStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    if (!adminKey) return;
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/research-stats', {
        headers: { Authorization: `Bearer ${adminKey}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch research data');
      }
      setStats(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load research data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch('/api/admin/export-data', {
        headers: { Authorization: `Bearer ${adminKey}` },
      });
      if (!res.ok) throw new Error('Failed to export data');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lms_research_data_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  // ── Auth gate ──────────────────────────────────────────────────────────────
  if (!stats) {
    return (
      <>
        <style>{rdStyles}</style>
        <main className="rd-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="rd-gate">
            <div className="rd-gate-header">
              <KeyRound size={16} color="var(--ink-muted)" />
              <div>
                <p className="rd-gate-label">Admin access</p>
                <p className="rd-gate-title">Research data dashboard</p>
              </div>
            </div>

            <div className="rd-gate-body">
              <div className="rd-field">
                <label className="rd-field-label" htmlFor="adminKey">Admin API key</label>
                <input
                  id="adminKey"
                  type="password"
                  className="rd-input"
                  placeholder="••••••••••••"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadStats()}
                  disabled={isLoading}
                  autoComplete="off"
                />
              </div>

              {error && (
                <div className="rd-error">
                  <AlertCircle size={13} style={{ flexShrink: 0 }} />
                  {error}
                </div>
              )}

              <button
                className="rd-submit"
                onClick={loadStats}
                disabled={isLoading || !adminKey}
                type="button"
              >
                {isLoading
                  ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  : <ArrowRight size={14} />
                }
                {isLoading ? 'Loading…' : 'View research data'}
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────
  const { totalParticipants: total, controlParticipants: ctrl, aiAssistedParticipants: ai } = stats;
  const ctrlPct = total > 0 ? Math.round((ctrl / total) * 100) : 0;
  const aiPct = total > 0 ? Math.round((ai / total) * 100) : 0;

  return (
    <>
      <style>{rdStyles}</style>
      <div className="rd-root">

        {/* ── Top bar ── */}
        <header className="rd-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span className="rd-topbar-badge">Admin</span>
            <div className="rd-divider-v" />
            <span className="rd-topbar-sub">Research Data</span>
          </div>
          <button
            className="rd-export-btn"
            onClick={handleExport}
            disabled={isExporting}
            type="button"
          >
            {isExporting
              ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
              : <Download size={13} />
            }
            {isExporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </header>

        <div className="rd-body">

          {/* ── Page header ── */}
          <div className="rd-page-header">
            <p className="rd-eyebrow">Cognitive load study</p>
            <h1 className="rd-title">Research Data Dashboard</h1>
          </div>

          {/* ── Participant summary ── */}
          <section className="rd-section">
            <p className="rd-section-label">Participants</p>
            <div className="rd-stat-row">

              <div className="rd-big-stat">
                <span className="rd-big-val">{total}</span>
                <span className="rd-big-label">Total</span>
              </div>

              <div className="rd-divider-v" style={{ height: 48 }} />

              <div className="rd-big-stat">
                <span className="rd-big-val">{ctrl}</span>
                <span className="rd-big-label">Solo mode</span>
                <span className="rd-big-pct">{ctrlPct}%</span>
              </div>

              <div className="rd-divider-v" style={{ height: 48 }} />

              <div className="rd-big-stat">
                <span className="rd-big-val rd-ai-val">{ai}</span>
                <span className="rd-big-label">AI-Assisted</span>
                <span className="rd-big-pct">{aiPct}%</span>
              </div>

              {/* Mode split bar */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <ModeBar control={ctrl} ai={ai} total={total} />
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--ink)' }} />
                    <span className="rd-legend">Solo {ctrlPct}%</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--accent)' }} />
                    <span className="rd-legend">AI-Assisted {aiPct}%</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="rd-divider-h" />

          {/* ── Two-col metrics ── */}
          <div className="rd-metrics-grid">

            {/* Data collection */}
            <section className="rd-section">
              <p className="rd-section-label">Data collection</p>
              <div className="rd-metric-list">
                {[
                  { label: 'Log entries', value: stats.totalLogEntries.toLocaleString(), raw: null },
                  { label: 'Survey responses', value: stats.totalSurveyResponses.toLocaleString(), raw: null },
                  { label: 'Avg. problems completed', value: `${stats.averageCompletionRate.toFixed(2)} / 5`, raw: null },
                ].map(({ label, value }) => (
                  <div key={label} className="rd-metric-row">
                    <span className="rd-metric-label">{label}</span>
                    <span className="rd-metric-val">{value}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Cognitive load */}
            <section className="rd-section">
              <p className="rd-section-label">Cognitive load metrics <span className="rd-scale-note">(1–7 scale)</span></p>
              <div className="rd-metric-list">
                {[
                  { label: 'Mental demand', value: stats.averageMentalDemand },
                  { label: 'Confidence', value: stats.averageConfidence },
                  { label: 'System helpfulness', value: stats.averageSystemHelpfulness },
                ].map(({ label, value }) => (
                  <div key={label} className="rd-metric-row rd-metric-bar-row">
                    <span className="rd-metric-label">{label}</span>
                    <StatBar value={value} max={7} />
                    <span className="rd-metric-val rd-metric-score">{value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="rd-divider-h" />

          {/* ── Export note ── */}
          <div className="rd-note">
            <p className="rd-note-label">Export includes</p>
            <p className="rd-note-text">
              All step attempt logs (correctness, time spent, AI interactions) · Survey responses ·
              Participant session records · Access code usage — structured for statistical analysis.
            </p>
          </div>

          {error && (
            <div className="rd-error" style={{ marginTop: 0 }}>
              <AlertCircle size={13} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const rdStyles = `
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

  .rd-root {
    min-height: 100vh;
    background: var(--surface);
    font-family: var(--sans);
    color: var(--ink);
  }

  /* ── Auth gate ── */
  .rd-gate {
    width: 100%;
    max-width: 400px;
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 6px;
    overflow: hidden;
    animation: fadeUp 0.3s ease both;
  }
  .rd-gate-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 24px 24px 18px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
  }
  .rd-gate-label {
    font-family: var(--mono);
    font-size: 0.625rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ink-muted);
    margin-bottom: 3px;
  }
  .rd-gate-title {
    font-family: var(--serif);
    font-size: 1.125rem;
    color: var(--ink);
  }
  .rd-gate-body {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  /* ── Top bar ── */
  .rd-topbar {
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
  .rd-topbar-badge {
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
  .rd-divider-v {
    width: 1px;
    background: var(--border);
  }
  .rd-topbar-sub {
    font-family: var(--mono);
    font-size: 0.75rem;
    letter-spacing: 0.06em;
    color: var(--ink-soft);
  }
  .rd-export-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 16px;
    border: 1px solid var(--border);
    border-radius: 3px;
    background: none;
    font-family: var(--mono);
    font-size: 0.75rem;
    letter-spacing: 0.06em;
    color: var(--ink-soft);
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s, background 0.15s;
  }
  .rd-export-btn:hover:not(:disabled) {
    border-color: var(--ink);
    color: var(--ink);
  }
  .rd-export-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* ── Body ── */
  .rd-body {
    max-width: 960px;
    margin: 0 auto;
    padding: 48px 32px 80px;
    display: flex;
    flex-direction: column;
    gap: 36px;
    animation: fadeUp 0.35s ease both;
  }

  /* ── Page header ── */
  .rd-page-header { display: flex; flex-direction: column; gap: 6px; }
  .rd-eyebrow {
    font-family: var(--mono);
    font-size: 0.6875rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ink-muted);
  }
  .rd-title {
    font-family: var(--serif);
    font-size: 1.875rem;
    color: var(--ink);
    line-height: 1.15;
  }

  /* ── Sections ── */
  .rd-section { display: flex; flex-direction: column; gap: 16px; }
  .rd-section-label {
    font-family: var(--mono);
    font-size: 0.6875rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink-muted);
  }
  .rd-scale-note {
    font-size: 0.625rem;
    color: var(--ink-muted);
    letter-spacing: 0.06em;
    text-transform: none;
  }

  /* ── Participant stat row ── */
  .rd-stat-row {
    display: flex;
    align-items: center;
    gap: 32px;
    flex-wrap: wrap;
  }
  .rd-big-stat {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex-shrink: 0;
  }
  .rd-big-val {
    font-family: var(--serif);
    font-size: 2.5rem;
    line-height: 1;
    color: var(--ink);
  }
  .rd-ai-val { color: var(--accent); }
  .rd-big-label {
    font-family: var(--mono);
    font-size: 0.625rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink-muted);
  }
  .rd-big-pct {
    font-family: var(--mono);
    font-size: 0.6875rem;
    color: var(--ink-soft);
  }
  .rd-legend {
    font-family: var(--mono);
    font-size: 0.6875rem;
    color: var(--ink-muted);
    letter-spacing: 0.04em;
  }

  /* ── Metrics ── */
  .rd-metrics-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 48px;
  }
  .rd-metric-list { display: flex; flex-direction: column; }
  .rd-metric-row {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 0;
    border-bottom: 1px solid var(--border);
  }
  .rd-metric-row:last-child { border-bottom: none; }
  .rd-metric-label {
    font-size: 0.875rem;
    color: var(--ink-soft);
    flex: 1;
    min-width: 0;
  }
  .rd-metric-val {
    font-family: var(--mono);
    font-size: 0.875rem;
    color: var(--ink);
    white-space: nowrap;
    flex-shrink: 0;
  }
  .rd-metric-bar-row { gap: 12px; }
  .rd-metric-score { min-width: 48px; text-align: right; }

  /* ── Dividers ── */
  .rd-divider-h { height: 1px; background: var(--border); }

  /* ── Export note ── */
  .rd-note { border-left: 2px solid var(--border); padding: 4px 16px; }
  .rd-note-label {
    font-family: var(--mono);
    font-size: 0.625rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink-muted);
    margin-bottom: 5px;
  }
  .rd-note-text {
    font-size: 0.8125rem;
    color: var(--ink-soft);
    line-height: 1.65;
  }

  /* ── Shared form elements ── */
  .rd-field { display: flex; flex-direction: column; gap: 8px; }
  .rd-field-label {
    font-family: var(--mono);
    font-size: 0.6875rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink-muted);
  }
  .rd-input {
    height: 44px;
    padding: 0 14px;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: var(--surface);
    font-family: var(--mono);
    font-size: 0.9375rem;
    color: var(--ink);
    outline: none;
    width: 100%;
    transition: border-color 0.15s;
  }
  .rd-input:focus { border-color: var(--ink); background: #fff; }
  .rd-input:disabled { opacity: 0.5; cursor: not-allowed; }

  .rd-error {
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

  .rd-submit {
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
  .rd-submit:disabled { opacity: 0.28; cursor: not-allowed; }
  .rd-submit:not(:disabled):hover { opacity: 0.85; }

  @media (max-width: 700px) {
    .rd-metrics-grid { grid-template-columns: 1fr; gap: 32px; }
    .rd-body { padding: 32px 20px 60px; }
    .rd-topbar { padding: 0 20px; }
    .rd-stat-row { gap: 20px; }
    .rd-big-val { font-size: 2rem; }
  }
`;