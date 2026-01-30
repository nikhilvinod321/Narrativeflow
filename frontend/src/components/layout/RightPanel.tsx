'use client';

import { cn } from '@/lib/utils';
import { useUIStore, useEditorStore } from '@/lib/store';
import { Button } from '@/components/ui';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  FileText,
  AlertTriangle,
  Settings,
  Wand2,
  MessageSquare,
  RefreshCw,
  Lightbulb,
  GitBranch,
  Image,
  Volume2,
} from 'lucide-react';
import { useState } from 'react';

interface RightPanelProps {
  onGenerate?: (direction?: string) => void;
  onRewrite?: (text: string, instructions: string) => void;
  onRecap?: () => void;
  onConsistencyCheck?: () => void;
  onBranching?: () => void;
  onStoryToImage?: () => void;
  onImageToStory?: () => void;
  onTTS?: () => void;
}

export function RightPanel({
  onGenerate,
  onRewrite,
  onRecap,
  onConsistencyCheck,
  onBranching,
  onStoryToImage,
  onImageToStory,
  onTTS,
}: RightPanelProps) {
  const { rightPanelOpen, toggleRightPanel, rightPanelTab, setRightPanelTab } = useUIStore();
  const { isGenerating } = useEditorStore();
  const [direction, setDirection] = useState('');
  const [wordTarget, setWordTarget] = useState(500);

  const tabs = [
    { id: 'ai' as const, label: 'AI Tools', icon: Sparkles },
    { id: 'recap' as const, label: 'Recap', icon: FileText },
    { id: 'consistency' as const, label: 'Check', icon: AlertTriangle },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  const aiFeatures = [
    {
      id: 'branching',
      label: 'Story Branching',
      icon: GitBranch,
      color: 'text-purple-500',
      description: 'Explore multiple story paths',
      onClick: onBranching,
    },
    {
      id: 'story-to-image',
      label: 'Story to Image',
      icon: Image,
      color: 'text-pink-500',
      description: 'Generate art from text',
      onClick: onStoryToImage,
    },
    {
      id: 'image-to-story',
      label: 'Image to Story',
      icon: Sparkles,
      color: 'text-cyan-500',
      description: 'Generate text from images',
      onClick: onImageToStory,
    },
    {
      id: 'tts',
      label: 'Read Aloud',
      icon: Volume2,
      color: 'text-amber-500',
      description: 'Text-to-speech',
      onClick: onTTS,
    },
  ];

  return (
    <>
      {/* Panel */}
      <aside
        className={cn(
          'fixed right-0 top-0 h-full bg-background-secondary border-l border-surface-border z-40',
          'transition-all duration-300 ease-in-out',
          rightPanelOpen ? 'w-panel' : 'w-0 translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Tabs */}
          <div className="flex border-b border-surface-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setRightPanelTab(tab.id)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm transition-colors',
                  rightPanelTab === tab.id
                    ? 'text-accent border-b-2 border-accent bg-accent/5'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden lg:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* AI Tools Tab */}
            {rightPanelTab === 'ai' && (
              <div className="space-y-6">
                {/* AI Features */}
                <div>
                  <h3 className="text-sm font-semibold text-text-secondary mb-3">AI Features</h3>
                  <div className="space-y-2">
                    {aiFeatures.map((feature) => (
                      <button
                        key={feature.id}
                        onClick={feature.onClick}
                        className="w-full flex items-center gap-3 p-3 rounded-lg border border-surface-border hover:border-accent/50 hover:bg-surface-hover transition-all"
                      >
                        <feature.icon className={cn('w-5 h-5', feature.color)} />
                        <div className="text-left">
                          <div className="font-medium text-sm">{feature.label}</div>
                          <div className="text-xs text-text-tertiary">{feature.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generation Controls */}
                <div>
                  <h3 className="text-sm font-semibold text-text-secondary mb-3">Generate</h3>
                  
                  <div className="space-y-3">
                    <textarea
                      value={direction}
                      onChange={(e) => setDirection(e.target.value)}
                      placeholder="Optional: Give direction for the AI..."
                      className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-accent/50"
                    />
                    
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-text-secondary">Words:</label>
                      <input
                        type="number"
                        value={wordTarget}
                        onChange={(e) => setWordTarget(Number(e.target.value))}
                        min={50}
                        max={3000}
                        step={50}
                        className="w-20 bg-background border border-surface-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                      />
                    </div>
                    
                    <Button
                      onClick={() => onGenerate?.(direction)}
                      className="w-full"
                      isLoading={isGenerating}
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                      Generate Continuation
                    </Button>
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <h3 className="text-sm font-semibold text-text-secondary mb-3">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="secondary" size="sm" className="justify-start">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Dialogue
                    </Button>
                    <Button variant="secondary" size="sm" className="justify-start">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Rewrite
                    </Button>
                    <Button variant="secondary" size="sm" className="justify-start">
                      <Lightbulb className="w-4 h-4 mr-2" />
                      Brainstorm
                    </Button>
                    <Button variant="secondary" size="sm" className="justify-start">
                      <FileText className="w-4 h-4 mr-2" />
                      Summarize
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Recap Tab */}
            {rightPanelTab === 'recap' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-text-secondary mb-3">Story Recap</h3>
                  <p className="text-sm text-text-tertiary mb-4">
                    Generate a comprehensive recap of your story including what happened,
                    character states, and unresolved plot threads.
                  </p>
                  <Button onClick={onRecap} className="w-full">
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Recap
                  </Button>
                </div>
              </div>
            )}

            {/* Consistency Tab */}
            {rightPanelTab === 'consistency' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-text-secondary mb-3">Consistency Check</h3>
                  <p className="text-sm text-text-tertiary mb-4">
                    Analyze your content for character behavior drift, timeline issues,
                    POV problems, and world rule violations.
                  </p>
                  <Button onClick={onConsistencyCheck} className="w-full">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Check Consistency
                  </Button>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {rightPanelTab === 'settings' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-text-secondary mb-3">Editor Settings</h3>
                <p className="text-sm text-text-tertiary">
                  Editor settings coming soon...
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Toggle Button */}
      <button
        onClick={toggleRightPanel}
        className={cn(
          'fixed top-1/2 -translate-y-1/2 z-50 p-2 bg-surface border border-surface-border rounded-l-lg',
          'hover:bg-surface-hover transition-all duration-300',
          rightPanelOpen ? 'right-panel' : 'right-0'
        )}
      >
        {rightPanelOpen ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>
    </>
  );
}
