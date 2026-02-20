'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUIStore, useEditorStore, type Chapter, type Character, type Plotline } from '@/lib/store';
import { api } from '@/lib/api';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileText,
  Users,
  GitBranch,
  Book,
  Plus,
  Settings,
  Home,
  Sparkles,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { formatWordCount } from '@/lib/utils';

interface SidebarProps {
  chapters?: Chapter[];
  characters?: Character[];
  plotlines?: Plotline[];
  storyId?: string;
  onChapterCreated?: (chapter: Chapter) => void;
  onCharactersExtracted?: (characters: Character[]) => void;
}

export function Sidebar({ chapters = [], characters = [], plotlines = [], storyId, onChapterCreated, onCharactersExtracted }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { currentChapter, setCurrentChapter } = useEditorStore();
  const [extracting, setExtracting] = useState(false);

  const handleChapterClick = (chapter: Chapter) => {
    setCurrentChapter(chapter);
    // Navigate to story editor if not already there
    if (storyId && !pathname.endsWith(`/stories/${storyId}`)) {
      router.push(`/stories/${storyId}`);
    }
  };

  const handleExtractCharacters = async () => {
    if (!storyId || extracting) return;
    try {
      setExtracting(true);
      const result = await api.extractCharactersFromStory(storyId);
      if (result.created && result.created.length > 0) {
        alert(`✨ Extracted ${result.created.length} characters from your story!\n\nCharacters found: ${result.created.map((c: any) => c.name).join(', ')}`);
        // Refresh the characters list
        const updatedCharacters = await api.getCharacters(storyId);
        onCharactersExtracted?.(updatedCharacters);
      } else {
        alert('No new characters found. Make sure your story has named characters, or they may already be in your character list.');
      }
    } catch (error: any) {
      console.error('Failed to extract characters:', error);
      const message = error?.response?.data?.detail || 'Failed to extract characters. Make sure you have some story content first.';
      alert(message);
    } finally {
      setExtracting(false);
    }
  };

  const handleCreateChapter = async () => {
    if (!storyId) return;
    try {
      const newChapter = await api.createChapter(storyId, {
        title: `Chapter ${chapters.length + 1}`,
        content: '',
      });
      setCurrentChapter(newChapter);
      onChapterCreated?.(newChapter);
      // Navigate to story editor
      router.push(`/stories/${storyId}`);
    } catch (error) {
      console.error('Failed to create chapter:', error);
    }
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full bg-background-secondary border-r border-surface-border z-40',
          'transition-all duration-300 ease-in-out',
          sidebarOpen ? 'w-sidebar' : 'w-0 -translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-surface-border">
            <Link href="/dashboard" className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-accent" />
              <span className="font-bold text-gradient">NarrativeFlow</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-6">
            {/* Quick Links */}
            <div>
              <Link
                href="/dashboard"
                className={cn(
                  'nav-item',
                  pathname === '/dashboard' && 'nav-item-active'
                )}
              >
                <Home className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              
            </div>

            {/* Chapters */}
            {storyId && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                    Chapters
                  </span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={handleCreateChapter}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                <div className="space-y-1">
                  {chapters.map((chapter) => (
                    <button
                      key={chapter.id}
                      onClick={() => handleChapterClick(chapter)}
                      className={cn(
                        'nav-item w-full text-left',
                        currentChapter?.id === chapter.id && 'nav-item-active'
                      )}
                    >
                      <FileText className="w-4 h-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm">
                          Ch. {chapter.number}: {chapter.title}
                        </div>
                        <div className="text-xs text-text-tertiary">
                          {formatWordCount(chapter.word_count)} words
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Characters */}
            {storyId && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                    Characters
                  </span>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={handleExtractCharacters}
                      disabled={extracting || chapters.length === 0}
                      title="Extract characters from story"
                    >
                      {extracting ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                    </Button>
                    <Link href={`/stories/${storyId}/characters/new`}>
                      <Button variant="ghost" size="icon" className="h-6 w-6" title="Add character manually">
                        <Plus className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="space-y-1">
                  {characters.length === 0 ? (
                    <button
                      onClick={handleExtractCharacters}
                      disabled={extracting || chapters.length === 0}
                      className="nav-item text-text-tertiary w-full text-left"
                    >
                      {extracting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      <span className="text-sm">
                        {chapters.length === 0 
                          ? 'Write story first...' 
                          : extracting 
                            ? 'Extracting...' 
                            : 'Extract from story...'}
                      </span>
                    </button>
                  ) : (
                    characters.slice(0, 8).map((character) => (
                      <Link
                        key={character.id}
                        href={`/stories/${storyId}/characters/${character.id}`}
                        className="nav-item"
                      >
                        <Users className="w-4 h-4" />
                        <div className="flex-1 min-w-0">
                          <div className="truncate text-sm">{character.name}</div>
                          <div className="text-xs text-text-tertiary capitalize">
                            {character.role.replace('_', ' ')}
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Plotlines */}
            {storyId && plotlines.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                    Plotlines
                  </span>
                  <Link href={`/stories/${storyId}/plotlines/new`}>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Plus className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
                <div className="space-y-1">
                  {plotlines.slice(0, 5).map((plotline) => (
                    <Link
                      key={plotline.id}
                      href={`/stories/${storyId}/plotlines/${plotline.id}`}
                      className="nav-item"
                    >
                      <GitBranch className="w-4 h-4" />
                      <div className="flex-1 min-w-0">
                        <div className="truncate text-sm">{plotline.title}</div>
                        <div className="text-xs text-text-tertiary capitalize">
                          {plotline.status}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Narrative Codex */}
            {storyId && (
              <div>
                <Link
                  href={`/stories/${storyId}/bible`}
                  className={cn(
                    'nav-item',
                    pathname.includes('/bible') && 'nav-item-active'
                  )}
                >
                  <Book className="w-4 h-4" />
                  <span>Narrative Codex</span>
                </Link>
              </div>
            )}

            {/* Image Gallery */}
            {storyId && (
              <div>
                <Link
                  href={`/stories/${storyId}/gallery`}
                  className={cn(
                    'nav-item',
                    pathname.includes('/gallery') && 'nav-item-active'
                  )}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Image Gallery</span>
                </Link>
              </div>
            )}
          </nav>

          {/* Footer */}
          <div className="p-3 border-t border-surface-border">
            <Link href="/settings" className="nav-item">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className={cn(
          'fixed top-1/2 -translate-y-1/2 z-50 p-2 bg-surface border border-surface-border rounded-r-lg',
          'hover:bg-surface-hover transition-all duration-300',
          sidebarOpen ? 'left-sidebar' : 'left-0'
        )}
      >
        {sidebarOpen ? (
          <ChevronLeft className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>
    </>
  );
}
