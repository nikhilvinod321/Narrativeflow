'use client';

import { useEditorStore } from '@/lib/store';
import { formatRelativeTime } from '@/lib/utils';
import { Button } from '@/components/ui';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Save, Cloud, CloudOff, ChevronDown, Pencil, Headphones } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface TopBarProps {
  storyTitle?: string;
  genre?: string;
  tone?: string;
  onSave?: () => void;
  onExport?: () => void;
  onAudiobook?: () => void;
  onTitleChange?: (title: string) => void;
}

export function TopBar({ storyTitle, genre, tone, onSave, onExport, onAudiobook, onTitleChange }: TopBarProps) {
  const { isSaving, lastSaved, unsavedChanges } = useEditorStore();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(storyTitle || '');
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitleDraft(storyTitle || '');
  }, [storyTitle]);

  const startEditing = () => {
    setTitleDraft(storyTitle || '');
    setEditingTitle(true);
    setTimeout(() => titleInputRef.current?.select(), 0);
  };

  const commitTitle = () => {
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== storyTitle) {
      onTitleChange?.(trimmed);
    }
    setEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitTitle();
    if (e.key === 'Escape') setEditingTitle(false);
  };

  return (
    <header className="h-14 bg-background-secondary border-b border-surface-border flex items-center justify-between px-4">
      {/* Left - Story Info */}
      <div className="flex items-center gap-4">
        <div>
          {editingTitle ? (
            <input
              ref={titleInputRef}
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={handleTitleKeyDown}
              className="font-semibold text-text-primary bg-transparent border-b border-accent outline-none w-64"
              maxLength={120}
              autoFocus
            />
          ) : (
            <button
              onClick={startEditing}
              className="group flex items-center gap-1.5 font-semibold text-text-primary hover:text-accent transition-colors"
              title="Click to rename story"
            >
              <span>{storyTitle || 'Untitled Story'}</span>
              <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
            </button>
          )}
          <div className="flex items-center gap-2 text-xs text-text-tertiary">
            {genre && (
              <span className="capitalize">{genre.replace('_', ' ')}</span>
            )}
            {genre && tone && <span>•</span>}
            {tone && (
              <span className="capitalize">{tone}</span>
            )}
          </div>
        </div>
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-3">
        <ThemeToggle />

        {/* Save Status */}
        <div className="flex items-center gap-2 text-sm text-text-tertiary">
          {isSaving ? (
            <>
              <Cloud className="w-4 h-4 animate-pulse text-accent" />
              <span>Saving...</span>
            </>
          ) : unsavedChanges ? (
            <>
              <CloudOff className="w-4 h-4 text-warning" />
              <span>Unsaved changes</span>
            </>
          ) : lastSaved ? (
            <>
              <Cloud className="w-4 h-4 text-success" />
              <span>Saved {formatRelativeTime(lastSaved)}</span>
            </>
          ) : null}
        </div>

        {/* Save Button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={onSave}
          disabled={isSaving || !unsavedChanges}
        >
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>

        {/* Export */}
        <Button variant="ghost" size="sm" onClick={onExport}>
          Export
          <ChevronDown className="w-4 h-4 ml-1" />
        </Button>

        {/* Audiobook */}
        <Button variant="ghost" size="sm" onClick={onAudiobook} title="Download Audiobook">
          <Headphones className="w-4 h-4 mr-1.5" />
          Audiobook
        </Button>
      </div>
    </header>
  );
}
