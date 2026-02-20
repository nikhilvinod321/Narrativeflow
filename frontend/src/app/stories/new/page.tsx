'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Button, Input, Select } from '@/components/ui';
import { STORY_LANGUAGES } from '@/lib/storyLanguages';
import { BookOpen, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const GENRES = [
  { value: 'fantasy', label: 'Fantasy' },
  { value: 'science_fiction', label: 'Science Fiction' },
  { value: 'romance', label: 'Romance' },
  { value: 'mystery', label: 'Mystery' },
  { value: 'thriller', label: 'Thriller' },
  { value: 'horror', label: 'Horror' },
  { value: 'literary', label: 'Literary Fiction' },
  { value: 'historical', label: 'Historical Fiction' },
  { value: 'young_adult', label: 'Young Adult' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'drama', label: 'Drama' },
  { value: 'comedy', label: 'Comedy' },
  { value: 'other', label: 'Other' },
];

const TONES = [
  { value: 'serious', label: 'Serious' },
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'humorous', label: 'Humorous' },
  { value: 'romantic', label: 'Romantic' },
  { value: 'suspenseful', label: 'Suspenseful' },
  { value: 'epic', label: 'Epic' },
  { value: 'intimate', label: 'Intimate' },
  { value: 'melancholic', label: 'Melancholic' },
  { value: 'hopeful', label: 'Hopeful' },
];


export default function NewStoryPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('fantasy');
  const [tone, setTone] = useState('serious');
  const [language, setLanguage] = useState('English');
  const [setting, setSetting] = useState('');
  const [synopsis, setSynopsis] = useState('');

  // Redirect if not authenticated
  if (typeof window !== 'undefined' && !isAuthenticated) {
    router.push('/auth/login');
    return null;
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Please enter a title for your story');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const story = await api.createStory({
        title: title.trim(),
        genre,
        tone,
        language,
        setting_place: setting.trim() || undefined,
        synopsis: synopsis.trim() || undefined,
      });

      // Create first chapter automatically
      await api.createChapter(story.id, {
        title: 'Chapter 1',
        number: 1,
        content: '',
      });

      router.push(`/stories/${story.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create story');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-surface-border">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-accent" />
            <span className="font-bold text-gradient">NarrativeFlow</span>
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancel
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-accent' : 'bg-surface'
              }`}
            />
          ))}
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          {/* Step 1: Title & Genre */}
          {step === 1 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold font-display text-text-primary">
                    Let's Create Something Amazing
                  </h1>
                  <p className="text-text-secondary">Start with the basics</p>
                </div>
              </div>

              <div className="space-y-6">
                <Input
                  label="Story Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="The Chronicles of..."
                  autoFocus
                />

                <Select
                  label="Genre"
                  value={genre}
                  onChange={setGenre}
                  options={GENRES}
                />

                <Select
                  label="Tone"
                  value={tone}
                  onChange={setTone}
                  options={TONES}
                />

                <Select
                  label="Language"
                  value={language}
                  onChange={setLanguage}
                  options={STORY_LANGUAGES}
                />
                <p className="text-xs text-text-tertiary -mt-4">
                  AI will generate story content in your selected language
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Setting */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                  <span className="text-2xl">🌍</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold font-display text-text-primary">
                    Build Your World
                  </h1>
                  <p className="text-text-secondary">Where does your story take place?</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Setting Description
                  </label>
                  <textarea
                    value={setting}
                    onChange={(e) => setSetting(e.target.value)}
                    placeholder="Describe the world, time period, and environment of your story..."
                    rows={6}
                    className="w-full bg-surface border border-surface-border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                  />
                  <p className="text-xs text-text-tertiary mt-2">
                    This helps the AI maintain consistency in your world
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Synopsis */}
          {step === 3 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                  <span className="text-2xl">📝</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold font-display text-text-primary">
                    The Story Premise
                  </h1>
                  <p className="text-text-secondary">What's your story about?</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Synopsis (Optional)
                  </label>
                  <textarea
                    value={synopsis}
                    onChange={(e) => setSynopsis(e.target.value)}
                    placeholder="A brief overview of your story's premise, main conflict, or the journey your characters will take..."
                    rows={6}
                    className="w-full bg-surface border border-surface-border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
                  />
                  <p className="text-xs text-text-tertiary mt-2">
                    You can always add or change this later
                  </p>
                </div>

                {/* Summary */}
                <div className="p-4 bg-surface rounded-lg border border-surface-border">
                  <h3 className="font-medium text-text-primary mb-3">Story Summary</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-text-tertiary">Title</dt>
                      <dd className="text-text-primary">{title || 'Untitled'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-text-tertiary">Genre</dt>
                      <dd className="text-text-primary capitalize">{genre.replace('_', ' ')}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-text-tertiary">Tone</dt>
                      <dd className="text-text-primary capitalize">{tone.replace('_', ' ')}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-text-tertiary">Language</dt>
                      <dd className="text-text-primary">{language}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-6 p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm">
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-surface-border">
            {step > 1 ? (
              <Button variant="ghost" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <Button onClick={() => setStep(step + 1)}>
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} isLoading={loading}>
                <Sparkles className="w-4 h-4 mr-2" />
                Create Story
              </Button>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
