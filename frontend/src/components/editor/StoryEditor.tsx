'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Typography from '@tiptap/extension-typography';
import Highlight from '@tiptap/extension-highlight';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/lib/store';
import { useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';

interface StoryEditorProps {
  content?: string;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
  onUpdate?: (content: string) => void;
  onSelectionChange?: (selection: { from: number; to: number; text: string } | null) => void;
}

export interface StoryEditorRef {
  editor: Editor | null;
  getContent: () => string;
  setContent: (content: string) => void;
  appendContent: (content: string) => void;
  focus: () => void;
}

export const StoryEditor = forwardRef<StoryEditorRef, StoryEditorProps>(
  function StoryEditor(
    { content = '', placeholder = 'Start writing your story...', className, readOnly = false, onUpdate, onSelectionChange },
    ref
  ) {
    const { setWordCount, setUnsavedChanges, setSelectedText } = useEditorStore();

    const editor = useEditor({
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3],
          },
        }),
        Placeholder.configure({
          placeholder,
          emptyEditorClass: 'is-editor-empty',
        }),
        CharacterCount,
        Typography,
        Highlight.configure({
          multicolor: true,
        }),
      ],
      content,
      editable: !readOnly,
      editorProps: {
        attributes: {
          class: cn(
            'prose prose-invert prose-lg max-w-none min-h-[calc(100vh-200px)]',
            'focus:outline-none',
            'prose-p:text-text-primary prose-p:leading-relaxed prose-p:my-4',
            'prose-headings:text-text-primary prose-headings:font-display',
            'prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl',
            'prose-strong:text-text-primary prose-em:text-text-secondary',
            'prose-blockquote:border-accent prose-blockquote:text-text-secondary',
            'prose-code:text-accent prose-code:bg-surface prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded',
            className
          ),
        },
      },
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        const wordCount = editor.storage.characterCount.words();
        
        setWordCount(wordCount);
        setUnsavedChanges(true);
        onUpdate?.(html);
      },
      onSelectionUpdate: ({ editor }) => {
        const { from, to } = editor.state.selection;
        if (from !== to) {
          const text = editor.state.doc.textBetween(from, to, ' ');
          setSelectedText(text);
          onSelectionChange?.({ from, to, text });
        } else {
          setSelectedText(null);
          onSelectionChange?.(null);
        }
      },
    });

    useImperativeHandle(ref, () => ({
      editor,
      getContent: () => editor?.getHTML() || '',
      setContent: (newContent: string) => {
        editor?.commands.setContent(newContent);
      },
      appendContent: (newContent: string) => {
        editor?.commands.insertContentAt(editor.state.doc.content.size, newContent);
      },
      focus: () => {
        editor?.commands.focus('end');
      },
    }));

    // Update content when prop changes
    useEffect(() => {
      if (editor && content !== editor.getHTML()) {
        editor.commands.setContent(content);
      }
    }, [content, editor]);

    return (
      <div className="story-editor">
        <EditorContent editor={editor} />
        
        {/* Word Count Footer */}
        {editor && (
          <div className="sticky bottom-0 left-0 right-0 py-2 px-4 bg-gradient-to-t from-background to-transparent">
            <div className="flex items-center justify-end gap-4 text-xs text-text-tertiary">
              <span>{editor.storage.characterCount.words().toLocaleString()} words</span>
              <span>{editor.storage.characterCount.characters().toLocaleString()} characters</span>
            </div>
          </div>
        )}
      </div>
    );
  }
);
