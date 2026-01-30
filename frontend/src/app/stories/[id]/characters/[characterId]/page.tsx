'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore, useUIStore, type Character, type Chapter, type Plotline } from '@/lib/store';
import { Sidebar, TopBar } from '@/components/layout';
import { Button, Input } from '@/components/ui';
import { StoryToImage } from '@/components/features';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Image as ImageIcon, 
  User,
  Sparkles,
  Edit3,
  X
} from 'lucide-react';

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

export default function CharacterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;
  const characterId = params.characterId as string;

  const { isAuthenticated } = useAuthStore();
  const { sidebarOpen } = useUIStore();

  const [character, setCharacter] = useState<Character | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [plotlines, setPlotlines] = useState<Plotline[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showImageGenerator, setShowImageGenerator] = useState(false);
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
    loadData();
  }, [storyId, characterId, isAuthenticated]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [characterData, chaptersData, charactersData, plotlinesData] = await Promise.all([
        api.getCharacter(characterId),
        api.getChapters(storyId),
        api.getCharacters(storyId),
        api.getPlotlines(storyId),
      ]);
      
      setCharacter(characterData);
      setChapters(chaptersData);
      setCharacters(charactersData);
      setPlotlines(plotlinesData);
      
      // Populate form data, mapping backend fields to form fields
      setFormData({
        name: characterData.name || '',
        role: characterData.role || 'supporting',
        physical_description: characterData.physical_description || '',
        personality_traits: characterData.personality_traits || [],
        backstory: characterData.backstory || '',
        goals: characterData.motivation ? characterData.motivation.split(';').map((g: string) => g.trim()).filter(Boolean) : [],
        relationships: characterData.relationships || '',
        voice_style: characterData.speaking_style || '', // Map speaking_style to voice_style
        age: characterData.age || '',
        gender: characterData.gender || '',
        distinguishing_features: characterData.distinguishing_features || [],
      });
    } catch (err) {
      console.error('Failed to load character:', err);
      setError('Failed to load character details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!character) return;
    
    try {
      setSaving(true);
      
      // Map form fields to backend fields
      const updateData = {
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
      };
      
      const updatedCharacter = await api.updateCharacter(characterId, updateData);
      setCharacter(updatedCharacter);
      setEditing(false);
    } catch (err) {
      console.error('Failed to save character:', err);
      setError('Failed to save character');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this character? This action cannot be undone.')) {
      return;
    }
    
    try {
      await api.deleteCharacter(characterId);
      router.push(`/stories/${storyId}`);
    } catch (err) {
      console.error('Failed to delete character:', err);
      setError('Failed to delete character');
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

  if (error || !character) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Character not found'}</p>
          <Button onClick={() => router.push(`/stories/${storyId}`)}>
            Back to Story
          </Button>
        </div>
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
                  <h1 className="text-2xl font-bold text-text-primary">{character.name}</h1>
                  <p className="text-sm text-text-secondary capitalize">{character.role.replace('_', ' ')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowImageGenerator(true)}
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Generate Portrait
                </Button>
                {editing ? (
                  <>
                    <Button variant="ghost" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="secondary" onClick={() => setEditing(true)}>
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="ghost" className="text-red-500 hover:text-red-600" onClick={handleDelete}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

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
                
                {editing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
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
                          placeholder="e.g., 25, young adult, elderly"
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
                ) : (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-text-tertiary">Role:</span>
                      <span className="ml-2 text-text-primary capitalize">{character.role.replace('_', ' ')}</span>
                    </div>
                    <div>
                      <span className="text-text-tertiary">Age:</span>
                      <span className="ml-2 text-text-primary">{character.age || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="text-text-tertiary">Gender:</span>
                      <span className="ml-2 text-text-primary">{character.gender || 'Not specified'}</span>
                    </div>
                  </div>
                )}
              </section>

              {/* Physical Description */}
              <section className="bg-surface rounded-xl p-6 border border-surface-border">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Physical Description</h2>
                {editing ? (
                  <textarea
                    value={formData.physical_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, physical_description: e.target.value }))}
                    placeholder="Describe the character's appearance..."
                    className="w-full h-32 px-3 py-2 bg-background border border-surface-border rounded-lg text-text-primary resize-none"
                  />
                ) : (
                  <p className="text-text-secondary whitespace-pre-wrap">
                    {character.physical_description || 'No physical description provided.'}
                  </p>
                )}
              </section>

              {/* Backstory */}
              <section className="bg-surface rounded-xl p-6 border border-surface-border">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Backstory</h2>
                {editing ? (
                  <textarea
                    value={formData.backstory}
                    onChange={(e) => setFormData(prev => ({ ...prev, backstory: e.target.value }))}
                    placeholder="Character's history and background..."
                    className="w-full h-48 px-3 py-2 bg-background border border-surface-border rounded-lg text-text-primary resize-none"
                  />
                ) : (
                  <p className="text-text-secondary whitespace-pre-wrap">
                    {character.backstory || 'No backstory provided.'}
                  </p>
                )}
              </section>

              {/* Relationships */}
              <section className="bg-surface rounded-xl p-6 border border-surface-border">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Relationships</h2>
                {editing ? (
                  <textarea
                    value={formData.relationships}
                    onChange={(e) => setFormData(prev => ({ ...prev, relationships: e.target.value }))}
                    placeholder="Describe relationships with other characters..."
                    className="w-full h-32 px-3 py-2 bg-background border border-surface-border rounded-lg text-text-primary resize-none"
                  />
                ) : (
                  <p className="text-text-secondary whitespace-pre-wrap">
                    {character.relationships || 'No relationships defined.'}
                  </p>
                )}
              </section>

              {/* Voice Style */}
              <section className="bg-surface rounded-xl p-6 border border-surface-border">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Voice & Speech Style</h2>
                {editing ? (
                  <textarea
                    value={formData.voice_style}
                    onChange={(e) => setFormData(prev => ({ ...prev, voice_style: e.target.value }))}
                    placeholder="How does this character speak? Any catchphrases, accents, or speech patterns?"
                    className="w-full h-24 px-3 py-2 bg-background border border-surface-border rounded-lg text-text-primary resize-none"
                  />
                ) : (
                  <p className="text-text-secondary whitespace-pre-wrap">
                    {character.voice_style || 'No voice style defined.'}
                  </p>
                )}
              </section>
            </div>

            {/* Right Column - Lists */}
            <div className="space-y-6">
              {/* Personality Traits */}
              <section className="bg-surface rounded-xl p-6 border border-surface-border">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Personality Traits</h2>
                {editing && (
                  <div className="flex gap-2 mb-3">
                    <Input
                      value={newTrait}
                      onChange={(e) => setNewTrait(e.target.value)}
                      placeholder="Add trait..."
                      onKeyPress={(e) => e.key === 'Enter' && addTrait()}
                    />
                    <Button size="sm" onClick={addTrait}>Add</Button>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {formData.personality_traits.length > 0 ? (
                    formData.personality_traits.map((trait, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm flex items-center gap-1"
                      >
                        {trait}
                        {editing && (
                          <button onClick={() => removeTrait(index)} className="hover:text-red-500">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    ))
                  ) : (
                    <p className="text-text-tertiary text-sm">No personality traits defined.</p>
                  )}
                </div>
              </section>

              {/* Goals */}
              <section className="bg-surface rounded-xl p-6 border border-surface-border">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Goals & Motivations</h2>
                {editing && (
                  <div className="flex gap-2 mb-3">
                    <Input
                      value={newGoal}
                      onChange={(e) => setNewGoal(e.target.value)}
                      placeholder="Add goal..."
                      onKeyPress={(e) => e.key === 'Enter' && addGoal()}
                    />
                    <Button size="sm" onClick={addGoal}>Add</Button>
                  </div>
                )}
                <ul className="space-y-2">
                  {formData.goals.length > 0 ? (
                    formData.goals.map((goal, index) => (
                      <li key={index} className="flex items-start gap-2 text-text-secondary text-sm">
                        <Sparkles className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                        <span className="flex-1">{goal}</span>
                        {editing && (
                          <button onClick={() => removeGoal(index)} className="text-red-500 hover:text-red-600">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </li>
                    ))
                  ) : (
                    <p className="text-text-tertiary text-sm">No goals defined.</p>
                  )}
                </ul>
              </section>

              {/* Distinguishing Features */}
              <section className="bg-surface rounded-xl p-6 border border-surface-border">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Distinguishing Features</h2>
                {editing && (
                  <div className="flex gap-2 mb-3">
                    <Input
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      placeholder="Add feature..."
                      onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                    />
                    <Button size="sm" onClick={addFeature}>Add</Button>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {formData.distinguishing_features.length > 0 ? (
                    formData.distinguishing_features.map((feature, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full text-sm flex items-center gap-1"
                      >
                        {feature}
                        {editing && (
                          <button onClick={() => removeFeature(index)} className="hover:text-red-500">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    ))
                  ) : (
                    <p className="text-text-tertiary text-sm">No distinguishing features defined.</p>
                  )}
                </div>
              </section>

              {/* Image Generation Info */}
              {character.image_generation_seed && (
                <section className="bg-surface rounded-xl p-6 border border-surface-border">
                  <h2 className="text-lg font-semibold text-text-primary mb-4">Image Generation</h2>
                  <div className="text-sm space-y-2">
                    <div>
                      <span className="text-text-tertiary">Saved Seed:</span>
                      <span className="ml-2 text-text-primary font-mono">{character.image_generation_seed}</span>
                    </div>
                    {character.visual_style && (
                      <div>
                        <span className="text-text-tertiary">Style:</span>
                        <span className="ml-2 text-text-primary capitalize">{character.visual_style}</span>
                      </div>
                    )}
                    <p className="text-xs text-text-tertiary mt-2">
                      Using the same seed will generate consistent portraits for this character.
                    </p>
                  </div>
                </section>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Image Generator Modal */}
      {showImageGenerator && (
        <StoryToImage
          storyId={storyId}
          characterId={characterId}
          onClose={() => setShowImageGenerator(false)}
        />
      )}
    </div>
  );
}
