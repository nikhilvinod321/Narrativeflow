'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface StoryToImageProps {
  storyId: string;
  content?: string;
  characterId?: string;
  onClose: () => void;
}

interface ImageStatus {
  available: boolean;
  error?: string;
  setup_instructions?: string;
}

interface Character {
  id: string;
  name: string;
  physical_description?: string;
  personality_traits?: string[];
  image_generation_seed?: number;
  visual_style?: string;
}

interface ConsistencyTips {
  tips: string[];
  recommended_settings: {
    character_portrait: { width: number; height: number; steps: number; cfg_scale: number; style: string };
    scene_illustration: { width: number; height: number; steps: number; cfg_scale: number; style: string };
    book_cover: { width: number; height: number; steps: number; cfg_scale: number; style: string };
  };
}

interface GhibliStatus {
  available: boolean;
  backend?: string;
  estimated_time?: string;
  error?: string;
  note?: string;
  setup_instructions?: string;
}

interface GhibliPresets {
  moods: { id: string; label: string }[];
  times_of_day: { id: string; label: string }[];
  character_expressions: { id: string; label: string }[];
  tips: string[];
}

export function StoryToImage({ storyId, content: initialContent, characterId, onClose }: StoryToImageProps) {
  const [content, setContent] = useState(initialContent || '');
  const [imageType, setImageType] = useState<'scene' | 'character' | 'cover' | 'environment'>('scene');
  const [style, setStyle] = useState('ghibli'); // Default to Ghibli
  const [generateImage, setGenerateImage] = useState(true);
  const [width, setWidth] = useState(512);
  const [height, setHeight] = useState(512);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedImageBase64, setGeneratedImageBase64] = useState<string | null>(null);
  const [generatedImagePath, setGeneratedImagePath] = useState<string | null>(null); // Track file path for saving
  const [generatedFileName, setGeneratedFileName] = useState<string | null>(null);
  const [savedToGallery, setSavedToGallery] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sdStatus, setSdStatus] = useState<ImageStatus | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  
  // New state for character consistency
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>(characterId || '');
  const [consistencyTips, setConsistencyTips] = useState<ConsistencyTips | null>(null);
  const [showTips, setShowTips] = useState(false);
  const [seed, setSeed] = useState<number>(-1);
  const [useSavedSeed, setUseSavedSeed] = useState(true);
  
  // Ghibli-specific state
  const [ghibliStatus, setGhibliStatus] = useState<GhibliStatus | null>(null);
  const [ghibliPresets, setGhibliPresets] = useState<GhibliPresets | null>(null);
  const [mood, setMood] = useState('peaceful');
  const [timeOfDay, setTimeOfDay] = useState('day');
  const [expression, setExpression] = useState('gentle');
  const [useGhibli, setUseGhibli] = useState(true); // Default to Ghibli style

  const [artStyles, setArtStyles] = useState([
    { id: 'ghibli', label: '🎨 Studio Ghibli' },
    { id: 'anime', label: '✨ Anime/Manga' },
    { id: 'photorealistic', label: '📷 Photorealistic' },
    { id: 'fantasy', label: '🏰 Fantasy Art' },
    { id: 'watercolor', label: '🖌️ Watercolor' },
    { id: 'oil_painting', label: '🎨 Oil Painting' },
    { id: 'comic', label: '💥 Comic Book' },
    { id: 'cyberpunk', label: '🌃 Cyberpunk' },
    { id: 'steampunk', label: '⚙️ Steampunk' },
    { id: 'dark_gothic', label: '🦇 Dark/Gothic' },
    { id: 'minimalist', label: '⬜ Minimalist' },
    { id: 'pixel_art', label: '👾 Pixel Art' },
    { id: 'impressionist', label: '🌻 Impressionist' },
    { id: 'art_nouveau', label: '🌸 Art Nouveau' },
  ]);

  // Check Ghibli and SD status on mount
  useEffect(() => {
    checkImageStatus();
    checkGhibliStatus();
    fetchCharacters();
    fetchConsistencyTips();
    fetchGhibliPresets();
  }, []);

  // Update dimensions based on image type for Ghibli
  useEffect(() => {
    if (style === 'ghibli') {
      if (imageType === 'character') {
        setWidth(512);
        setHeight(640);
      } else {
        setWidth(768);
        setHeight(512);
      }
    } else if (consistencyTips?.recommended_settings) {
      if (imageType === 'character') {
        const settings = consistencyTips.recommended_settings.character_portrait;
        setWidth(settings.width);
        setHeight(settings.height);
      } else if (imageType === 'cover') {
        const settings = consistencyTips.recommended_settings.book_cover;
        setWidth(settings.width);
        setHeight(settings.height);
      } else {
        const settings = consistencyTips.recommended_settings.scene_illustration;
        setWidth(settings.width);
        setHeight(settings.height);
      }
    }
  }, [imageType, consistencyTips, style]);

  // Load character's saved seed when selected
  useEffect(() => {
    if (selectedCharacterId) {
      const char = characters.find(c => c.id === selectedCharacterId);
      if (char?.image_generation_seed && useSavedSeed) {
        setSeed(char.image_generation_seed);
      }
      if (char?.visual_style) {
        setStyle(char.visual_style);
      }
    }
  }, [selectedCharacterId, characters, useSavedSeed]);

  const checkGhibliStatus = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/ai/ghibli/status`);
      if (response.ok) {
        const data = await response.json();
        setGhibliStatus(data);
      }
    } catch (err) {
      console.error('Failed to check Ghibli status:', err);
    }
  };

  const fetchGhibliPresets = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/ai/ghibli/presets`);
      if (response.ok) {
        const data = await response.json();
        setGhibliPresets(data);
        
        // Update art styles from backend if available
        if (data.art_styles && data.art_styles.length > 0) {
          const styleEmojis: { [key: string]: string } = {
            'ghibli': '🎨',
            'anime': '✨',
            'photorealistic': '📷',
            'fantasy': '🏰',
            'watercolor': '🖌️',
            'oil_painting': '🎨',
            'comic': '💥',
            'cyberpunk': '🌃',
            'steampunk': '⚙️',
            'dark_gothic': '🦇',
            'minimalist': '⬜',
            'pixel_art': '👾',
            'impressionist': '🌻',
            'art_nouveau': '🌸',
          };
          
          setArtStyles(data.art_styles.map((s: { id: string; label: string }) => ({
            id: s.id,
            label: `${styleEmojis[s.id] || '🎨'} ${s.label}`,
          })));
        }
      }
    } catch (err) {
      console.error('Failed to fetch presets:', err);
    }
  };

  const fetchCharacters = async () => {
    try {
      // Use the correct endpoint: /api/characters/story/{story_id}
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/characters/story/${storyId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCharacters(data);
      }
    } catch (err) {
      console.error('Failed to fetch characters:', err);
    }
  };

  const fetchConsistencyTips = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/ai/image/consistency-tips`);
      if (response.ok) {
        const data = await response.json();
        setConsistencyTips(data);
      }
    } catch (err) {
      console.error('Failed to fetch consistency tips:', err);
    }
  };

  const checkImageStatus = async () => {
    setCheckingStatus(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/ai/image/status`);
      const data = await response.json();
      setSdStatus(data);
    } catch (err) {
      setSdStatus({ available: false, error: 'Could not check image service status' });
    } finally {
      setCheckingStatus(false);
    }
  };

  const generatePrompt = async () => {
    if (!content.trim() && imageType !== 'character') {
      setError('Please enter some story content to visualize');
      return;
    }

    if (imageType === 'character' && !selectedCharacterId && !content.trim()) {
      setError('Please select a character or enter a description');
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedImageUrl(null);
    setGeneratedImageBase64(null);
    
    try {
      let data;
      
      // Use Ghibli API when Ghibli style is selected
      if (style === 'ghibli' || ghibliStatus?.available) {
        if (imageType === 'character' && selectedCharacterId) {
          // Ghibli character portrait
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/ai/ghibli/character`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              character_id: selectedCharacterId,
              expression: expression,
              seed: seed,
              style_id: style || 'ghibli',
            }),
          });
          
          data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.detail || 'Failed to generate character');
          }
        } else if (imageType === 'scene' || imageType === 'environment') {
          // Scene generation
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/ai/ghibli/scene`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              description: content,
              character_ids: selectedCharacterId ? [selectedCharacterId] : undefined,
              mood: mood,
              time_of_day: timeOfDay,
              seed: seed,
              style_id: style || 'ghibli',
            }),
          });
          
          data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.detail || 'Failed to generate scene');
          }
        } else {
          // Generic generation
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/ai/ghibli/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: content,
              mood: mood,
              time_of_day: timeOfDay,
              width,
              height,
              seed: seed,
              style_id: style || 'ghibli',
            }),
          });
          
          data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.detail || 'Failed to generate image');
          }
        }
        
        // Update seed from response
        if (data.seed && data.seed !== -1 && typeof data.seed === 'number') {
          setSeed(data.seed);
        }
      }
      // Use character-portrait endpoint for character images with selected character
      else if (imageType === 'character' && selectedCharacterId) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/ai/image/character-portrait`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            character_id: selectedCharacterId,
            scene_context: content || undefined,
            style: style || 'portrait',
            use_stored_seed: useSavedSeed,
            width,
            height,
            generate_image: generateImage && sdStatus?.available,
          }),
        });
        
        data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.detail || 'Failed to generate character portrait');
        }
        
        // Update seed if a new one was generated
        if (data.seed && data.seed !== -1) {
          setSeed(data.seed);
        }
      } else {
        // Use the standard story-to-image endpoint
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/ai/story-to-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            story_id: storyId,
            content: content,
            image_type: imageType,
            style: style || undefined,
            character_id: selectedCharacterId || characterId,
            generate_image: generateImage && sdStatus?.available,
            width,
            height,
            seed: seed !== -1 ? seed : undefined,
          }),
        });
        
        data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.detail || 'Failed to generate');
        }
      }
      
      setGeneratedPrompt(data.image_prompt || data.prompt);
      
      if (data.image_base64) {
        setGeneratedImageBase64(data.image_base64);
        setGeneratedImageUrl(data.image_url);
        setGeneratedImagePath(data.image_path || null);
        setGeneratedFileName(data.image_path ? data.image_path.split('/').pop() : null);
        setSavedToGallery(false); // Reset save status for new image
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate image prompt');
    } finally {
      setLoading(false);
    }
  };

  const saveCharacterSeed = async () => {
    if (!selectedCharacterId || seed === -1) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/ai/image/save-character-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character_id: selectedCharacterId,
          seed: seed,
          prompt: generatedPrompt,
          style: style,
        }),
      });
      
      if (response.ok) {
        // Refresh characters to get updated seed
        fetchCharacters();
        alert('Seed and prompt saved for character consistency!');
      }
    } catch (err) {
      console.error('Failed to save character seed:', err);
    }
  };

  const copyToClipboard = async () => {
    if (generatedPrompt) {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const saveToGallery = async () => {
    if (!generatedImagePath || !generatedFileName) {
      // If no path from server, try to save from base64
      setError('Cannot save to gallery - no image path available');
      return;
    }

    try {
      await api.saveGeneratedImage({
        story_id: storyId,
        character_id: selectedCharacterId || characterId || undefined,
        image_type: imageType,
        title: `${imageType.charAt(0).toUpperCase() + imageType.slice(1)} - ${new Date().toLocaleDateString()}`,
        file_path: generatedImagePath,
        file_name: generatedFileName,
        prompt: generatedPrompt || undefined,
        style_id: style || undefined,
        seed: seed !== -1 ? seed : undefined,
      });
      setSavedToGallery(true);
    } catch (err) {
      console.error('Failed to save to gallery:', err);
      setError('Failed to save image to gallery');
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
                🎨 Story to Image
              </h2>
              <p className="text-sm text-text-secondary mt-1">
                Generate image prompts from your story content for AI art tools
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
            {/* Left: Input */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Story Content to Visualize
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste a scene description, character appearance, or any story content you want to turn into an image..."
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-tertiary resize-none h-48"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Image Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['scene', 'character', 'environment', 'cover'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setImageType(type)}
                      className={cn(
                        "px-4 py-2 rounded-lg border text-sm font-medium transition-colors capitalize",
                        imageType === type
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border text-text-secondary hover:border-accent/30"
                      )}
                    >
                      {type === 'scene' && '🎬 '}
                      {type === 'character' && '👤 '}
                      {type === 'environment' && '🏞️ '}
                      {type === 'cover' && '📚 '}
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Art Style
                </label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 text-text-primary"
                >
                  {artStyles.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Ghibli Style Options */}
              {style === 'ghibli' && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400">🎨</span>
                    <span className="text-sm text-emerald-400 font-medium">Studio Ghibli Style</span>
                    {ghibliStatus?.available && (
                      <span className="ml-auto text-xs text-emerald-400">✓ Local generation ready</span>
                    )}
                  </div>
                  
                  {ghibliStatus?.estimated_time && (
                    <p className="text-xs text-text-tertiary">
                      ⏱️ {ghibliStatus.estimated_time}
                    </p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-text-tertiary">Mood</label>
                      <select
                        value={mood}
                        onChange={(e) => setMood(e.target.value)}
                        className="w-full mt-1 bg-background border border-border rounded px-2 py-1 text-sm"
                      >
                        {ghibliPresets?.moods?.map((m) => (
                          <option key={m.id} value={m.id}>{m.label}</option>
                        )) || (
                          <>
                            <option value="peaceful">Peaceful & Serene</option>
                            <option value="adventurous">Adventurous</option>
                            <option value="mysterious">Mysterious & Magical</option>
                            <option value="romantic">Romantic</option>
                            <option value="joyful">Joyful & Playful</option>
                          </>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-text-tertiary">Time of Day</label>
                      <select
                        value={timeOfDay}
                        onChange={(e) => setTimeOfDay(e.target.value)}
                        className="w-full mt-1 bg-background border border-border rounded px-2 py-1 text-sm"
                      >
                        {ghibliPresets?.times_of_day?.map((t) => (
                          <option key={t.id} value={t.id}>{t.label}</option>
                        )) || (
                          <>
                            <option value="dawn">Dawn - Soft Morning Light</option>
                            <option value="day">Day - Bright & Cheerful</option>
                            <option value="sunset">Sunset - Golden Hour</option>
                            <option value="dusk">Dusk - Twilight Magic</option>
                            <option value="night">Night - Moonlit Scene</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>
                  
                  {imageType === 'character' && (
                    <div>
                      <label className="text-xs text-text-tertiary">Expression</label>
                      <select
                        value={expression}
                        onChange={(e) => setExpression(e.target.value)}
                        className="w-full mt-1 bg-background border border-border rounded px-2 py-1 text-sm"
                      >
                        {ghibliPresets?.character_expressions?.map((e) => (
                          <option key={e.id} value={e.id}>{e.label}</option>
                        )) || (
                          <>
                            <option value="gentle">Gentle & Kind</option>
                            <option value="determined">Determined</option>
                            <option value="curious">Curious & Wonder</option>
                            <option value="peaceful">Peaceful</option>
                            <option value="joyful">Joyful</option>
                          </>
                        )}
                      </select>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-text-tertiary">Seed:</label>
                    <input
                      type="number"
                      value={seed}
                      onChange={(e) => setSeed(parseInt(e.target.value) || -1)}
                      className="flex-1 bg-background border border-border rounded px-2 py-1 text-sm"
                      placeholder="-1 for random"
                    />
                  </div>
                  
                  {ghibliPresets?.tips && (
                    <details className="text-xs text-text-tertiary">
                      <summary className="cursor-pointer hover:text-text-secondary">💡 Tips for Ghibli Style</summary>
                      <ul className="mt-2 space-y-1 pl-4">
                        {ghibliPresets.tips.slice(0, 4).map((tip, i) => (
                          <li key={i}>• {tip}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              )}

              {/* Character Selection - only show when image type is character */}
              {imageType === 'character' && characters.length > 0 && (
                <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-purple-400">👤</span>
                    <span className="text-sm text-purple-400 font-medium">Character Consistency</span>
                    <button
                      onClick={() => setShowTips(!showTips)}
                      className="ml-auto text-xs text-purple-400 hover:text-purple-300"
                    >
                      {showTips ? 'Hide tips' : 'Show tips'}
                    </button>
                  </div>
                  
                  <div>
                    <label className="text-xs text-text-tertiary">Select Character</label>
                    <select
                      value={selectedCharacterId}
                      onChange={(e) => setSelectedCharacterId(e.target.value)}
                      className="w-full mt-1 bg-background border border-border rounded px-3 py-2 text-sm"
                    >
                      <option value="">-- None (use description) --</option>
                      {characters.map((char) => (
                        <option key={char.id} value={char.id}>
                          {char.name} {char.image_generation_seed ? '✓ has seed' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {selectedCharacterId && (
                    <>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useSavedSeed}
                          onChange={(e) => setUseSavedSeed(e.target.checked)}
                          className="rounded border-border"
                        />
                        <span className="text-sm text-text-secondary">Use saved seed for consistency</span>
                      </label>
                      
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-text-tertiary">Seed:</label>
                        <input
                          type="number"
                          value={seed}
                          onChange={(e) => setSeed(parseInt(e.target.value) || -1)}
                          className="flex-1 bg-background border border-border rounded px-2 py-1 text-sm"
                          placeholder="-1 for random"
                        />
                        {seed !== -1 && generatedPrompt && (
                          <button
                            onClick={saveCharacterSeed}
                            className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30"
                          >
                            Save seed
                          </button>
                        )}
                      </div>
                    </>
                  )}
                  
                  {showTips && consistencyTips && (
                    <div className="mt-3 pt-3 border-t border-purple-500/20">
                      <p className="text-xs text-text-tertiary mb-2">💡 Consistency Tips:</p>
                      <ul className="text-xs text-text-secondary space-y-1">
                        {consistencyTips.tips.slice(0, 4).map((tip, i) => (
                          <li key={i}>• {tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={generatePrompt}
                disabled={(!content.trim() && !selectedCharacterId) || loading}
                className={cn(
                  "w-full py-3 rounded-lg font-medium transition-colors",
                  (content.trim() || selectedCharacterId) && !loading
                    ? "bg-accent hover:bg-accent-hover text-white"
                    : "bg-surface-hover text-text-tertiary cursor-not-allowed"
                )}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    {generateImage && sdStatus?.available ? 'Generating Image...' : 'Generating Prompt...'}
                  </span>
                ) : (
                  <>🎨 {generateImage && sdStatus?.available ? 'Generate Image' : 'Generate Prompt'}</>
                )}
              </button>

              {/* Image Generation Options */}
              {sdStatus?.available && (
                <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-green-400">✓</span>
                    <span className="text-sm text-green-400 font-medium">Stable Diffusion Available</span>
                  </div>
                  
                  <label className="flex items-center gap-2 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={generateImage}
                      onChange={(e) => setGenerateImage(e.target.checked)}
                      className="rounded border-border"
                    />
                    <span className="text-sm text-text-secondary">Generate actual image (not just prompt)</span>
                  </label>
                  
                  {generateImage && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-text-tertiary">Width</label>
                        <select
                          value={width}
                          onChange={(e) => setWidth(Number(e.target.value))}
                          className="w-full mt-1 bg-background border border-border rounded px-2 py-1 text-sm"
                        >
                          <option value={512}>512px</option>
                          <option value={768}>768px</option>
                          <option value={1024}>1024px</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-text-tertiary">Height</label>
                        <select
                          value={height}
                          onChange={(e) => setHeight(Number(e.target.value))}
                          className="w-full mt-1 bg-background border border-border rounded px-2 py-1 text-sm"
                        >
                          <option value={512}>512px</option>
                          <option value={768}>768px</option>
                          <option value={1024}>1024px</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Show Ghibli status when Ghibli style is selected */}
              {!checkingStatus && style === 'ghibli' && ghibliStatus && (
                <div className={cn(
                  "mt-4 p-4 rounded-lg border",
                  ghibliStatus.available 
                    ? "bg-green-500/10 border-green-500/30" 
                    : "bg-amber-500/10 border-amber-500/30"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={ghibliStatus.available ? "text-green-400" : "text-amber-400"}>
                      {ghibliStatus.available ? '✓' : '⚠'}
                    </span>
                    <span className={cn(
                      "text-sm font-medium",
                      ghibliStatus.available ? "text-green-400" : "text-amber-400"
                    )}>
                      {ghibliStatus.available 
                        ? `Ghibli Generation Ready (${ghibliStatus.backend || 'CPU'})` 
                        : 'Ghibli Generation Not Available'}
                    </span>
                  </div>
                  {ghibliStatus.available ? (
                    <p className="text-xs text-text-tertiary">
                      {ghibliStatus.note || 'Local image generation using SD-Turbo'}
                    </p>
                  ) : (
                    <>
                      <p className="text-xs text-text-tertiary mb-2">
                        {ghibliStatus.error || 'Could not initialize Ghibli service'}
                      </p>
                      {ghibliStatus.setup_instructions && (
                        <p className="text-xs text-amber-400">
                          {ghibliStatus.setup_instructions}
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Show SD status when not using Ghibli style */}
              {!checkingStatus && style !== 'ghibli' && !sdStatus?.available && (
                <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-amber-400">⚠</span>
                    <span className="text-sm text-amber-400 font-medium">Local Image Generation Not Available</span>
                  </div>
                  <p className="text-xs text-text-tertiary mb-2">
                    Prompts will be generated for use with external tools.
                  </p>
                  <details className="text-xs text-text-tertiary">
                    <summary className="cursor-pointer hover:text-text-secondary">Setup Instructions</summary>
                    <pre className="mt-2 whitespace-pre-wrap text-xs">
{sdStatus?.setup_instructions || `1. Install Stable Diffusion WebUI
2. Run with: python launch.py --api
3. Default URL: http://localhost:7860`}
                    </pre>
                  </details>
                </div>
              )}
            </div>

            {/* Right: Output */}
            <div className="space-y-4">
              {/* Generated Image */}
              {generatedImageBase64 && (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Generated Image
                  </label>
                  <div className="bg-background border border-border rounded-xl p-2 overflow-hidden">
                    <img
                      src={`data:image/png;base64,${generatedImageBase64}`}
                      alt="Generated from story"
                      className="w-full h-auto rounded-lg"
                    />
                    <div className="flex gap-2 mt-2">
                      <a
                        href={`data:image/png;base64,${generatedImageBase64}`}
                        download={`story-image-${Date.now()}.png`}
                        className="flex-1 py-2 text-center text-sm bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors"
                      >
                        📥 Download
                      </a>
                      <button
                        onClick={saveToGallery}
                        disabled={savedToGallery || !generatedImagePath}
                        className={cn(
                          "flex-1 py-2 text-center text-sm rounded-lg transition-colors",
                          savedToGallery
                            ? "bg-green-600 text-white cursor-default"
                            : generatedImagePath
                            ? "bg-purple-600 hover:bg-purple-700 text-white"
                            : "bg-gray-600 text-gray-400 cursor-not-allowed"
                        )}
                      >
                        {savedToGallery ? '✓ Saved!' : '🖼️ Save to Gallery'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Generated Prompt */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-text-primary">
                    Generated Image Prompt
                  </label>
                  {generatedPrompt && (
                    <button
                      onClick={copyToClipboard}
                      className="text-sm text-accent hover:text-accent-hover flex items-center gap-1"
                    >
                      {copied ? (
                        <>✓ Copied!</>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy
                        </>
                      )}
                    </button>
                  )}
                </div>
                <div className={cn(
                  "bg-background border border-border rounded-xl p-4 overflow-y-auto",
                  generatedImageBase64 ? "h-40" : "h-64"
                )}>
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 mb-4">
                      {error}
                    </div>
                  )}
                  {generatedPrompt ? (
                    <p className="text-text-primary whitespace-pre-wrap leading-relaxed text-sm">
                      {generatedPrompt}
                    </p>
                  ) : (
                    <div className="h-full flex items-center justify-center text-text-tertiary text-center">
                      <div>
                        <p className="mb-2">Your image prompt will appear here</p>
                        <p className="text-xs">
                          {sdStatus?.available 
                            ? 'Image will be generated automatically' 
                            : 'Use it with DALL-E, Midjourney, Stable Diffusion, etc.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {generatedPrompt && !generatedImageBase64 && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-400 mb-2">💡 How to use this prompt</h4>
                  <ul className="text-xs text-text-secondary space-y-1">
                    <li>• Copy and paste into <strong>DALL-E</strong>, <strong>Midjourney</strong>, or <strong>Stable Diffusion</strong></li>
                    <li>• Adjust keywords for different results</li>
                    <li>• Add negative prompts if needed (e.g., "no text, no watermark")</li>
                  </ul>
                </div>
              )}
              
              {/* Save prompt for character consistency */}
              {generatedPrompt && imageType === 'character' && selectedCharacterId && (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <h4 className="text-sm font-medium text-green-400 mb-2">💾 Save for Consistency</h4>
                  <p className="text-xs text-text-secondary mb-3">
                    Save this prompt and seed to maintain consistent character appearance across images.
                  </p>
                  <button
                    onClick={saveCharacterSeed}
                    disabled={seed === -1}
                    className={cn(
                      "w-full py-2 rounded-lg text-sm font-medium transition-colors",
                      seed !== -1
                        ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                        : "bg-surface-hover text-text-tertiary cursor-not-allowed"
                    )}
                  >
                    {seed !== -1 ? `💾 Save Seed (${seed}) & Prompt` : 'Generate with a seed first'}
                  </button>
                </div>
              )}

              {/* Seed info when generating images */}
              {generatedImageBase64 && seed !== -1 && (
                <div className="p-3 bg-surface-hover rounded-lg text-xs text-text-secondary flex items-center justify-between">
                  <span>Seed used: <strong className="text-text-primary">{seed}</strong></span>
                  {selectedCharacterId && (
                    <button
                      onClick={saveCharacterSeed}
                      className="text-accent hover:text-accent-hover"
                    >
                      Save to character
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
