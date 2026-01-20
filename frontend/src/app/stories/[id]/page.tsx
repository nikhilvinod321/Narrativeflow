'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore, useEditorStore, useUIStore, type Story, type Chapter, type Character, type Plotline } from '@/lib/store';
import { Sidebar, RightPanel, TopBar } from '@/components/layout';
import { StoryEditor, EditorToolbar, type StoryEditorRef } from '@/components/editor';
import { cn } from '@/lib/utils';

export default function StoryEditorPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;

  const { isAuthenticated } = useAuthStore();
  const { sidebarOpen, rightPanelOpen } = useUIStore();
  const {
    currentChapter,
    setCurrentChapter,
    setIsSaving,
    setLastSaved,
    setUnsavedChanges,
    unsavedChanges,
  } = useEditorStore();

  const [story, setStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [plotlines, setPlotlines] = useState<Plotline[]>([]);
  const [loading, setLoading] = useState(true);
  const editorRef = useRef<StoryEditorRef>(null);

  // Load story data
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    loadStoryData();
  }, [storyId, isAuthenticated]);

  const loadStoryData = async () => {
    try {
      setLoading(true);
      const [storyData, chaptersData, charactersData, plotlinesData] = await Promise.all([
        api.getStory(storyId),
        api.getChapters(storyId),
        api.getCharacters(storyId),
        api.getPlotlines(storyId),
      ]);

      setStory(storyData);
      setChapters(chaptersData);
      setCharacters(charactersData);
      setPlotlines(plotlinesData);

      // Set first chapter as current if available
      if (chaptersData.length > 0) {
        setCurrentChapter(chaptersData[0]);
      }
    } catch (error) {
      console.error('Failed to load story:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save chapter content
  const handleSave = useCallback(async () => {
    if (!currentChapter || !editorRef.current) return;

    try {
      setIsSaving(true);
      const content = editorRef.current.getContent();
      await api.updateChapter(currentChapter.id, { content });
      setLastSaved(new Date());
      setUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  }, [currentChapter, storyId]);

  // Auto-save on Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  // Create new chapter
  const handleCreateChapter = async () => {
    try {
      const newChapter = await api.createChapter(storyId, {
        title: `Chapter ${chapters.length + 1}`,
        number: chapters.length + 1,
        content: '',
      });
      setChapters([...chapters, newChapter]);
      setCurrentChapter(newChapter);
    } catch (error) {
      console.error('Failed to create chapter:', error);
    }
  };

  // AI Generation with Streaming
  const handleGenerate = async (direction?: string) => {
    if (!currentChapter || !editorRef.current) return;

    try {
      useEditorStore.getState().setIsGenerating(true);
      
      // Add a new paragraph before generated content
      editorRef.current.editor?.commands.insertContent('<p></p>');
      
      // Use streaming generation
      await api.generateContinuationStream(
        {
          story_id: storyId,
          chapter_id: currentChapter.id,
          user_direction: direction || 'Continue the story naturally',
          writing_mode: useEditorStore.getState().writingMode,
          word_target: 500,
        },
        // onChunk - process and insert each chunk
        (text: string) => {
          // Strip any HTML tags the AI might have generated (like <p>, </p>, <br>)
          // Since Tiptap handles formatting, we just need the plain text
          const cleanText = text
            .replace(/<\/?p>/gi, '')
            .replace(/<br\s*\/?>/gi, '\n');
          
          if (cleanText) {
            editorRef.current?.editor?.commands.insertContent(cleanText);
          }
        },
        // onComplete
        () => {
          setUnsavedChanges(true);
          useEditorStore.getState().setIsGenerating(false);
          // Auto-save after generation completes
          handleSave();
        },
        // onError
        (error: string) => {
          console.error('Generation error:', error);
          useEditorStore.getState().setIsGenerating(false);
        }
      );
    } catch (error) {
      console.error('Failed to generate:', error);
      useEditorStore.getState().setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-text-secondary">Story not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        storyId={storyId}
        chapters={chapters}
        characters={characters}
        plotlines={plotlines}
        onChapterCreated={(chapter) => setChapters([...chapters, chapter])}
      />

      {/* Main Content */}
      <div
        className={cn(
          'transition-all duration-300',
          sidebarOpen ? 'ml-sidebar' : 'ml-0',
          rightPanelOpen ? 'mr-panel' : 'mr-0'
        )}
      >
        {/* Top Bar */}
        <TopBar
          storyTitle={story.title}
          genre={story.genre}
          tone={story.tone}
          onSave={handleSave}
        />

        {/* Editor Area */}
        <main className="relative">
          {currentChapter ? (
            <div className="max-w-4xl mx-auto">
              {/* Chapter Title */}
              <div className="px-8 pt-8 pb-4">
                <h2 className="text-2xl font-display font-bold text-text-primary">
                  Chapter {currentChapter.number}: {currentChapter.title}
                </h2>
              </div>

              {/* Toolbar */}
              <div className="sticky top-14 z-30 bg-background border-b border-surface-border">
                <div className="max-w-4xl mx-auto px-8">
                  <EditorToolbar editor={editorRef.current?.editor ?? null} />
                </div>
              </div>

              {/* Editor */}
              <div className="px-8 py-6">
                <StoryEditor
                  ref={editorRef}
                  content={currentChapter.content || ''}
                  placeholder={`Start writing Chapter ${currentChapter.number}...`}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-text-secondary mb-4">No chapters yet</p>
              <button
                onClick={handleCreateChapter}
                className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
              >
                Create First Chapter
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Right Panel */}
      <RightPanel onGenerate={handleGenerate} />
    </div>
  );
}
