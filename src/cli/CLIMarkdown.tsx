'use client';

import React from 'react';

/**
 * CLIMarkdown — Lightweight markdown renderer for CLI terminal output.
 *
 * Handles common markdown patterns without external dependencies:
 * headings, bold, italic, inline code, horizontal rules, lists.
 */

/** Apply inline formatting: bold, italic, code */
function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Match: `code`, **bold**, *italic*
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('`')) {
      parts.push(
        <code key={match.index} className="bg-slate-800 text-amber-300 px-1 rounded text-[10px]">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**')) {
      parts.push(
        <strong key={match.index} className="text-slate-100 font-semibold">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*')) {
      parts.push(
        <em key={match.index} className="text-slate-300 italic">
          {token.slice(1, -1)}
        </em>
      );
    }

    lastIndex = match.index + token.length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

export default function CLIMarkdown({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Horizontal rule
    if (/^-{3,}$/.test(trimmed) || /^\*{3,}$/.test(trimmed)) {
      elements.push(
        <hr key={i} className="border-slate-700/50 my-1" />
      );
      continue;
    }

    // Headings
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      const sizeClass = level === 1 ? 'text-sm' : level === 2 ? 'text-xs' : 'text-[11px]';
      elements.push(
        <div key={i} className={`${sizeClass} font-bold text-slate-100 mt-1.5 mb-0.5`}>
          {renderInline(text)}
        </div>
      );
      continue;
    }

    // List items
    const listMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (listMatch) {
      elements.push(
        <div key={i} className="flex gap-1.5 pl-2">
          <span className="text-slate-500 shrink-0">&#8226;</span>
          <span>{renderInline(listMatch[1])}</span>
        </div>
      );
      continue;
    }

    // Numbered list
    const numListMatch = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
    if (numListMatch) {
      elements.push(
        <div key={i} className="flex gap-1.5 pl-2">
          <span className="text-slate-500 shrink-0">{numListMatch[1]}.</span>
          <span>{renderInline(numListMatch[2])}</span>
        </div>
      );
      continue;
    }

    // Empty line → small spacer
    if (trimmed === '') {
      elements.push(<div key={i} className="h-1" />);
      continue;
    }

    // Regular text with inline formatting
    elements.push(
      <div key={i}>{renderInline(line)}</div>
    );
  }

  return <div className="space-y-0.5">{elements}</div>;
}
