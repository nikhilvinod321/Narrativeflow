'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore, useEditorStore, useUIStore, type Story, type Chapter, type Character, type Plotline } from '@/lib/store';
import { Sidebar, RightPanel, TopBar } from '@/components/layout';
import { StoryEditor, EditorToolbar, type StoryEditorRef } from '@/components/editor';
import { BookReader } from '@/components/reader';
import { BranchingChoices, ImageToStory, StoryToImage, TTSPlayer, TTSButton } from '@/components/features';
import { cn } from '@/lib/utils';
import { Eye, Edit, Printer, Pencil } from 'lucide-react';

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
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAudiobookModal, setShowAudiobookModal] = useState(false);
  const [showBookReader, setShowBookReader] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportingAudiobook, setExportingAudiobook] = useState(false);
  const [downloadingChapterId, setDownloadingChapterId] = useState<string | null>(null);
  const [audiobookVoice, setAudiobookVoice] = useState<'neutral' | 'male' | 'female'>('neutral');
  const [audiobookFormat, setAudiobookFormat] = useState<'wav' | 'mp3'>('mp3');
  const [recapResult, setRecapResult] = useState<string | null>(null);
  const [grammarResult, setGrammarResult] = useState<any | null>(null);
  const editorRef = useRef<StoryEditorRef>(null);

  // Inline title editing
  const [editingChapterTitle, setEditingChapterTitle] = useState(false);
  const [chapterTitleDraft, setChapterTitleDraft] = useState('');
  const chapterTitleInputRef = useRef<HTMLInputElement>(null);

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

  // Rename story
  const handleStoryTitleChange = async (newTitle: string) => {
    if (!story || !newTitle.trim()) return;
    try {
      await api.updateStory(storyId, { title: newTitle.trim() });
      setStory({ ...story, title: newTitle.trim() });
    } catch (error) {
      console.error('Failed to rename story:', error);
    }
  };

  // Rename chapter
  const handleChapterTitleChange = async (newTitle: string) => {
    if (!currentChapter || !newTitle.trim()) return;
    try {
      const updated = await api.updateChapter(currentChapter.id, { title: newTitle.trim() });
      const updatedChapter = { ...currentChapter, title: newTitle.trim() };
      setCurrentChapter(updatedChapter);
      setChapters(chapters.map(ch => ch.id === currentChapter.id ? updatedChapter : ch));
    } catch (error) {
      console.error('Failed to rename chapter:', error);
    }
  };

  const startEditingChapterTitle = () => {
    setChapterTitleDraft(currentChapter?.title || '');
    setEditingChapterTitle(true);
    setTimeout(() => chapterTitleInputRef.current?.select(), 0);
  };

  const commitChapterTitle = () => {
    const trimmed = chapterTitleDraft.trim();
    if (trimmed && trimmed !== currentChapter?.title) {
      handleChapterTitleChange(trimmed);
    }
    setEditingChapterTitle(false);
  };

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

  const handlePrint = () => {
    if (!currentChapter) return;
    const rawContent = editorRef.current?.getContent() || currentChapter.content || '';
    if (!rawContent) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const normalizedContent = rawContent
      .replace(/http:\/\/local host/gi, 'http://localhost')
      .replace(/src="\/static\//gi, `src="${apiUrl}/static/`)
      .replace(/src="static\//gi, `src="${apiUrl}/static/`);

    const chapterTitle = `Chapter ${currentChapter.number}: ${currentChapter.title}`;
    const storyTitle = story?.title || 'NarrativeFlow';

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      return;
    }

    doc.open();
    doc.write(`<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${storyTitle} - ${chapterTitle}</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 48px; font-family: Georgia, "Times New Roman", serif; color: #111; }
            h1 { font-size: 24px; margin: 0 0 8px; }
            h2 { font-size: 16px; font-weight: normal; margin: 0 0 24px; color: #444; }
            p { line-height: 1.6; margin: 0 0 14px; }
            img { max-width: 100%; height: auto; display: block; margin: 16px auto; }
            @media print { body { margin: 24px; } }
          </style>
        </head>
        <body>
          <h1>${storyTitle}</h1>
          <h2>${chapterTitle}</h2>
          ${normalizedContent}
        </body>
      </html>`);
    doc.close();

    const printFrame = iframe.contentWindow;
    if (!printFrame) {
      document.body.removeChild(iframe);
      return;
    }

    const images = doc.images ? Array.from(doc.images) : [];
    const waitForImages = Promise.all(
      images.map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) return resolve(true);
            img.onload = () => resolve(true);
            img.onerror = () => resolve(true);
          })
      )
    );

    waitForImages.then(() => {
      printFrame.focus();
      printFrame.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 500);
    });
  };

  // Export story
  const handleExport = async (format: 'docx' | 'epub' | 'pdf' | 'markdown' | 'text' | 'json' | 'outline') => {
    if (!story) return;
    try {
      setExporting(true);
      
      let blob: Blob;
      let filename: string;
      
      switch (format) {
        case 'docx':
          blob = await api.exportDocx(storyId);
          filename = `${story.title}.docx`;
          break;
        case 'epub':
          blob = await api.exportEpub(storyId);
          filename = `${story.title}.epub`;
          break;
        case 'pdf':
          blob = await api.exportPdf(storyId);
          filename = `${story.title}.pdf`;
          break;
        case 'markdown':
          blob = await api.exportMarkdown(storyId);
          filename = `${story.title}.md`;
          break;
        case 'text':
          blob = await api.exportText(storyId);
          filename = `${story.title}.txt`;
          break;
        case 'json':
          try {
            const jsonData = await api.exportJson(storyId);
            blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
            filename = `${story.title}.json`;
          } catch (jsonError: any) {
            console.error('JSON export error:', jsonError);
            alert(`JSON export failed: ${jsonError.response?.data?.detail || jsonError.message || 'Unknown error'}`);
            return;
          }
          break;
        case 'outline':
          try {
            const outlineData = await api.exportOutline(storyId);
            blob = new Blob([JSON.stringify(outlineData, null, 2)], { type: 'application/json' });
            filename = `${story.title}_outline.json`;
          } catch (outlineError: any) {
            console.error('Outline export error:', outlineError);
            alert(`Outline export failed: ${outlineError.response?.data?.detail || outlineError.message || 'Unknown error'}`);
            return;
          }
          break;
        default:
          return;
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setShowExportModal(false);
    } catch (error: any) {
      console.error('Failed to export:', error);
      alert(`Failed to export story: ${error.response?.data?.detail || error.message || 'Unknown error'}`);
    } finally {
      setExporting(false);
    }
  };

  const handleExportAudiobook = async () => {
    if (!story) return;
    try {
      setExportingAudiobook(true);
      const blob = await api.exportAudiobook(storyId, audiobookVoice, 1.0, audiobookFormat);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${story.title} - Audiobook (${audiobookFormat.toUpperCase()}).zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setShowAudiobookModal(false);
    } catch (error: any) {
      console.error('Audiobook export failed:', error);
      alert(`Audiobook export failed: ${error.response?.data?.detail || error.message || 'Unknown error'}`);
    } finally {
      setExportingAudiobook(false);
    }
  };

  const handleDownloadChapter = async (chapterId: string, chapterTitle: string, chapterNumber: number) => {
    try {
      setDownloadingChapterId(chapterId);
      const blob = await api.downloadChapterAudio(storyId, chapterId, audiobookVoice, 1.0, audiobookFormat);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${String(chapterNumber).padStart(2, '0')} - ${chapterTitle}.${audiobookFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('Chapter audio download failed:', error);
      alert(`Download failed: ${error.response?.data?.detail || error.message || 'Unknown error'}`);
    } finally {
      setDownloadingChapterId(null);
    }
  };

  // Generate recap
  const handleRecap = async () => {
    if (!story) return;
    try {
      setRecapResult('Generating recap...');
      const result = await api.generateRecap(storyId);
      setRecapResult(result.recap);
    } catch (error) {
      console.error('Failed to generate recap:', error);
      setRecapResult('Failed to generate recap. Please try again.');
    }
  };

  // Check grammar
  const handleGrammarCheck = async () => {
    if (!currentChapter || !editorRef.current) return;
    try {
      setGrammarResult({ loading: true });
      const content = editorRef.current.getContent();
      const result = await api.checkGrammar(storyId, currentChapter.id, content);
      setGrammarResult(result);
    } catch (error) {
      console.error('Failed to check grammar:', error);
      setGrammarResult({ error: 'Failed to check grammar. Please try again.' });
    }
  };

  const handleQuickAction = async (action: 'rewrite' | 'summarize') => {
    if (!currentChapter || !editorRef.current) return;

    const editor = editorRef.current.editor;
    const selectedText = useEditorStore.getState().selectedText;
    const fullText = editor?.getText() || '';
    const context = selectedText || fullText;

    if (!context.trim()) {
      alert('Add or select some text first.');
      return;
    }

    try {
      useEditorStore.getState().setIsGenerating(true);

      if (action === 'rewrite') {
        const instructions = window.prompt(
          'Rewrite instructions:',
          'Improve clarity and flow while preserving meaning.'
        );
        if (!instructions) return;

        const originalText = selectedText || fullText;
        const response = await api.generateRewrite({
          story_id: storyId,
          original_text: originalText,
          instructions,
          writing_mode: useEditorStore.getState().writingMode,
        });

        const rewritten = response?.rewritten_text || '';
        if (!rewritten) return;

        if (selectedText) {
          editor?.commands.insertContent(rewritten);
        } else {
          const replaceAll = window.confirm('Replace the entire chapter with the rewrite?');
          if (replaceAll) {
            editor?.commands.setContent(rewritten);
          } else {
            editor?.commands.insertContent(`\n\n${rewritten}`);
          }
        }
      }

      if (action === 'summarize') {
        const response = await api.summarize(context, 'chapter');
        const summary = response?.summary || '';
        if (summary) {
          setRecapResult(summary);
        }
      }

      setUnsavedChanges(true);
    } catch (error) {
      console.error('Quick action failed:', error);
      alert('Quick action failed. Please try again.');
    } finally {
      useEditorStore.getState().setIsGenerating(false);
    }
  };

  const handleLanguageChange = async (nextLanguage: string) => {
    if (!story) return;
    const currentLanguage = story.language || 'English';
    if (currentLanguage === nextLanguage) return;

    setStory((current) => (current ? { ...current, language: nextLanguage } : current));

    try {
      await api.updateStory(storyId, { language: nextLanguage });
    } catch (error) {
      console.error('Failed to update story language:', error);
      setStory((current) => (current ? { ...current, language: currentLanguage } : current));
      alert('Failed to update story language. Please try again.');
    }
  };

  // AI Generation with Streaming
  const handleGenerate = async (direction?: string, wordTarget?: number) => {
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
          word_target: wordTarget || 500,
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
          onExport={() => setShowExportModal(true)}
          onAudiobook={() => setShowAudiobookModal(true)}
          onTitleChange={handleStoryTitleChange}
        />

        {/* Editor Area */}
        <main className="relative">
          {currentChapter ? (
            <div className="max-w-4xl mx-auto">
              {/* View Mode Toggle */}
              <div className="px-8 pt-6 flex justify-end">
                <div className="inline-flex bg-surface-hover rounded-lg p-1 border border-surface-border">
                  <button
                    onClick={() => {
                      setViewMode('edit');
                      setShowBookReader(false);
                    }}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                      viewMode === 'edit'
                        ? 'bg-background shadow-sm text-text-primary'
                        : 'text-text-secondary hover:text-text-primary'
                    )}
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setViewMode('preview');
                      setShowBookReader(true);
                    }}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                      viewMode === 'preview'
                        ? 'bg-background shadow-sm text-text-primary'
                        : 'text-text-secondary hover:text-text-primary'
                    )}
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </button>
                  <div className="w-px bg-surface-border mx-1 my-1" />
                  <button
                    onClick={() => {
                      handlePrint();
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                    title="Print Chapter"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                </div>
              </div>

              {/* Chapter Title */}
              <div className="px-8 pt-2 pb-4">
                {editingChapterTitle ? (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-display font-bold text-text-primary">Chapter {currentChapter.number}:</span>
                    <input
                      ref={chapterTitleInputRef}
                      value={chapterTitleDraft}
                      onChange={(e) => setChapterTitleDraft(e.target.value)}
                      onBlur={commitChapterTitle}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitChapterTitle();
                        if (e.key === 'Escape') setEditingChapterTitle(false);
                      }}
                      className="text-2xl font-display font-bold text-text-primary bg-transparent border-b border-accent outline-none flex-1 min-w-0"
                      maxLength={120}
                      autoFocus
                    />
                  </div>
                ) : (
                  <button
                    onClick={startEditingChapterTitle}
                    className="group flex items-center gap-2 text-left"
                    title="Click to rename chapter"
                  >
                    <h2 className="text-2xl font-display font-bold text-text-primary group-hover:text-accent/90 transition-colors">
                      Chapter {currentChapter.number}: {currentChapter.title}
                    </h2>
                    <Pencil className="w-4 h-4 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </button>
                )}
              </div>

              {/* Toolbar */}
              <div className="sticky top-14 z-30 bg-background border-b border-surface-border">
                <div className="max-w-4xl mx-auto px-8">
                  <div className="flex items-center justify-between">
                    <EditorToolbar editor={editorRef.current?.editor ?? null} storyId={storyId} />
                    
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
        onQuickAction={handleQuickAction}
        onBranching={() => setShowBranching(true)}
        onStoryToImage={() => setShowStoryToImage(true)}
        onImageToStory={() => setShowImageToStory(true)}
        onTTS={() => setShowTTS(true)}
        onRecap={handleRecap}
        onGrammarCheck={handleGrammarCheck}
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
              language={story?.language}
              onClose={() => setShowTTS(false)} 
            />
          </div>
        </div>
      )}

      {/* Book Reader (Preview Mode) */}
      {showBookReader && currentChapter && (
        <BookReader
          content={editorRef.current?.getContent() || currentChapter.content}
          title={story?.title || 'Story Preview'}
          onClose={() => {
            setShowBookReader(false);
            setViewMode('edit');
          }}
        />
      )}

      {/* Recap Modal */}
      {recapResult && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-display font-semibold text-text-primary">
                📖 Story Recap
              </h2>
              <button
                onClick={() => setRecapResult(null)}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="prose prose-sm max-w-none text-text-secondary whitespace-pre-wrap">
                {recapResult}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grammar Check Modal */}
      {grammarResult && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-display font-semibold text-text-primary">
                ✍️ Grammar & Style Check
              </h2>
              <button
                onClick={() => setGrammarResult(null)}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              {grammarResult.loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent" />
                </div>
              ) : grammarResult.error ? (
                <div className="text-red-500">{grammarResult.error}</div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <span>Writing Quality:</span>
                    <span className="text-accent">{grammarResult.score || 'N/A'}/10</span>
                  </div>
                  {grammarResult.summary && (
                    <div className="p-4 bg-surface rounded-lg">
                      <p className="text-sm text-text-secondary">{grammarResult.summary}</p>
                    </div>
                  )}
                  {grammarResult.strengths && grammarResult.strengths.length > 0 && (
                    <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg">
                      <h3 className="font-semibold text-accent mb-2">✨ Strengths:</h3>
                      <ul className="text-sm text-text-secondary space-y-1">
                        {grammarResult.strengths.map((strength: string, idx: number) => (
                          <li key={idx}>• {strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {grammarResult.issues && grammarResult.issues.length > 0 ? (
                    <div className="space-y-3">
                      <h3 className="font-semibold text-text-primary">📝 Suggestions for Improvement:</h3>
                      {grammarResult.issues.map((issue: any, idx: number) => (
                        <div key={idx} className="p-4 bg-background border border-warning/30 rounded-lg">
                          <div className="flex items-start gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              issue.severity === 'high' ? 'bg-red-500/20 text-red-500' :
                              issue.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                              'bg-blue-500/20 text-blue-500'
                            }`}>
                              {issue.severity}
                            </span>
                            <div className="flex-1">
                              <div className="font-medium text-text-primary capitalize">{issue.type.replace('_', ' ')}</div>
                              <div className="text-sm text-text-secondary mt-1">{issue.description}</div>
                              {issue.location && (
                                <div className="text-sm text-text-secondary/60 mt-1 italic">
                                  "{issue.location}"
                                </div>
                              )}
                              {issue.suggestion && (
                                <div className="text-sm text-accent mt-2">
                                  💡 {issue.suggestion}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-success">✓ No grammar or style issues found!</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-secondary rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-surface-border flex items-center justify-between">
              <h2 className="text-xl font-display font-semibold text-text-primary">
                📥 Export Story
              </h2>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-text-secondary hover:text-text-primary transition-colors"
                disabled={exporting}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <p className="text-text-secondary mb-2">
                Choose a format to export your story:
              </p>
              <div className="text-xs text-text-secondary/70 mb-6 p-3 bg-surface rounded">
                💡 <strong>Tip:</strong> Use PDF/EPUB for e-readers, Word/Markdown for publishers, 
                Plain Text for backups, JSON for data import, and Outline for planning.
              </div>
              <div className="space-y-3 overflow-y-auto max-h-[55vh] pr-1">
                <button
                  onClick={() => handleExport('docx')}
                  disabled={exporting}
                  className="w-full p-4 bg-surface hover:bg-surface-hover rounded-lg border border-surface-border transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-text-primary">Microsoft Word (.docx)</div>
                      <div className="text-sm text-text-secondary">Professional format for publishers, agents, or printing</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleExport('epub')}
                  disabled={exporting}
                  className="w-full p-4 bg-surface hover:bg-surface-hover rounded-lg border border-surface-border transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-text-primary">EPUB eBook (.epub)</div>
                      <div className="text-sm text-text-secondary">Digital book format for Kindle, Apple Books, and e-readers</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleExport('pdf')}
                  disabled={exporting}
                  className="w-full p-4 bg-surface hover:bg-surface-hover rounded-lg border border-surface-border transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-text-primary">PDF Document (.pdf)</div>
                      <div className="text-sm text-text-secondary">Universal format for printing, sharing, and archiving</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleExport('markdown')}
                  disabled={exporting}
                  className="w-full p-4 bg-surface hover:bg-surface-hover rounded-lg border border-surface-border transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2h-1.528A6 6 0 004 9.528V4zm2 6a4 4 0 008 0v-1h-2v1a2 2 0 11-4 0v-1H6v1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-text-primary">Markdown (.md)</div>
                      <div className="text-sm text-text-secondary">Universal format for GitHub, blogs, or conversion tools</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleExport('text')}
                  disabled={exporting}
                  className="w-full p-4 bg-surface hover:bg-surface-hover rounded-lg border border-surface-border transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-text-primary">Plain Text (.txt)</div>
                      <div className="text-sm text-text-secondary">Simple backup or reading on any device</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleExport('json')}
                  disabled={exporting}
                  className="w-full p-4 bg-surface hover:bg-surface-hover rounded-lg border border-surface-border transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-text-primary">JSON (.json)</div>
                      <div className="text-sm text-text-secondary">Complete data with chapters, characters & plotlines for developers</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleExport('outline')}
                  disabled={exporting}
                  className="w-full p-4 bg-surface hover:bg-surface-hover rounded-lg border border-surface-border transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-cyan-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-text-primary">Story Outline (.json)</div>
                      <div className="text-sm text-text-secondary">Structure only - summaries, plot points, character arcs (no full text)</div>
                    </div>
                  </div>
                </button>
              </div>
              {exporting && (
                <div className="mt-4 flex items-center justify-center gap-2 text-accent">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-accent border-t-transparent" />
                  <span className="text-sm">Exporting...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Audiobook Modal */}
      {showAudiobookModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-secondary rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-surface-border flex items-center justify-between">
              <h2 className="text-xl font-display font-semibold text-text-primary flex items-center gap-2">
                🎧 Download Audiobook
              </h2>
              <button
                onClick={() => setShowAudiobookModal(false)}
                className="text-text-secondary hover:text-text-primary transition-colors"
                disabled={exportingAudiobook || !!downloadingChapterId}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Voice + Format selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Voice</label>
                  <select
                    value={audiobookVoice}
                    onChange={e => setAudiobookVoice(e.target.value as typeof audiobookVoice)}
                    disabled={exportingAudiobook || !!downloadingChapterId}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                  >
                    <option value="neutral">Neutral</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">Format</label>
                  <select
                    value={audiobookFormat}
                    onChange={e => setAudiobookFormat(e.target.value as typeof audiobookFormat)}
                    disabled={exportingAudiobook || !!downloadingChapterId}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                  >
                    <option value="mp3">MP3 (smaller)</option>
                    <option value="wav">WAV (lossless)</option>
                  </select>
                </div>
              </div>

              {/* All chapters ZIP */}
              <div>
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">All Chapters</p>
                <button
                  onClick={handleExportAudiobook}
                  disabled={exportingAudiobook || !!downloadingChapterId}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-white font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {exportingAudiobook ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download All as ZIP
                    </>
                  )}
                </button>
              </div>

              {/* Per-chapter downloads */}
              <div>
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">By Chapter</p>
                {chapters.filter(c => c.content?.trim()).length === 0 ? (
                  <p className="text-sm text-text-secondary italic">No chapters with content yet.</p>
                ) : (
                  <div className="space-y-2 overflow-y-auto max-h-48 pr-1">
                    {chapters.filter(c => c.content?.trim()).map(ch => (
                      <div key={ch.id} className="flex items-center justify-between gap-3 px-3 py-2 bg-surface rounded-lg">
                        <span className="text-sm text-text-primary truncate">
                          <span className="text-text-secondary mr-2">Ch. {ch.number}</span>
                          {ch.title}
                        </span>
                        <button
                          onClick={() => handleDownloadChapter(ch.id, ch.title, ch.number)}
                          disabled={exportingAudiobook || downloadingChapterId === ch.id}
                          title="Download this chapter"
                          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1 rounded bg-surface-hover hover:bg-accent/20 text-accent text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {downloadingChapterId === ch.id ? (
                            <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          )}
                          {downloadingChapterId === ch.id ? 'Generating…' : 'Download'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
