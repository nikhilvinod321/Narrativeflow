'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface TTSPlayerProps {
  text: string;
  language?: string;  // Language of the text for voice selection
  onClose?: () => void;
  autoPlay?: boolean;
}

export function TTSPlayer({ text, language, onClose, autoPlay = false }: TTSPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [voice, setVoice] = useState<string>('neutral');
  const [speed, setSpeed] = useState(1.0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [backendInfo, setBackendInfo] = useState<string>('');
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean text (remove HTML tags)
  const cleanText = text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const wordCount = cleanText.split(/\s+/).filter(Boolean).length;
  const estimatedMinutes = Math.ceil(wordCount / (150 * speed));

  // Try to generate audio from backend
  const generateAudio = async () => {
    if (!cleanText) {
      setError('No text to read');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/ai/tts/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanText,
          voice,
          speed,
          language,
        }),
      });
      
      const data = await response.json();
      
      if (data.success && data.audio_base64) {
        // Use server-generated audio
        setUsingFallback(false);
        setBackendInfo(data.backend_used === 'kokoro' ? 'Kokoro TTS' : data.backend_used || '');
        
        // Create audio element with base64 data
        const audioData = `data:audio/wav;base64,${data.audio_base64}`;
        
        if (audioRef.current) {
          audioRef.current.pause();
        }
        
        const audio = new Audio(audioData);
        audioRef.current = audio;
        
        audio.onplay = () => {
          setIsPlaying(true);
          setIsPaused(false);
          startProgressTracking();
        };
        
        audio.onpause = () => {
          setIsPaused(true);
          stopProgressTracking();
        };
        
        audio.onended = () => {
          setIsPlaying(false);
          setIsPaused(false);
          setProgress(100);
          stopProgressTracking();
        };
        
        audio.onerror = () => {
          setError('Error playing audio');
          setIsPlaying(false);
          stopProgressTracking();
        };
        
        await audio.play();
        
      } else if (data.fallback_to_browser) {
        // Fallback to browser TTS
        setUsingFallback(true);
        setBackendInfo('');
        playWithBrowserTTS(data.config);
      } else {
        throw new Error(data.error || 'TTS generation failed');
      }
    } catch (err) {
      console.error('TTS error:', err);
      // Fallback to browser TTS
      setUsingFallback(true);
      setBackendInfo('');
      playWithBrowserTTS();
    } finally {
      setIsLoading(false);
    }
  };

  // Browser TTS fallback
  const playWithBrowserTTS = (config?: { rate?: number; pitch?: number; preferredVoice?: string }) => {
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = config?.rate || speed;
    utterance.pitch = config?.pitch || 1.0;
    
    // Try to find a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      v.name.includes(config?.preferredVoice || '') ||
      v.lang.startsWith('en-')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(100);
    };

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        const progressPercent = (event.charIndex / cleanText.length) * 100;
        setProgress(progressPercent);
      }
    };

    utterance.onerror = (event) => {
      console.error('Browser TTS Error:', event);
      setError('Browser TTS failed. Please try a different browser.');
      setIsPlaying(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const startProgressTracking = () => {
    stopProgressTracking();
    progressIntervalRef.current = setInterval(() => {
      if (audioRef.current) {
        const { currentTime, duration } = audioRef.current;
        if (duration > 0) {
          setProgress((currentTime / duration) * 100);
        }
      }
    }, 100);
  };

  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const play = async () => {
    if (audioRef.current && !usingFallback) {
      // Resume existing audio
      await audioRef.current.play();
    } else if (utteranceRef.current && usingFallback) {
      // Resume browser TTS
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      // Generate new audio
      await generateAudio();
    }
  };

  const pause = () => {
    if (audioRef.current && !usingFallback) {
      audioRef.current.pause();
    } else if (usingFallback) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (usingFallback) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
    stopProgressTracking();
    utteranceRef.current = null;
  };

  const togglePlayPause = async () => {
    if (!isPlaying) {
      await play();
    } else if (isPaused) {
      await play();
    } else {
      pause();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
      if (audioRef.current) {
        audioRef.current.src = '';
      }
    };
  }, []);

  // Auto-play if enabled
  useEffect(() => {
    if (autoPlay && text) {
      play();
    }
  }, [autoPlay]);

  // Reset when voice/speed changes
  useEffect(() => {
    if (isPlaying) {
      stop();
    }
    audioRef.current = null;
    utteranceRef.current = null;
  }, [voice, speed]);

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-text-primary flex items-center gap-2">
          🔊 Read Aloud
          {backendInfo && (
            <span className="text-xs font-normal text-text-tertiary">
              ({backendInfo})
            </span>
          )}
        </h3>
        {onClose && (
          <button onClick={onClose} className="text-text-tertiary hover:text-text-secondary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Progress Bar */}
      <div className="relative h-2 bg-background rounded-full mb-4 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-accent transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <button
          onClick={stop}
          disabled={!isPlaying && !isPaused}
          className={cn(
            "p-2 rounded-lg transition-colors",
            (isPlaying || isPaused) ? "text-text-primary hover:bg-surface-hover" : "text-text-tertiary"
          )}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="1" />
          </svg>
        </button>

        <button
          onClick={togglePlayPause}
          disabled={isLoading}
          className="p-4 bg-accent hover:bg-accent-hover text-white rounded-full transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : isPlaying && !isPaused ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <div className="text-xs text-text-tertiary">
          {isLoading ? 'Generating...' : isPlaying ? (isPaused ? 'Paused' : 'Playing...') : `~${estimatedMinutes} min`}
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-3">
        {/* Voice Selection */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-text-secondary w-16">Voice:</label>
          <div className="flex gap-2 flex-1">
            {(['male', 'female', 'neutral'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVoice(v)}
                className={cn(
                  "flex-1 px-3 py-1.5 text-xs rounded-lg border transition-colors capitalize",
                  voice === v
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border text-text-secondary hover:border-accent/30"
                )}
              >
                {v === 'male' && '👨 '}
                {v === 'female' && '👩 '}
                {v === 'neutral' && '🎙️ '}
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Speed Control */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-text-secondary w-16">Speed:</label>
          <div className="flex-1 flex items-center gap-2">
            <span className="text-xs text-text-tertiary">0.5x</span>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="flex-1 accent-accent"
            />
            <span className="text-xs text-text-tertiary">2x</span>
            <span className="text-xs text-accent font-medium w-10 text-right">{speed}x</span>
          </div>
        </div>
      </div>

      {/* Word Count */}
      <div className="mt-3 pt-3 border-t border-border text-xs text-text-tertiary text-center">
        {wordCount.toLocaleString()} words • Estimated reading time: {estimatedMinutes} min at {speed}x speed
      </div>
    </div>
  );
}

// Compact inline TTS button for toolbars
export function TTSButton({ 
  text, 
  getText,
  className 
}: { 
  text?: string; 
  getText?: () => string;
  className?: string;
}) {
  const [showPlayer, setShowPlayer] = useState(false);
  const [playerText, setPlayerText] = useState('');

  const handleOpen = () => {
    // Get fresh content when opening
    const content = getText ? getText() : (text || '');
    setPlayerText(content);
    setShowPlayer(true);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className={cn(
          "p-2 rounded-lg hover:bg-surface-hover transition-colors",
          className
        )}
        title="Read Aloud"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
      </button>

      {showPlayer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <TTSPlayer text={playerText} onClose={() => setShowPlayer(false)} />
          </div>
        </div>
      )}
    </>
  );
}
