'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore, useUIStore, type Story, type StoryBibleData, type Chapter, type Character, type Plotline } from '@/lib/store';
import { Sidebar, TopBar } from '@/components/layout';
import { cn } from '@/lib/utils';
import { Book, Plus, Save, Trash2, Sparkles, RefreshCw } from 'lucide-react';
import { Button, Input } from '@/components/ui';

export default function StoryBiblePage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;

  const { isAuthenticated } = useAuthStore();
  const { sidebarOpen } = useUIStore();

  const [story, setStory] = useState<Story | null>(null);
  const [bible, setBible] = useState<StoryBibleData | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [plotlines, setPlotlines] = useState<Plotline[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'rules' | 'locations' | 'glossary'>('overview');

  // New item states
  const [newRule, setNewRule] = useState({ category: '', rule_text: '' });
  const [newLocation, setNewLocation] = useState({ name: '', description: '' });
  const [newGlossaryTerm, setNewGlossaryTerm] = useState({ term: '', definition: '' });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    loadData();
  }, [storyId, isAuthenticated]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [storyData, bibleData, chaptersData, charactersData, plotlinesData] = await Promise.all([
        api.getStory(storyId),
        api.getStoryBible(storyId),
        api.getChapters(storyId),
        api.getCharacters(storyId),
        api.getPlotlines(storyId),
      ]);
      setStory(storyData);
      setBible(bibleData);
      setChapters(chaptersData);
      setCharacters(charactersData);
      setPlotlines(plotlinesData);
    } catch (error) {
      console.error('Failed to load story bible:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!bible) return;
    try {
      setSaving(true);
      const savedBible = await api.updateStoryBible(storyId, {
        world_rules: bible.world_rules,
        key_locations: bible.key_locations,
        glossary: bible.glossary,
        themes: bible.themes,
        central_themes: bible.themes,  // Also send as central_themes for backend compatibility
      });
      setBible(savedBible);  // Update with saved data
      alert('Story Bible saved successfully!');
    } catch (error) {
      console.error('Failed to save story bible:', error);
      alert('Failed to save Story Bible. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const generatedBible = await api.generateStoryBible(storyId);
      setBible(generatedBible);
    } catch (error: any) {
      console.error('Failed to generate story bible:', error);
      const errorMessage = error?.response?.data?.detail || error?.message || 'Unknown error';
      if (errorMessage.includes('timeout') || errorMessage.includes('too long')) {
        alert('Generation took too long. The AI is processing your content - please try again in a moment.');
      } else if (errorMessage.includes('chapter content') || errorMessage.includes('not enough')) {
        alert('Please add some chapter content first before generating the Story Bible.');
      } else {
        alert(`Failed to generate Story Bible: ${errorMessage}`);
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdateFromContent = async () => {
    try {
      setGenerating(true);
      const result = await api.updateStoryBibleFromContent(storyId);
      
      // Reload the bible data after update
      const updatedBible = await api.getStoryBible(storyId);
      setBible(updatedBible);
      
      if (result.updated) {
        alert(`Story Bible updated! ${result.message}`);
      } else {
        alert(result.message || 'No new elements found to add.');
      }
    } catch (error) {
      console.error('Failed to update story bible from content:', error);
      alert('Failed to update story bible from content.');
    } finally {
      setGenerating(false);
    }
  };

  const handleAddRule = () => {
    if (!newRule.category || !newRule.rule_text) return;
    setBible(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        world_rules: [...(prev.world_rules || []), newRule],
      };
    });
    setNewRule({ category: '', rule_text: '' });
  };

  const handleRemoveRule = (index: number) => {
    setBible(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        world_rules: prev.world_rules?.filter((_, i) => i !== index) || [],
      };
    });
  };

  const handleAddLocation = () => {
    if (!newLocation.name || !newLocation.description) return;
    setBible(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        key_locations: [...(prev.key_locations || []), newLocation],
      };
    });
    setNewLocation({ name: '', description: '' });
  };

  const handleRemoveLocation = (index: number) => {
    setBible(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        key_locations: prev.key_locations?.filter((_, i) => i !== index) || [],
      };
    });
  };

  const handleAddGlossaryTerm = () => {
    if (!newGlossaryTerm.term || !newGlossaryTerm.definition) return;
    setBible(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        glossary: [...(prev.glossary || []), newGlossaryTerm],
      };
    });
    setNewGlossaryTerm({ term: '', definition: '' });
  };

  const handleRemoveGlossaryTerm = (index: number) => {
    setBible(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        glossary: prev.glossary?.filter((_, i) => i !== index) || [],
      };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!story || !bible) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-text-secondary">Failed to load story bible</p>
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
        onChapterCreated={(chapter) => setChapters([...chapters, chapter])}
        onCharactersExtracted={(newCharacters) => setCharacters(newCharacters)}
      />

      <div
        className={cn(
          'transition-all duration-300',
          sidebarOpen ? 'ml-sidebar' : 'ml-0'
        )}
      >
        <TopBar
          storyTitle={story.title}
          genre={story.genre}
          tone={story.tone}
          onSave={handleSave}
        />

        <main className="max-w-6xl mx-auto px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Book className="w-8 h-8 text-accent" />
              <div>
                <h1 className="text-3xl font-display font-bold text-text-primary">Story Bible</h1>
                <p className="text-text-secondary">Maintain consistency across your narrative</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleGenerate} 
                isLoading={generating}
                variant="secondary"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {generating ? 'Generating...' : 'Generate from Story'}
              </Button>
              <Button 
                onClick={handleUpdateFromContent} 
                isLoading={generating}
                variant="secondary"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Update from Content
              </Button>
              <Button onClick={handleSave} isLoading={saving}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-surface-border mb-6">
            {[
              { id: 'overview' as const, label: 'Overview' },
              { id: 'rules' as const, label: 'World Rules' },
              { id: 'locations' as const, label: 'Key Locations' },
              { id: 'glossary' as const, label: 'Glossary' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-6 py-3 text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'text-accent border-b-2 border-accent'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Show generate prompt if bible is mostly empty */}
                {(!bible.world_rules?.length && !bible.key_locations?.length && !bible.glossary?.length) && (
                  <div className="bg-gradient-to-r from-accent/10 to-purple-500/10 rounded-lg p-6 border border-accent/30">
                    <div className="flex items-start gap-4">
                      <Sparkles className="w-8 h-8 text-accent flex-shrink-0 mt-1" />
                      <div>
                        <h2 className="text-lg font-semibold text-text-primary mb-2">Generate Your Story Bible</h2>
                        <p className="text-text-secondary mb-4">
                          Your Story Bible is empty! Click "Generate from Story" above to automatically extract world-building details 
                          from your chapter content. The AI will identify locations, rules, terminology, and more.
                        </p>
                        <Button onClick={handleGenerate} isLoading={generating}>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Story Bible Now
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-background-secondary rounded-lg p-6 border border-surface-border">
                  <h2 className="text-lg font-semibold text-text-primary mb-4">About Story Bible</h2>
                  <p className="text-text-secondary mb-4">
                    The Story Bible is your narrative consistency engine. It automatically tracks and maintains:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-text-secondary">
                    <li>World rules and magic system constraints</li>
                    <li>Key locations and their descriptions</li>
                    <li>Terminology and glossary terms</li>
                    <li>Character relationships and development</li>
                  </ul>
                  <p className="text-text-secondary mt-4">
                    The AI uses this information to maintain consistency across your story. Click "Generate from Story" to auto-populate, 
                    or add your world-building details manually!
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-background-secondary rounded-lg p-4 border border-surface-border">
                    <div className="text-2xl font-bold text-accent mb-1">{bible.world_rules?.length || 0}</div>
                    <div className="text-sm text-text-secondary">World Rules</div>
                  </div>
                  <div className="bg-background-secondary rounded-lg p-4 border border-surface-border">
                    <div className="text-2xl font-bold text-accent mb-1">{bible.key_locations?.length || 0}</div>
                    <div className="text-sm text-text-secondary">Key Locations</div>
                  </div>
                  <div className="bg-background-secondary rounded-lg p-4 border border-surface-border">
                    <div className="text-2xl font-bold text-accent mb-1">{bible.glossary?.length || 0}</div>
                    <div className="text-sm text-text-secondary">Glossary Terms</div>
                  </div>
                </div>
              </div>
            )}

            {/* World Rules Tab */}
            {activeTab === 'rules' && (
              <div className="space-y-6">
                <div className="bg-background-secondary rounded-lg p-6 border border-surface-border">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Add World Rule</h3>
                  <div className="space-y-3">
                    <Input
                      placeholder="Category (e.g., Magic, Physics, Society)"
                      value={newRule.category}
                      onChange={(e) => setNewRule({ ...newRule, category: e.target.value })}
                    />
                    <textarea
                      placeholder="Rule description..."
                      value={newRule.rule_text}
                      onChange={(e) => setNewRule({ ...newRule, rule_text: e.target.value })}
                      className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-accent/50"
                    />
                    <Button onClick={handleAddRule}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Rule
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {bible.world_rules?.map((rule, index) => (
                    <div key={index} className="bg-background-secondary rounded-lg p-4 border border-surface-border">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-accent mb-1">{rule.category}</div>
                          <div className="text-sm text-text-secondary">{rule.rule_text}</div>
                        </div>
                        <button
                          onClick={() => handleRemoveRule(index)}
                          className="text-text-tertiary hover:text-red-500 transition-colors ml-4"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!bible.world_rules || bible.world_rules.length === 0) && (
                    <p className="text-center text-text-tertiary py-8">No world rules yet. Add your first rule above!</p>
                  )}
                </div>
              </div>
            )}

            {/* Key Locations Tab */}
            {activeTab === 'locations' && (
              <div className="space-y-6">
                <div className="bg-background-secondary rounded-lg p-6 border border-surface-border">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Add Key Location</h3>
                  <div className="space-y-3">
                    <Input
                      placeholder="Location name"
                      value={newLocation.name}
                      onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                    />
                    <textarea
                      placeholder="Location description..."
                      value={newLocation.description}
                      onChange={(e) => setNewLocation({ ...newLocation, description: e.target.value })}
                      className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-accent/50"
                    />
                    <Button onClick={handleAddLocation}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Location
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {bible.key_locations?.map((location, index) => (
                    <div key={index} className="bg-background-secondary rounded-lg p-4 border border-surface-border">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-accent mb-1">{location.name}</div>
                          <div className="text-sm text-text-secondary">{location.description}</div>
                        </div>
                        <button
                          onClick={() => handleRemoveLocation(index)}
                          className="text-text-tertiary hover:text-red-500 transition-colors ml-4"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!bible.key_locations || bible.key_locations.length === 0) && (
                    <p className="text-center text-text-tertiary py-8">No locations yet. Add your first location above!</p>
                  )}
                </div>
              </div>
            )}

            {/* Glossary Tab */}
            {activeTab === 'glossary' && (
              <div className="space-y-6">
                <div className="bg-background-secondary rounded-lg p-6 border border-surface-border">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Add Glossary Term</h3>
                  <div className="space-y-3">
                    <Input
                      placeholder="Term"
                      value={newGlossaryTerm.term}
                      onChange={(e) => setNewGlossaryTerm({ ...newGlossaryTerm, term: e.target.value })}
                    />
                    <textarea
                      placeholder="Definition..."
                      value={newGlossaryTerm.definition}
                      onChange={(e) => setNewGlossaryTerm({ ...newGlossaryTerm, definition: e.target.value })}
                      className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-accent/50"
                    />
                    <Button onClick={handleAddGlossaryTerm}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Term
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {bible.glossary?.map((term, index) => (
                    <div key={index} className="bg-background-secondary rounded-lg p-4 border border-surface-border">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-accent mb-1">{term.term}</div>
                          <div className="text-sm text-text-secondary">{term.definition}</div>
                        </div>
                        <button
                          onClick={() => handleRemoveGlossaryTerm(index)}
                          className="text-text-tertiary hover:text-red-500 transition-colors ml-4"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!bible.glossary || bible.glossary.length === 0) && (
                    <p className="text-center text-text-tertiary py-8">No glossary terms yet. Add your first term above!</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
