'use client';

import { useState } from 'react';
import { api, StoryBranch } from '@/lib/api';
import { cn } from '@/lib/utils';

interface BranchingChoicesProps {
  storyId: string;
  chapterId: string;
  onBranchSelected: (preview: string) => void;
  onClose: () => void;
}

export function BranchingChoices({ storyId, chapterId, onBranchSelected, onClose }: BranchingChoicesProps) {
  const [branches, setBranches] = useState<StoryBranch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<StoryBranch | null>(null);
  const [numBranches, setNumBranches] = useState(3);
  const [wordTarget, setWordTarget] = useState(150);

  const generateBranches = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.generateBranches({
        story_id: storyId,
        chapter_id: chapterId,
        num_branches: numBranches,
        word_target: wordTarget,
        writing_mode: 'co_author',
      });
      console.log('Branch generation response:', response);
      console.log('Number of branches received:', response.branches?.length || 0);
      
      // Debug: Log each branch
      if (response.branches) {
        response.branches.forEach((branch: any, idx: number) => {
          console.log(`Branch ${idx + 1}:`, {
            id: branch.id,
            title: branch.title,
            description: branch.description?.substring(0, 50),
            tone: branch.tone,
            previewLength: branch.preview?.length
          });
        });
      }
      
      if (!response.branches || response.branches.length === 0) {
        setError('No branches were generated. Please try again.');
        setBranches([]);
      } else {
        setBranches(response.branches);
      }
    } catch (err) {
      console.error('Branch generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate branches');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBranch = async (branch: StoryBranch) => {
    setSelectedBranch(branch);
    try {
      await api.selectBranch(storyId, chapterId, branch.preview);
      onBranchSelected(branch.preview);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select branch');
    }
  };

  const toneColors: Record<string, string> = {
    tense: 'bg-red-500/20 text-red-400 border-red-500/50',
    action: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
    romantic: 'bg-pink-500/20 text-pink-400 border-pink-500/50',
    mysterious: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
    emotional: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    dark: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
    hopeful: 'bg-green-500/20 text-green-400 border-green-500/50',
    default: 'bg-accent/20 text-accent border-accent/50',
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-display font-semibold text-text-primary">
                🔀 Choose Your Path
              </h2>
              <p className="text-sm text-text-secondary mt-1">
                Generate multiple story directions and choose which path to follow
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
          {branches.length === 0 && !loading && (
            <div className="text-center py-8">
              <div className="mb-6 space-y-4">
                <div className="inline-flex items-center gap-2">
                  <label className="text-sm text-text-secondary">Number of paths:</label>
                  <select
                    value={numBranches}
                    onChange={(e) => setNumBranches(Number(e.target.value))}
                    className="bg-background border border-border rounded-lg px-3 py-1.5 text-text-primary"
                  >
                    <option value={2}>2 paths</option>
                    <option value={3}>3 paths</option>
                    <option value={4}>4 paths</option>
                    <option value={5}>5 paths</option>
                  </select>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <label className="text-sm text-text-secondary">Preview length: {wordTarget} words</label>
                  <input
                    type="range"
                    min="50"
                    max="400"
                    step="50"
                    value={wordTarget}
                    onChange={(e) => setWordTarget(Number(e.target.value))}
                    className="w-64 accent-accent"
                  />
                  <div className="flex justify-between w-64 text-xs text-text-secondary">
                    <span>50 (Quick)</span>
                    <span>225</span>
                    <span>400 (Detailed)</span>
                  </div>
                </div>
              </div>
              <button
                onClick={generateBranches}
                className="px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-lg font-medium transition-colors"
              >
                Generate Story Paths
              </button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-accent border-t-transparent mb-4" />
              <p className="text-text-secondary">Generating story branches...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 mb-4">
              {error}
            </div>
          )}

          {branches.length > 0 && (
            <div className="grid gap-4">
              {branches.map((branch, index) => (
                <div
                  key={branch.id || index}
                  className={cn(
                    "border rounded-xl p-5 cursor-pointer transition-all hover:border-accent/50 hover:shadow-lg",
                    selectedBranch?.id === branch.id
                      ? "border-accent bg-accent/5"
                      : "border-border bg-background/50"
                  )}
                  onClick={() => handleSelectBranch(branch)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                      <span className="text-accent">#{index + 1}</span>
                      {branch.title}
                    </h3>
                    <span className={cn(
                      "px-2 py-1 text-xs rounded-full border",
                      toneColors[branch.tone?.toLowerCase()] || toneColors.default
                    )}>
                      {branch.tone || 'balanced'}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary mb-3">{branch.description}</p>
                  <div className="bg-surface rounded-lg p-4">
                    <p className="text-sm text-text-primary italic leading-relaxed">
                      "{branch.preview}"
                    </p>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      className="px-4 py-2 bg-accent/10 hover:bg-accent hover:text-white text-accent rounded-lg text-sm font-medium transition-colors"
                    >
                      Choose This Path →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {branches.length > 0 && (
          <div className="p-4 border-t border-border flex justify-between items-center">
            <button
              onClick={generateBranches}
              className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              🔄 Regenerate Paths
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-lg hover:bg-surface-hover transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
