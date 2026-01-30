'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore, useEditorStore, useUIStore, type Story, type Chapter, type Character, type Plotline } from '@/lib/store';
import { Sidebar, RightPanel, TopBar } from '@/components/layout';
import { StoryEditor, EditorToolbar, type StoryEditorRef } from '@/components/editor';
import { BranchingChoices, ImageToStory, StoryToImage, TTSPlayer, TTSButton } from '@/components/features';
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
  
  // Feature modal states
  const [showBranching, setShowBranching] = useState(false);
  const [showImageToStory, setShowImageToStory] = useState(false);
  const [showStoryToImage, setShowStoryToImage] = useState(false);
  const [showTTS, setShowTTS] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      setError(null);
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
    } catch (error: any) {
      console.error('Failed to load story:', error);
      
      // Provide specific error messages based on status code
      if (error.response?.status === 404) {
        setError('This story could not be found. It may have been deleted or never existed.');
      } else if (error.response?.status === 403) {
        setError('You do not have permission to access this story.');
      } else if (error.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
        router.push('/auth/login');
      } else {
        setError('Failed to load story. Please try again later.');
      }
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
    if (!currentChapter || !editorRef.current) {
      console.error('Cannot generate: no chapter or editor', { currentChapter, editorRef: editorRef.current });
      return;
    }

    console.log('Starting generation with:', {
      storyId,
      chapterId: currentChapter.id,
      direction,
      writingMode: useEditorStore.getState().writingMode
    });

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
          console.log('Generation complete');
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
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Story Not Found</h2>
          <p className="text-text-secondary mb-6">
            {error || "This story could not be found. It may have been deleted or never existed."}
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
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
        onCharactersExtracted={(newCharacters) => setCharacters(newCharacters)}
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
                  <div className="flex items-center justify-between">
                    <EditorToolbar editor={editorRef.current?.editor ?? null} />
                    
                    {/* Feature Buttons */}
                    <div className="flex items-center gap-1 py-2">
                      {/* Branching Choices */}
                      <button
                        onClick={() => setShowBranching(true)}
                        className="p-2 rounded-lg hover:bg-surface-hover transition-colors text-text-secondary hover:text-accent"
                        title="Generate Story Branches"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </button>
                      
                      {/* Image to Story */}
                      <button
                        onClick={() => setShowImageToStory(true)}
                        className="p-2 rounded-lg hover:bg-surface-hover transition-colors text-text-secondary hover:text-accent"
                        title="Generate Story from Image"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </button>
                      
                      {/* Story to Image */}
                      <button
                        onClick={() => setShowStoryToImage(true)}
                        className="p-2 rounded-lg hover:bg-surface-hover transition-colors text-text-secondary hover:text-accent"
                        title="Generate Image from Story"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                        </svg>
                      </button>
                      
                      {/* TTS Button */}
                      <TTSButton 
                        getText={() => editorRef.current?.getContent() || currentChapter.content || ''}
                        className="text-text-secondary hover:text-accent"
                      />
                    </div>
                  </div>
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
      <RightPanel 
        onGenerate={handleGenerate}
        onBranching={() => setShowBranching(true)}
        onStoryToImage={() => setShowStoryToImage(true)}
        onImageToStory={() => setShowImageToStory(true)}
        onTTS={() => setShowTTS(true)}
      />

      {/* Feature Modals */}
      {showBranching && currentChapter && (
        <BranchingChoices
          storyId={storyId}
          chapterId={currentChapter.id}
          onBranchSelected={(preview) => {
            // Append the selected branch to the editor
            editorRef.current?.appendContent('\n\n' + preview);
            setUnsavedChanges(true);
          }}
          onClose={() => setShowBranching(false)}
        />
      )}

      {showImageToStory && (
        <ImageToStory
          storyId={storyId}
          chapterId={currentChapter?.id}
          onContentGenerated={(content) => {
            editorRef.current?.appendContent('\n\n' + content);
            setUnsavedChanges(true);
          }}
          onClose={() => setShowImageToStory(false)}
        />
      )}

      {showStoryToImage && (
        <StoryToImage
          storyId={storyId}
          content={editorRef.current?.getContent() || ''}
          onClose={() => setShowStoryToImage(false)}
        />
      )}

      {showTTS && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <TTSPlayer 
              text={editorRef.current?.getContent() || ''} 
              onClose={() => setShowTTS(false)} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
