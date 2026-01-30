'use client';

import { useState, useRef } from 'react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ImageToStoryProps {
  storyId: string;
  chapterId?: string;
  onContentGenerated: (content: string) => void;
  onClose: () => void;
}

export function ImageToStory({ storyId, chapterId, onContentGenerated, onClose }: ImageToStoryProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [context, setContext] = useState('');
  const [wordTarget, setWordTarget] = useState(500);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be smaller than 10MB');
      return;
    }

    try {
      const base64 = await api.fileToBase64(file);
      setImagePreview(base64);
      setImageBase64(base64);
      setError(null);
    } catch (err) {
      setError('Failed to load image');
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      try {
        const base64 = await api.fileToBase64(file);
        setImagePreview(base64);
        setImageBase64(base64);
        setError(null);
      } catch (err) {
        setError('Failed to load image');
      }
    }
  };

  const generateStory = async () => {
    if (!imageBase64) {
      setError('Please upload an image first');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.generateStoryFromImage({
        story_id: storyId,
        chapter_id: chapterId,
        image_base64: imageBase64,
        context: context || undefined,
        word_target: wordTarget,
        writing_mode: 'co_author',
      });
      setGeneratedContent(response.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate story from image');
    } finally {
      setLoading(false);
    }
  };

  const handleUseContent = () => {
    if (generatedContent) {
      onContentGenerated(generatedContent);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-display font-semibold text-text-primary">
                🖼️ Image to Story
              </h2>
              <p className="text-sm text-text-secondary mt-1">
                Upload an image and generate story content based on what the AI sees
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-surface-hover rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left: Image Upload */}
            <div>
              <h3 className="text-sm font-medium text-text-primary mb-3">Upload Image</h3>
              <div
                className={cn(
                  "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors",
                  imagePreview
                    ? "border-accent/50 bg-accent/5"
                    : "border-border hover:border-accent/30 hover:bg-surface-hover"
                )}
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-64 mx-auto rounded-lg object-contain"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setImagePreview(null);
                        setImageBase64(null);
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="py-8">
                    <svg className="w-12 h-12 mx-auto text-text-tertiary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-text-secondary mb-2">Drop an image here or click to browse</p>
                    <p className="text-xs text-text-tertiary">PNG, JPG, GIF up to 10MB</p>
                  </div>
                )}
              </div>

              {/* Context and Options */}
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Context (optional)
                  </label>
                  <textarea
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="E.g., 'This is the villain's lair' or 'Use this as the main character's appearance'"
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-tertiary resize-none h-24"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Word Target: {wordTarget}
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="1500"
                    step="100"
                    value={wordTarget}
                    onChange={(e) => setWordTarget(Number(e.target.value))}
                    className="w-full accent-accent"
                  />
                </div>
                <button
                  onClick={generateStory}
                  disabled={!imageBase64 || loading}
                  className={cn(
                    "w-full py-3 rounded-lg font-medium transition-colors",
                    imageBase64 && !loading
                      ? "bg-accent hover:bg-accent-hover text-white"
                      : "bg-surface-hover text-text-tertiary cursor-not-allowed"
                  )}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Generating...
                    </span>
                  ) : (
                    '✨ Generate Story from Image'
                  )}
                </button>
              </div>
            </div>

            {/* Right: Generated Content */}
            <div>
              <h3 className="text-sm font-medium text-text-primary mb-3">Generated Content</h3>
              <div className="bg-background border border-border rounded-xl p-4 h-96 overflow-y-auto">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 mb-4">
                    {error}
                  </div>
                )}
                {generatedContent ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <p className="text-text-primary whitespace-pre-wrap leading-relaxed">
                      {generatedContent}
                    </p>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-text-tertiary">
                    <p>Generated story content will appear here</p>
                  </div>
                )}
              </div>
              {generatedContent && (
                <button
                  onClick={handleUseContent}
                  className="w-full mt-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  📝 Add to Chapter
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
