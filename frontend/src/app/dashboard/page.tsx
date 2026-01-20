'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuthStore, type Story } from '@/lib/store';
import { formatRelativeTime, formatWordCount, cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import {
  Plus,
  BookOpen,
  Clock,
  FileText,
  Sparkles,
  Search,
  Grid,
  List,
  Trash2,
  MoreVertical,
  LogOut,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    loadStories();
  }, [isAuthenticated, router]);

  const loadStories = async () => {
    try {
      setLoading(true);
      const data = await api.getStories();
      setStories(data);
    } catch (error) {
      console.error('Failed to load stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStory = () => {
    router.push('/stories/new');
  };

  const handleDeleteStory = async (storyId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this story?')) {
      try {
        await api.deleteStory(storyId);
        setStories(stories.filter(s => s.id !== storyId));
      } catch (error) {
        console.error('Failed to delete story:', error);
      }
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const filteredStories = stories.filter(story =>
    story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    story.genre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background-secondary/80 backdrop-blur-xl border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-accent" />
            <span className="text-xl font-bold text-gradient">NarrativeFlow</span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-sm text-text-secondary">
              Welcome, <span className="text-text-primary">{user?.username}</span>
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-display text-text-primary mb-2">
              Your Stories
            </h1>
            <p className="text-text-secondary">
              {stories.length} {stories.length === 1 ? 'story' : 'stories'} in your library
            </p>
          </div>

          <Button onClick={handleCreateStory}>
            <Plus className="w-4 h-4 mr-2" />
            New Story
          </Button>
        </div>

        {/* Search and View Controls */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stories..."
              className="w-full bg-surface border border-surface-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-surface rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded transition-colors',
                viewMode === 'grid' ? 'bg-accent/20 text-accent' : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded transition-colors',
                viewMode === 'list' ? 'bg-accent/20 text-accent' : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stories Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent" />
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="text-center py-20">
            <Sparkles className="w-12 h-12 text-accent mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              {searchQuery ? 'No stories found' : 'No stories yet'}
            </h2>
            <p className="text-text-secondary mb-6">
              {searchQuery
                ? 'Try a different search term'
                : 'Create your first story and start writing with AI'}
            </p>
            {!searchQuery && (
              <Button onClick={handleCreateStory}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Story
              </Button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredStories.map((story) => (
              <motion.div key={story.id} variants={item}>
                <Link href={`/stories/${story.id}`}>
                  <div className="glass-card group hover:border-accent/50 transition-all duration-300 h-full">
                    {/* Card Header */}
                    <div className="p-5 pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-text-primary group-hover:text-accent transition-colors truncate">
                            {story.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-2 py-0.5 bg-accent/20 text-accent rounded capitalize">
                              {story.genre.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-text-tertiary capitalize">
                              {story.tone}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleDeleteStory(story.id, e)}
                          className="p-1 text-text-tertiary hover:text-danger transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Card Body */}
                    {story.synopsis && (
                      <div className="px-5 pb-3">
                        <p className="text-sm text-text-secondary line-clamp-2">
                          {story.synopsis}
                        </p>
                      </div>
                    )}

                    {/* Card Footer */}
                    <div className="px-5 py-3 border-t border-surface-border flex items-center justify-between text-xs text-text-tertiary">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" />
                          {formatWordCount(story.total_word_count)} words
                        </span>
                      </div>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatRelativeTime(story.updated_at)}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {filteredStories.map((story) => (
              <motion.div key={story.id} variants={item}>
                <Link href={`/stories/${story.id}`}>
                  <div className="glass-card group hover:border-accent/50 transition-all duration-300">
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <BookOpen className="w-8 h-8 text-accent flex-shrink-0" />
                        <div className="min-w-0">
                          <h3 className="font-semibold text-text-primary group-hover:text-accent transition-colors">
                            {story.title}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-text-secondary mt-0.5">
                            <span className="capitalize">{story.genre.replace('_', ' ')}</span>
                            <span>•</span>
                            <span>{formatWordCount(story.total_word_count)} words</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-text-tertiary">
                          {formatRelativeTime(story.updated_at)}
                        </span>
                        <button
                          onClick={(e) => handleDeleteStory(story.id, e)}
                          className="p-2 text-text-tertiary hover:text-danger transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}
