'use client';

/**
 * Access Code Input Component — Revamped UI
 * Stripped of Card wrapper — designed to sit inside the access-panel body
 */

import { useState } from 'react';
import { Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';

interface AccessCodeInputProps {
  onSuccess: (uid: string) => void;
}

export function AccessCodeInput({ onSuccess }: AccessCodeInputProps) {
  const { login } = useAuth();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/verify-access-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Invalid access code');
      }
      const { uid } = await response.json();
      login(uid);
      onSuccess(uid);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const filled = code.length;
  const total = 12;

  return (
    <>
      <style>{`
        .aci-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
          font-family: var(--sans, 'DM Sans', system-ui, sans-serif);
        }

        /* ── Label row ── */
        .aci-label-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
        }
        .aci-label {
          font-family: var(--mono, 'DM Mono', monospace);
          font-size: 0.6875rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--ink-muted, #a8a29e);
        }
        .aci-counter {
          font-family: var(--mono, monospace);
          font-size: 0.6875rem;
          color: var(--ink-muted, #a8a29e);
          letter-spacing: 0.06em;
          transition: color 0.2s;
        }
        .aci-counter.complete {
          color: #4a7c59;
        }

        /* ── Input ── */
        .aci-input {
          width: 100%;
          height: 52px;
          padding: 0 16px;
          border: 1px solid var(--border, #e5dfd8);
          border-radius: 4px;
          background: var(--surface, #faf9f7);
          font-family: var(--mono, monospace);
          font-size: 1.25rem;
          letter-spacing: 0.22em;
          color: var(--ink, #1a1814);
          outline: none;
          transition: border-color 0.15s, background 0.15s;
          text-transform: uppercase;
        }
        .aci-input::placeholder {
          color: var(--ink-muted, #a8a29e);
          letter-spacing: 0.1em;
          font-size: 0.9375rem;
        }
        .aci-input:focus {
          border-color: var(--ink, #1a1814);
          background: #fff;
        }
        .aci-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .aci-input.error {
          border-color: #b94a3a;
          background: #fdf4f3;
        }

        /* Progress track */
        .aci-track {
          height: 2px;
          background: var(--border, #e5dfd8);
          border-radius: 99px;
          overflow: hidden;
          margin-top: -12px;
        }
        .aci-track-fill {
          height: 100%;
          border-radius: 99px;
          background: var(--ink, #1a1814);
          transition: width 0.15s ease, background 0.2s;
        }
        .aci-track-fill.complete {
          background: #4a7c59;
        }

        /* ── Error ── */
        .aci-error {
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
          animation: errIn 0.2s ease both;
        }
        @keyframes errIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .aci-error-icon { flex-shrink: 0; margin-top: 1px; }

        /* ── Submit ── */
        .aci-submit {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          height: 46px;
          border: none;
          border-radius: 4px;
          background: var(--ink, #1a1814);
          color: #fff;
          font-family: var(--sans, system-ui, sans-serif);
          font-size: 0.9375rem;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .aci-submit:disabled {
          opacity: 0.28;
          cursor: not-allowed;
        }
        .aci-submit:not(:disabled):hover { opacity: 0.85; }

        .aci-hint {
          font-family: var(--mono, monospace);
          font-size: 0.6875rem;
          color: var(--ink-muted, #a8a29e);
          letter-spacing: 0.04em;
          text-align: center;
        }
      `}</style>

      <form className="aci-form" onSubmit={handleSubmit}>

        {/* Label + counter */}
        <div>
          <div className="aci-label-row" style={{ marginBottom: 8 }}>
            <label className="aci-label" htmlFor="access-code">Access code</label>
            <span className={`aci-counter${filled === total ? ' complete' : ''}`}>
              {filled} / {total}
            </span>
          </div>

          {/* Input */}
          <input
            id="access-code"
            className={`aci-input${error ? ' error' : ''}`}
            placeholder="XXXXXXXXXXXX"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
              if (error) setError(null);
            }}
            disabled={isLoading}
            maxLength={12}
            autoComplete="off"
            spellCheck={false}
          />

          {/* Fill progress */}
          <div className="aci-track" style={{ marginTop: 8 }}>
            <div
              className={`aci-track-fill${filled === total ? ' complete' : ''}`}
              style={{ width: `${(filled / total) * 100}%` }}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="aci-error">
            <AlertCircle size={13} className="aci-error-icon" />
            {error}
          </div>
        )}

        {/* Submit */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            type="submit"
            className="aci-submit"
            disabled={code.length < total || isLoading}
          >
            {isLoading
              ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
              : <ArrowRight size={15} />
            }
            {isLoading ? 'Verifying…' : 'Begin study'}
          </button>
          <p className="aci-hint">12-character alphanumeric code</p>
        </div>
      </form>
    </>
  );
}