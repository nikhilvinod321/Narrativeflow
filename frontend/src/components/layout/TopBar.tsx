'use client';

import { useEditorStore } from '@/lib/store';
import { formatRelativeTime } from '@/lib/utils';
import { Button } from '@/components/ui';
import { Save, Cloud, CloudOff, ChevronDown } from 'lucide-react';

interface TopBarProps {
  storyTitle?: string;
  genre?: string;
  tone?: string;
  onSave?: () => void;
  onExport?: () => void;
}

export function TopBar({ storyTitle, genre, tone, onSave, onExport }: TopBarProps) {
  const { isSaving, lastSaved, unsavedChanges } = useEditorStore();

  return (
    <header className="h-14 bg-background-secondary border-b border-surface-border flex items-center justify-between px-4">
      {/* Left - Story Info */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="font-semibold text-text-primary">{storyTitle || 'Untitled Story'}</h1>
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
      </div>
    </header>
  );
}
