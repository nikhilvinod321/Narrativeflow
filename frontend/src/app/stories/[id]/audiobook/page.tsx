'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, type AudiobookManifest, type AudiobookChapterInfo } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import {
  ArrowLeft,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  RefreshCw,
  CheckCircle,
  Circle,
  Headphones,
  Zap,
  Loader2,
  Trash2,
} from 'lucide-react';

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];
const VOICES = [
  { id: 'neutral', label: 'Neutral' },
  { id: 'female', label: 'Female' },
  { id: 'male', label: 'Male' },
] as const;

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:8000';

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds === 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function AudiobookPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;
  const { isAuthenticated } = useAuthStore();

  // Data
  const [manifest, setManifest] = useState<AudiobookManifest | null>(null);
  const [loading, setLoading] = useState(true);

  // Generation state
  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const [generatingAll, setGeneratingAll] = useState(false);

  // Playback settings
  const [voice, setVoice] = useState<'neutral' | 'male' | 'female'>('neutral');
  const [speed, setSpeed] = useState(1);

  // Player state
  const [currentChapterId, setCurrentChapterId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chapterListRef = useRef<HTMLDivElement>(null);

  // ── Load manifest ────────────────────────────────────────────────────────────

  const loadManifest = useCallback(async () => {
    try {
      const data = await api.getAudiobookManifest(storyId);
      setManifest(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [storyId]);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    loadManifest();
  }, [isAuthenticated, loadManifest, router]);

  // ── Audio element setup ──────────────────────────────────────────────────────

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime));
    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
    audio.addEventListener('ended', playNextChapter);
    audio.addEventListener('play', () => setIsPlaying(true));
    audio.addEventListener('pause', () => setIsPlaying(false));

    return () => {
      audio.pause();
      audio.src = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Playback helpers ─────────────────────────────────────────────────────────

  const loadChapter = (chapter: AudiobookChapterInfo, autoPlay = true) => {
    if (!chapter.audio_url || !audioRef.current) return;
    audioRef.current.src = `${API_BASE}${chapter.audio_url}`;
    audioRef.current.playbackRate = speed;
    setCurrentChapterId(chapter.id);
    setCurrentTime(0);
    setDuration(0);
    if (autoPlay) audioRef.current.play().catch(() => {});
    // Scroll chapter into view
    const el = document.getElementById(`chapter-${chapter.id}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!currentChapterId) {
      // Start from first chapter with audio
      const first = manifest?.chapters.find(c => c.has_audio);
      if (first) loadChapter(first);
      return;
    }
    if (isPlaying) audio.pause();
    else audio.play().catch(() => {});
  };

  const playNextChapter = useCallback(() => {
    if (!manifest) return;
    const idx = manifest.chapters.findIndex(c => c.id === currentChapterId);
    const next = manifest.chapters.slice(idx + 1).find(c => c.has_audio);
    if (next) loadChapter(next);
    else setIsPlaying(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manifest, currentChapterId]);

  const playPrevChapter = () => {
    if (!manifest) return;
    const idx = manifest.chapters.findIndex(c => c.id === currentChapterId);
    const prev = [...manifest.chapters].slice(0, idx).reverse().find(c => c.has_audio);
    if (prev) loadChapter(prev);
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value);
    if (audioRef.current) audioRef.current.currentTime = t;
    setCurrentTime(t);
  };

  const changeSpeed = (s: number) => {
    setSpeed(s);
    if (audioRef.current) audioRef.current.playbackRate = s;
  };

  // ── Generation ───────────────────────────────────────────────────────────────

  const generateChapter = async (chapter: AudiobookChapterInfo) => {
    setGenerating(p => ({ ...p, [chapter.id]: true }));
    try {
      await api.generateChapterAudio(storyId, chapter.id, voice, speed);
      await loadManifest();
    } catch {
      // ignore
    } finally {
      setGenerating(p => ({ ...p, [chapter.id]: false }));
    }
  };

  const generateAll = async () => {
    if (!manifest) return;
    setGeneratingAll(true);
    const toGenerate = manifest.chapters.filter(c => c.word_count > 0);
    for (const chapter of toGenerate) {
      setGenerating(p => ({ ...p, [chapter.id]: true }));
      try {
        await api.generateChapterAudio(storyId, chapter.id, voice, speed);
        await loadManifest();
      } catch {
        // continue with next
      } finally {
        setGenerating(p => ({ ...p, [chapter.id]: false }));
      }
    }
    setGeneratingAll(false);
  };

  const deleteChapterAudio = async (chapter: AudiobookChapterInfo) => {
    try {
      await api.deleteChapterAudio(storyId, chapter.id);
      if (currentChapterId === chapter.id) {
        audioRef.current?.pause();
        setCurrentChapterId(null);
        setIsPlaying(false);
      }
      await loadManifest();
    } catch {
      // ignore
    }
  };

  // ── Derived ──────────────────────────────────────────────────────────────────

  const currentChapter = manifest?.chapters.find(c => c.id === currentChapterId) ?? null;
  const totalDurationMin = manifest?.chapters.reduce((s, c) => s + c.estimated_minutes, 0) ?? 0;

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Header ── */}
      <header className="h-14 bg-background-secondary border-b border-surface-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-text-tertiary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Headphones className="w-5 h-5 text-accent" />
            <span className="font-semibold text-text-primary truncate max-w-xs">
              {manifest?.story_title ?? 'Audiobook'}
            </span>
          </div>
          {manifest && (
            <span className="text-xs text-text-tertiary hidden sm:block">
              {manifest.chapters_with_audio}/{manifest.total_chapters} chapters ready
              · ~{Math.round(totalDurationMin)} min
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Voice selector */}
          <select
            value={voice}
            onChange={e => setVoice(e.target.value as typeof voice)}
            className="text-xs px-2 py-1 bg-surface border border-border rounded text-text-secondary focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {VOICES.map(v => (
              <option key={v.id} value={v.id}>{v.label} voice</option>
            ))}
          </select>

          {/* Generate All */}
          <button
            onClick={generateAll}
            disabled={generatingAll || !manifest?.total_chapters}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {generatingAll
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Zap className="w-4 h-4" />}
            Generate All
          </button>
        </div>
      </header>

      {/* ── Chapter list ── */}
      <div ref={chapterListRef} className="flex-1 overflow-y-auto px-4 py-4 pb-32 max-w-3xl mx-auto w-full">
        {!manifest?.chapters.length ? (
          <div className="text-center py-20 text-text-tertiary">
            <Headphones className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No chapters found in this story.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {manifest.chapters.map((chapter, idx) => {
              const isActive = chapter.id === currentChapterId;
              const isGen = generating[chapter.id];
              const empty = chapter.word_count === 0;

              return (
                <div
                  key={chapter.id}
                  id={`chapter-${chapter.id}`}
                  className={`rounded-xl border px-4 py-3 flex items-center gap-4 transition-colors ${
                    isActive
                      ? 'border-accent bg-accent/5'
                      : 'border-border bg-surface hover:border-accent/40'
                  }`}
                >
                  {/* Status icon */}
                  <div className="shrink-0 w-6 flex justify-center">
                    {isGen ? (
                      <Loader2 className="w-5 h-5 text-accent animate-spin" />
                    ) : chapter.has_audio ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-text-tertiary" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isActive ? 'text-accent' : 'text-text-primary'}`}>
                      {idx + 1}. {chapter.title}
                    </p>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      {empty
                        ? 'No content'
                        : `${chapter.word_count.toLocaleString()} words · ~${chapter.estimated_minutes} min`}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {chapter.has_audio && (
                      <>
                        <button
                          onClick={() => loadChapter(chapter)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                            isActive && isPlaying
                              ? 'bg-accent text-white'
                              : 'bg-surface border border-border text-text-secondary hover:bg-accent hover:text-white hover:border-accent'
                          }`}
                          title="Play"
                        >
                          {isActive && isPlaying
                            ? <Pause className="w-4 h-4" />
                            : <Play className="w-4 h-4 ml-0.5" />}
                        </button>
                        <button
                          onClick={() => generateChapter(chapter)}
                          disabled={isGen}
                          className="text-text-tertiary hover:text-accent transition-colors"
                          title="Regenerate"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteChapterAudio(chapter)}
                          className="text-text-tertiary hover:text-red-400 transition-colors"
                          title="Delete audio"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {!chapter.has_audio && !empty && (
                      <button
                        onClick={() => generateChapter(chapter)}
                        disabled={isGen}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-accent text-accent text-xs hover:bg-accent hover:text-white transition-colors disabled:opacity-50"
                      >
                        {isGen
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <Volume2 className="w-3 h-3" />}
                        Generate
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Bottom player bar ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-background-secondary border-t border-surface-border px-4 py-3 z-50">
        <div className="max-w-3xl mx-auto">
          {/* Progress bar */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-text-tertiary w-10 text-right tabular-nums">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 1}
              value={currentTime}
              onChange={seek}
              className="flex-1 h-1 accent-accent cursor-pointer"
              disabled={!currentChapterId}
            />
            <span className="text-xs text-text-tertiary w-10 tabular-nums">
              {formatTime(duration)}
            </span>
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between gap-4">
            {/* Chapter info */}
            <div className="flex-1 min-w-0">
              {currentChapter ? (
                <>
                  <p className="text-sm font-medium text-text-primary truncate">
                    {currentChapter.title}
                  </p>
                  <p className="text-xs text-text-tertiary">
                    Chapter {currentChapter.number}
                  </p>
                </>
              ) : (
                <p className="text-sm text-text-tertiary">No chapter selected</p>
              )}
            </div>

            {/* Playback controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={playPrevChapter}
                disabled={!currentChapterId}
                className="text-text-secondary hover:text-text-primary disabled:opacity-30 transition-colors"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={togglePlay}
                className="w-11 h-11 rounded-full bg-accent text-white flex items-center justify-center hover:bg-accent/90 transition-colors shadow-lg disabled:opacity-50"
                disabled={!manifest?.chapters.some(c => c.has_audio)}
              >
                {isPlaying
                  ? <Pause className="w-5 h-5" />
                  : <Play className="w-5 h-5 ml-0.5" />}
              </button>

              <button
                onClick={playNextChapter}
                disabled={!currentChapterId}
                className="text-text-secondary hover:text-text-primary disabled:opacity-30 transition-colors"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Speed */}
            <div className="flex items-center gap-1">
              {SPEEDS.map(s => (
                <button
                  key={s}
                  onClick={() => changeSpeed(s)}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    speed === s
                      ? 'bg-accent text-white'
                      : 'text-text-tertiary hover:text-text-secondary'
                  }`}
                >
                  {s}×
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
