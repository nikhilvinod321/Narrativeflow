'use client';

import { Button } from '@/components/ui';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Minus,
  Undo2,
  Redo2,
  Highlighter,
  LucideIcon,
} from 'lucide-react';
import { Editor } from '@tiptap/react';
import { cn } from '@/lib/utils';

interface EditorToolbarProps {
  editor: Editor | null;
  className?: string;
}

type ToolItem = 
  | { type: 'divider' }
  | { icon: LucideIcon; action: () => void; isActive: boolean; tooltip: string; disabled?: boolean };

export function EditorToolbar({ editor, className }: EditorToolbarProps) {
  if (!editor) return null;

  const tools: ToolItem[] = [
    {
      icon: Bold,
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive('bold'),
      tooltip: 'Bold',
    },
    {
      icon: Italic,
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive('italic'),
      tooltip: 'Italic',
    },
    {
      icon: Strikethrough,
      action: () => editor.chain().focus().toggleStrike().run(),
      isActive: editor.isActive('strike'),
      tooltip: 'Strikethrough',
    },
    { type: 'divider' },
    {
      icon: Heading1,
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: editor.isActive('heading', { level: 1 }),
      tooltip: 'Heading 1',
    },
    {
      icon: Heading2,
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: editor.isActive('heading', { level: 2 }),
      tooltip: 'Heading 2',
    },
    {
      icon: Heading3,
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: editor.isActive('heading', { level: 3 }),
      tooltip: 'Heading 3',
    },
    { type: 'divider' },
    {
      icon: Quote,
      action: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: editor.isActive('blockquote'),
      tooltip: 'Quote',
    },
    {
      icon: List,
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive('bulletList'),
      tooltip: 'Bullet List',
    },
    {
      icon: ListOrdered,
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive('orderedList'),
      tooltip: 'Numbered List',
    },
    {
      icon: Minus,
      action: () => editor.chain().focus().setHorizontalRule().run(),
      isActive: false,
      tooltip: 'Divider',
    },
    { type: 'divider' },
    {
      icon: Highlighter,
      action: () => editor.chain().focus().toggleHighlight().run(),
      isActive: editor.isActive('highlight'),
      tooltip: 'Highlight',
    },
    { type: 'divider' },
    {
      icon: Undo2,
      action: () => editor.chain().focus().undo().run(),
      isActive: false,
      disabled: !editor.can().undo(),
      tooltip: 'Undo',
    },
    {
      icon: Redo2,
      action: () => editor.chain().focus().redo().run(),
      isActive: false,
      disabled: !editor.can().redo(),
      tooltip: 'Redo',
    },
  ];

  return (
    <div
      className={cn(
        'flex items-center gap-1 p-2 bg-surface border-b border-surface-border',
        className
      )}
    >
      {tools.map((tool, index) => {
        if ('type' in tool) {
          return <div key={index} className="w-px h-6 bg-surface-border mx-1" />;
        }
        
        const Icon = tool.icon;
        return (
          <Button
            key={index}
            variant="ghost"
            size="icon"
            className={cn(
              'h-8 w-8',
              tool.isActive && 'bg-accent/20 text-accent'
            )}
            onClick={tool.action}
            disabled={tool.disabled}
            title={tool.tooltip}
          >
            <Icon className="w-4 h-4" />
          </Button>
        );
      })}
    </div>
  );
}
