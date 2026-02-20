'use client';

import React from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, Heading, List, ListOrdered } from 'lucide-react';
import { clsx } from 'clsx';
import ColoredBorder from './ColoredBorder';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  borderColor?: 'blue' | 'green' | 'purple' | 'yellow' | 'pink' | 'orange' | 'gray';
}

interface MenuBarProps {
  editor: Editor | null;
}

const MenuBar: React.FC<MenuBarProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const buttonClass = (isActive: boolean) =>
    clsx(
      'p-2 rounded hover:bg-gray-700 transition-colors',
      isActive ? 'bg-gray-700 text-cyan-400' : 'text-gray-400'
    );

  return (
    <div className="flex items-center gap-1 p-2 border-b border-gray-800 bg-gray-900/50">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={buttonClass(editor.isActive('bold'))}
        title="Bold (Ctrl+B)"
        type="button"
      >
        <Bold size={16} />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={buttonClass(editor.isActive('italic'))}
        title="Italic (Ctrl+I)"
        type="button"
      >
        <Italic size={16} />
      </button>

      <div className="w-px h-6 bg-gray-700 mx-1" />

      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={buttonClass(editor.isActive('heading', { level: 2 }))}
        title="Heading"
        type="button"
      >
        <Heading size={16} />
      </button>

      <div className="w-px h-6 bg-gray-700 mx-1" />

      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={buttonClass(editor.isActive('bulletList'))}
        title="Bullet List"
        type="button"
      >
        <List size={16} />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={buttonClass(editor.isActive('orderedList'))}
        title="Numbered List"
        type="button"
      >
        <ListOrdered size={16} />
      </button>
    </div>
  );
};

/**
 * Rich Text Editor Component
 *
 * A lightweight, customizable rich text editor built on Tiptap.
 * Supports basic formatting: bold, italic, headings, and lists.
 *
 * @example
 * ```tsx
 * <RichTextEditor
 *   content={content}
 *   onChange={(html) => setContent(html)}
 *   placeholder="Start writing..."
 *   borderColor="blue"
 * />
 * ```
 */
export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = 'Start typing...',
  className,
  minHeight = '200px',
  borderColor = 'blue',
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
    ],
    content,
    immediatelyRender: false, // Fix SSR hydration mismatch
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none p-4',
      },
    },
  });

  // Update editor content when prop changes (for external updates)
  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div className={clsx('relative bg-gray-900 rounded-lg border border-gray-800 overflow-hidden', className)}>
      <ColoredBorder color={borderColor} />

      <MenuBar editor={editor} />

      <div
        className={clsx('rich-text-content overflow-y-auto', `min-h-[${minHeight}]`)}
        style={{ minHeight }}
      >
        <EditorContent editor={editor} placeholder={placeholder} />
      </div>

      <style jsx global>{`
        .rich-text-content .ProseMirror {
          min-height: inherit;
        }

        .rich-text-content .ProseMirror:focus {
          outline: none;
        }

        .rich-text-content .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: rgb(107, 114, 128);
          pointer-events: none;
          height: 0;
        }

        /* Heading styles */
        .rich-text-content h2 {
          font-size: 1.25rem;
          font-weight: 600;
          color: white;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }

        .rich-text-content h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: white;
          margin-top: 0.75rem;
          margin-bottom: 0.5rem;
        }

        /* Paragraph styles */
        .rich-text-content p {
          color: rgb(209, 213, 219);
          margin-bottom: 0.75rem;
          line-height: 1.6;
        }

        /* Bold and Italic */
        .rich-text-content strong {
          font-weight: 700;
          color: white;
        }

        .rich-text-content em {
          font-style: italic;
          color: rgb(229, 231, 235);
        }

        /* List styles */
        .rich-text-content ul,
        .rich-text-content ol {
          padding-left: 1.5rem;
          margin-bottom: 0.75rem;
          color: rgb(209, 213, 219);
        }

        .rich-text-content ul {
          list-style-type: disc;
        }

        .rich-text-content ol {
          list-style-type: decimal;
        }

        .rich-text-content li {
          margin-bottom: 0.25rem;
          line-height: 1.6;
        }

        .rich-text-content li p {
          margin-bottom: 0;
        }

        /* Remove default prose margins on first/last elements */
        .rich-text-content > :first-child {
          margin-top: 0;
        }

        .rich-text-content > :last-child {
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
};

