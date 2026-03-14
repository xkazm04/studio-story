'use client';

import React from 'react';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Minus as HorizontalRule,
  List,
  ListOrdered,
  Film,
  AlignLeft,
  User,
  MessageCircle,
  Parentheses,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { Editor } from '@tiptap/react';

// ── Types ───────────────────────────────────────────────────

interface ScreenplayToolbarProps {
  editor: Editor | null;
  distractionFree?: boolean;
  onToggleDistractionFree?: () => void;
}

// ── Helpers ─────────────────────────────────────────────────

function btnClass(isActive: boolean): string {
  return clsx(
    'p-2 rounded hover:bg-slate-700 transition-colors',
    isActive ? 'bg-slate-700 text-cyan-400' : 'text-slate-400',
  );
}

// ── Component ───────────────────────────────────────────────

export function ScreenplayToolbar({
  editor,
  distractionFree = false,
  onToggleDistractionFree,
}: ScreenplayToolbarProps) {
  if (!editor) return null;

  return (
    <div className="flex items-center gap-1 p-2 border-b border-slate-800 bg-slate-900/50 sticky top-0 z-10">
      {/* ── Prose Section ─────────────────────────────── */}

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={btnClass(editor.isActive('bold'))}
        title="Bold (Ctrl+B)"
      >
        <Bold size={16} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={btnClass(editor.isActive('italic'))}
        title="Italic (Ctrl+I)"
      >
        <Italic size={16} />
      </button>

      <div className="w-px h-6 bg-slate-700 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={btnClass(editor.isActive('heading', { level: 1 }))}
        title="Heading 1"
      >
        <Heading1 size={16} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={btnClass(editor.isActive('heading', { level: 2 }))}
        title="Heading 2"
      >
        <Heading2 size={16} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={btnClass(editor.isActive('heading', { level: 3 }))}
        title="Heading 3"
      >
        <Heading3 size={16} />
      </button>

      <div className="w-px h-6 bg-slate-700 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={btnClass(editor.isActive('blockquote'))}
        title="Blockquote"
      >
        <Quote size={16} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className={btnClass(false)}
        title="Horizontal Rule"
      >
        <HorizontalRule size={16} />
      </button>

      <div className="w-px h-6 bg-slate-700 mx-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={btnClass(editor.isActive('bulletList'))}
        title="Bullet List"
      >
        <List size={16} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={btnClass(editor.isActive('orderedList'))}
        title="Ordered List"
      >
        <ListOrdered size={16} />
      </button>

      {/* ── Divider between prose / screenplay ─────── */}
      <div className="w-px h-6 bg-cyan-700/40 mx-2" />

      {/* ── Screenplay Section ────────────────────────── */}

      <button
        type="button"
        onClick={() => editor.chain().focus().setNode('sceneHeading').run()}
        className={btnClass(editor.isActive('sceneHeading'))}
        title="Scene Heading (Ctrl+Shift+H)"
      >
        <Film size={16} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().setNode('actionLine').run()}
        className={btnClass(editor.isActive('actionLine'))}
        title="Action (Ctrl+Shift+A)"
      >
        <AlignLeft size={16} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().setNode('characterCue').run()}
        className={btnClass(editor.isActive('characterCue'))}
        title="Character Cue (Ctrl+Shift+C)"
      >
        <User size={16} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().setNode('dialogue').run()}
        className={btnClass(editor.isActive('dialogue'))}
        title="Dialogue (Ctrl+Shift+D)"
      >
        <MessageCircle size={16} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().setNode('parenthetical').run()}
        className={btnClass(editor.isActive('parenthetical'))}
        title="Parenthetical (Ctrl+Shift+P)"
      >
        <Parentheses size={16} />
      </button>

      {/* ── Spacer + distraction-free toggle ─────────── */}
      <div className="flex-1" />

      {onToggleDistractionFree && (
        <button
          type="button"
          onClick={onToggleDistractionFree}
          className={btnClass(distractionFree)}
          title="Distraction-free mode (F11)"
        >
          {distractionFree ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      )}
    </div>
  );
}
