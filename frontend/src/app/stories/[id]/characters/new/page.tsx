'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore, useUIStore, type Chapter, type Character, type Plotline } from '@/lib/store';
import { Sidebar } from '@/components/layout';
import { Button, Input } from '@/components/ui';
import { cn } from '@/lib/utils';
import { ArrowLeft, Save, Plus, X, User, Sparkles } from 'lucide-react';

interface CharacterFormData {
  name: string;
  role: string;
  physical_description: string;
  personality_traits: string[];
  backstory: string;
  goals: string[];
  relationships: string;
  voice_style: string;
  age: string;
  gender: string;
  distinguishing_features: string[];
}

const ROLES = [
  { value: 'protagonist', label: 'Protagonist' },
  { value: 'antagonist', label: 'Antagonist' },
  { value: 'supporting', label: 'Supporting' },
  { value: 'minor', label: 'Minor' },
  { value: 'mentor', label: 'Mentor' },
  { value: 'love_interest', label: 'Love Interest' },
];

export default function NewCharacterPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;

  const { isAuthenticated } = useAuthStore();
  const { sidebarOpen } = useUIStore();

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [plotlines, setPlotlines] = useState<Plotline[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CharacterFormData>({
    name: '',
    role: 'supporting',
    physical_description: '',
    personality_traits: [],
    backstory: '',
    goals: [],
    relationships: '',
    voice_style: '',
    age: '',
    gender: '',
    distinguishing_features: [],
  });

  // Temp inputs for array fields
  const [newTrait, setNewTrait] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    loadSidebarData();
  }, [storyId, isAuthenticated]);

  const loadSidebarData = async () => {
    try {
      setLoading(true);
      const [chaptersData, charactersData, plotlinesData] = await Promise.all([
        api.getChapters(storyId),
        api.getCharacters(storyId),
        api.getPlotlines(storyId),
      ]);
      setChapters(chaptersData);
      setCharacters(charactersData);
      setPlotlines(plotlinesData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Character name is required');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      // Map form fields to backend fields
      const characterData = {
        name: formData.name,
        role: formData.role,
        age: formData.age,
        gender: formData.gender,
        physical_description: formData.physical_description,
        personality_traits: formData.personality_traits,
        backstory: formData.backstory,
        speaking_style: formData.voice_style, // Map voice_style to speaking_style
        motivation: formData.goals.join('; '), // Map goals array to motivation string
        distinguishing_features: formData.distinguishing_features,
        // Store relationships as text in personality_summary or custom fields
        personality_summary: formData.relationships ? `Relationships: ${formData.relationships}` : undefined,
      };
      
      const newCharacter = await api.createCharacter(storyId, characterData);
      router.push(`/stories/${storyId}/characters/${newCharacter.id}`);
    } catch (err: any) {
      console.error('Failed to create character:', err);
      setError(err?.response?.data?.detail || 'Failed to create character');
    } finally {
      setSaving(false);
    }
  };

  const addTrait = () => {
    if (newTrait.trim()) {
      setFormData(prev => ({
        ...prev,
        personality_traits: [...prev.personality_traits, newTrait.trim()]
      }));
      setNewTrait('');
    }
  };

  const removeTrait = (index: number) => {
    setFormData(prev => ({
      ...prev,
      personality_traits: prev.personality_traits.filter((_, i) => i !== index)
    }));
  };

  const addGoal = () => {
    if (newGoal.trim()) {
      setFormData(prev => ({
        ...prev,
        goals: [...prev.goals, newGoal.trim()]
      }));
      setNewGoal('');
    }
  };

  const removeGoal = (index: number) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.filter((_, i) => i !== index)
    }));
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData(prev => ({
        ...prev,
        distinguishing_features: [...prev.distinguishing_features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      distinguishing_features: prev.distinguishing_features.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        storyId={storyId}
        chapters={chapters}
        characters={characters}
        plotlines={plotlines}
      />

      <div className={cn(
        'transition-all duration-300',
        sidebarOpen ? 'ml-sidebar' : 'ml-0'
      )}>
        {/* Header */}
        <div className="sticky top-0 z-30 bg-background border-b border-surface-border">
          <div className="max-w-4xl mx-auto px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href={`/stories/${storyId}`}>
                  <Button variant="ghost" size="icon">
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-text-primary">New Character</h1>
                  <p className="text-sm text-text-secondary">Create a new character for your story</p>
                </div>
              </div>
              <Button onClick={handleSave} disabled={saving || !formData.name.trim()}>
                <Plus className="w-4 h-4 mr-2" />
                {saving ? 'Creating...' : 'Create Character'}
              </Button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="max-w-4xl mx-auto px-8 pt-4">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-500 text-sm">
              {error}
            </div>
          </div>
        )}

        {/* Content */}
        <main className="max-w-4xl mx-auto px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <section className="bg-surface rounded-xl p-6 border border-surface-border">
                <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-accent" />
                  Basic Information
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Character name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Role</label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                        className="w-full px-3 py-2 bg-background border border-surface-border rounded-lg text-text-primary"
                      >
                        {ROLES.map(role => (
                          <option key={role.value} value={role.value}>{role.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Age</label>
                      <Input
                        value={formData.age}
                        onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                        placeholder="e.g., 25, young adult"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Gender</label>
                    <Input
                      value={formData.gender}
                      onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                      placeholder="e.g., Male, Female, Non-binary"
                    />
                  </div>
                </div>
              </section>

              {/* Physical Description */}
              <section className="bg-surface rounded-xl p-6 border border-surface-border">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Physical Description</h2>
                <textarea
                  value={formData.physical_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, physical_description: e.target.value }))}
                  placeholder="Describe the character's appearance: height, build, hair color, eye color, clothing style..."
                  className="w-full h-32 px-3 py-2 bg-background border border-surface-border rounded-lg text-text-primary resize-none"
                />
              </section>

              {/* Backstory */}
              <section className="bg-surface rounded-xl p-6 border border-surface-border">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Backstory</h2>
                <textarea
                  value={formData.backstory}
                  onChange={(e) => setFormData(prev => ({ ...prev, backstory: e.target.value }))}
                  placeholder="Character's history and background: where they grew up, significant events, formative experiences..."
                  className="w-full h-48 px-3 py-2 bg-background border border-surface-border rounded-lg text-text-primary resize-none"
                />
              </section>

              {/* Relationships */}
              <section className="bg-surface rounded-xl p-6 border border-surface-border">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Relationships</h2>
                <textarea
                  value={formData.relationships}
                  onChange={(e) => setFormData(prev => ({ ...prev, relationships: e.target.value }))}
                  placeholder="Describe relationships with other characters: family, friends, enemies, romantic interests..."
                  className="w-full h-32 px-3 py-2 bg-background border border-surface-border rounded-lg text-text-primary resize-none"
                />
              </section>

              {/* Voice Style */}
              <section className="bg-surface rounded-xl p-6 border border-surface-border">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Voice & Speech Style</h2>
                <textarea
                  value={formData.voice_style}
                  onChange={(e) => setFormData(prev => ({ ...prev, voice_style: e.target.value }))}
                  placeholder="How does this character speak? Any catchphrases, accents, speech patterns, vocabulary preferences..."
                  className="w-full h-24 px-3 py-2 bg-background border border-surface-border rounded-lg text-text-primary resize-none"
                />
              </section>
            </div>

            {/* Right Column - Lists */}
            <div className="space-y-6">
              {/* Personality Traits */}
              <section className="bg-surface rounded-xl p-6 border border-surface-border">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Personality Traits</h2>
                <div className="flex gap-2 mb-3">
                  <Input
                    value={newTrait}
                    onChange={(e) => setNewTrait(e.target.value)}
                    placeholder="Add trait..."
                    onKeyPress={(e) => e.key === 'Enter' && addTrait()}
                  />
                  <Button size="sm" onClick={addTrait}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.personality_traits.map((trait, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm flex items-center gap-1"
                    >
                      {trait}
                      <button onClick={() => removeTrait(index)} className="hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {formData.personality_traits.length === 0 && (
                    <p className="text-text-tertiary text-sm">e.g., Brave, Curious, Stubborn</p>
                  )}
                </div>
              </section>

              {/* Goals */}
              <section className="bg-surface rounded-xl p-6 border border-surface-border">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Goals & Motivations</h2>
                <div className="flex gap-2 mb-3">
                  <Input
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    placeholder="Add goal..."
                    onKeyPress={(e) => e.key === 'Enter' && addGoal()}
                  />
                  <Button size="sm" onClick={addGoal}>Add</Button>
                </div>
                <ul className="space-y-2">
                  {formData.goals.map((goal, index) => (
                    <li key={index} className="flex items-start gap-2 text-text-secondary text-sm">
                      <Sparkles className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                      <span className="flex-1">{goal}</span>
                      <button onClick={() => removeGoal(index)} className="text-red-500 hover:text-red-600">
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                  {formData.goals.length === 0 && (
                    <p className="text-text-tertiary text-sm">What drives this character?</p>
                  )}
                </ul>
              </section>

              {/* Distinguishing Features */}
              <section className="bg-surface rounded-xl p-6 border border-surface-border">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Distinguishing Features</h2>
                <div className="flex gap-2 mb-3">
                  <Input
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    placeholder="Add feature..."
                    onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                  />
                  <Button size="sm" onClick={addFeature}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.distinguishing_features.map((feature, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full text-sm flex items-center gap-1"
                    >
                      {feature}
                      <button onClick={() => removeFeature(index)} className="hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {formData.distinguishing_features.length === 0 && (
                    <p className="text-text-tertiary text-sm">e.g., Scar on left cheek, Always wears blue</p>
                  )}
                </div>
              </section>

              {/* Tips */}
              <section className="bg-accent/5 rounded-xl p-6 border border-accent/20">
                <h2 className="text-lg font-semibold text-accent mb-3">💡 Tips</h2>
                <ul className="text-sm text-text-secondary space-y-2">
                  <li>• Physical descriptions help with consistent image generation</li>
                  <li>• Voice style helps the AI write authentic dialogue</li>
                  <li>• Add distinguishing features for visual consistency</li>
                  <li>• Goals drive character actions in AI-generated content</li>
                </ul>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
