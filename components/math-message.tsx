'use client';

import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

/**
 * Converts LaTeX delimiters \( ... \) and \[ ... \] to $ ... $ and $$ ... $$
 * so that remark-math can parse them.
 */
function normalizeLatex(text: string): string {
  // Convert display math \[ ... \] → $$ ... $$
  let result = text.replace(/\\\[([\s\S]*?)\\\]/g, (_match, inner) => `$$${inner}$$`);
  // Convert inline math \( ... \) → $ ... $
  result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_match, inner) => `$${inner}$`);
  return result;
}

export function MathMessage({ content }: { content: string }) {
  const normalized = normalizeLatex(content);

  return (
    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
      {normalized}
    </ReactMarkdown>
  );
}
