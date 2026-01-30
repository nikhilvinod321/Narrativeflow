'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, GeneratedImage } from '@/lib/api';
import { useAuthStore, useUIStore, type Chapter, type Character, type Plotline } from '@/lib/store';
import { Sidebar } from '@/components/layout';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { 
  ArrowLeft, 
  Image as ImageIcon, 
  Star, 
  Trash2, 
  Download, 
  Filter,
  Grid,
  List,
  Heart,
  User,
  Palette,
  Copy,
  X
} from 'lucide-react';

type FilterType = 'all' | 'character' | 'scene' | 'cover' | 'environment' | 'favorites';
type ViewMode = 'grid' | 'list';

export default function ImageGalleryPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;

  const { isAuthenticated } = useAuthStore();
  const { sidebarOpen } = useUIStore();

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [plotlines, setPlotlines] = useState<Plotline[]>([]);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    loadData();
  }, [storyId, isAuthenticated]);

  useEffect(() => {
    loadImages();
  }, [filter]);

  const loadData = async () => {
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
      await loadImages();
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadImages = async () => {
    try {
      const options: any = {};
      if (filter === 'favorites') {
        options.favoritesOnly = true;
      } else if (filter !== 'all') {
        options.imageType = filter;
      }
      const data = await api.getStoryImages(storyId, options);
      setImages(data);
    } catch (err) {
      console.error('Failed to load images:', err);
    }
  };

  const handleToggleFavorite = async (imageId: string) => {
    try {
      await api.toggleImageFavorite(imageId);
      setImages(images.map(img => 
        img.id === imageId ? { ...img, is_favorite: !img.is_favorite } : img
      ));
      if (selectedImage?.id === imageId) {
        setSelectedImage({ ...selectedImage, is_favorite: !selectedImage.is_favorite });
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;
    try {
      await api.deleteImage(imageId);
      setImages(images.filter(img => img.id !== imageId));
      if (selectedImage?.id === imageId) {
        setSelectedImage(null);
      }
    } catch (err) {
      console.error('Failed to delete image:', err);
    }
  };

  const handleDownload = (image: GeneratedImage) => {
    const link = document.createElement('a');
    link.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${image.file_path}`;
    link.download = image.file_name;
    link.click();
  };

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    alert('Prompt copied to clipboard!');
  };

  const getCharacterName = (characterId?: string) => {
    if (!characterId) return null;
    const char = characters.find(c => c.id === characterId);
    return char?.name || null;
  };

  const filterButtons: { value: FilterType; label: string; icon: React.ReactNode }[] = [
    { value: 'all', label: 'All', icon: <Grid className="w-4 h-4" /> },
    { value: 'character', label: 'Characters', icon: <User className="w-4 h-4" /> },
    { value: 'scene', label: 'Scenes', icon: <ImageIcon className="w-4 h-4" /> },
    { value: 'cover', label: 'Covers', icon: <Palette className="w-4 h-4" /> },
    { value: 'favorites', label: 'Favorites', icon: <Heart className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-accent border-t-transparent" />
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

      <div
        className={cn(
          'transition-all duration-300',
          sidebarOpen ? 'ml-sidebar' : 'ml-0'
        )}
      >
        {/* Header */}
        <div className="sticky top-0 z-30 bg-background border-b border-surface-border">
          <div className="max-w-7xl mx-auto px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href={`/stories/${storyId}`}>
                  <Button variant="ghost" size="icon">
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                    <ImageIcon className="w-6 h-6 text-accent" />
                    Image Gallery
                  </h1>
                  <p className="text-sm text-text-secondary">
                    {images.length} images generated for this story
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-surface rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      'p-2 rounded',
                      viewMode === 'grid' ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'
                    )}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      'p-2 rounded',
                      viewMode === 'list' ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'
                    )}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
                <Link href={`/stories/${storyId}`}>
                  <Button variant="secondary">
                    <Palette className="w-4 h-4 mr-2" />
                    Generate New
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="border-b border-surface-border bg-surface/50">
          <div className="max-w-7xl mx-auto px-8 py-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-text-tertiary" />
              {filterButtons.map(btn => (
                <button
                  key={btn.value}
                  onClick={() => setFilter(btn.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 transition-colors',
                    filter === btn.value
                      ? 'bg-accent text-white'
                      : 'bg-background text-text-secondary hover:text-text-primary border border-surface-border'
                  )}
                >
                  {btn.icon}
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <main className="max-w-7xl mx-auto px-8 py-8">
          {images.length === 0 ? (
            <div className="text-center py-16">
              <ImageIcon className="w-16 h-16 mx-auto text-text-tertiary mb-4" />
              <h2 className="text-xl font-semibold text-text-primary mb-2">No images yet</h2>
              <p className="text-text-secondary mb-6">
                Generate images from your story content to see them here.
              </p>
              <Link href={`/stories/${storyId}`}>
                <Button>
                  <Palette className="w-4 h-4 mr-2" />
                  Go to Story Editor
                </Button>
              </Link>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map(image => (
                <div
                  key={image.id}
                  className="group relative bg-surface rounded-xl overflow-hidden border border-surface-border hover:border-accent/50 transition-all cursor-pointer"
                  onClick={() => setSelectedImage(image)}
                >
                  <div className="aspect-square relative">
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${image.file_path}`}
                      alt={image.title || 'Generated image'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform">
                      <p className="text-white text-sm font-medium truncate">
                        {image.title || 'Untitled'}
                      </p>
                      <p className="text-white/70 text-xs capitalize">
                        {image.image_type}
                        {image.style_id && ` • ${image.style_id}`}
                      </p>
                    </div>
                  </div>
                  {/* Quick actions */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleFavorite(image.id); }}
                      className={cn(
                        'p-1.5 rounded-full',
                        image.is_favorite ? 'bg-red-500 text-white' : 'bg-black/50 text-white hover:bg-black/70'
                      )}
                    >
                      <Heart className={cn('w-4 h-4', image.is_favorite && 'fill-current')} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {images.map(image => (
                <div
                  key={image.id}
                  className="flex items-center gap-4 bg-surface rounded-xl p-4 border border-surface-border hover:border-accent/50 transition-all cursor-pointer"
                  onClick={() => setSelectedImage(image)}
                >
                  <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${image.file_path}`}
                      alt={image.title || 'Generated image'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-text-primary truncate">
                      {image.title || 'Untitled'}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-text-secondary mt-1">
                      <span className="capitalize">{image.image_type}</span>
                      {image.style_id && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{image.style_id}</span>
                        </>
                      )}
                      {getCharacterName(image.character_id) && (
                        <>
                          <span>•</span>
                          <span>{getCharacterName(image.character_id)}</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-text-tertiary mt-1">
                      {new Date(image.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleFavorite(image.id); }}
                      className={cn(
                        'p-2 rounded-lg',
                        image.is_favorite ? 'text-red-500' : 'text-text-tertiary hover:text-text-primary'
                      )}
                    >
                      <Heart className={cn('w-5 h-5', image.is_favorite && 'fill-current')} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDownload(image); }}
                      className="p-2 rounded-lg text-text-tertiary hover:text-text-primary"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(image.id); }}
                      className="p-2 rounded-lg text-text-tertiary hover:text-red-500"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Image Detail Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="bg-surface rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image */}
            <div className="flex-1 bg-black flex items-center justify-center min-h-[300px]">
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${selectedImage.file_path}`}
                alt={selectedImage.title || 'Generated image'}
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
            
            {/* Details */}
            <div className="w-full md:w-80 p-6 overflow-y-auto border-t md:border-t-0 md:border-l border-surface-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text-primary">
                  {selectedImage.title || 'Untitled'}
                </h2>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="p-1 hover:bg-surface-hover rounded"
                >
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-text-tertiary uppercase tracking-wider">Type</label>
                  <p className="text-text-primary capitalize">{selectedImage.image_type}</p>
                </div>

                {selectedImage.style_id && (
                  <div>
                    <label className="text-xs text-text-tertiary uppercase tracking-wider">Style</label>
                    <p className="text-text-primary capitalize">{selectedImage.style_id}</p>
                  </div>
                )}

                {getCharacterName(selectedImage.character_id) && (
                  <div>
                    <label className="text-xs text-text-tertiary uppercase tracking-wider">Character</label>
                    <p className="text-text-primary">{getCharacterName(selectedImage.character_id)}</p>
                  </div>
                )}

                {selectedImage.seed && (
                  <div>
                    <label className="text-xs text-text-tertiary uppercase tracking-wider">Seed</label>
                    <p className="text-text-primary font-mono">{selectedImage.seed}</p>
                  </div>
                )}

                <div>
                  <label className="text-xs text-text-tertiary uppercase tracking-wider">Created</label>
                  <p className="text-text-primary">
                    {new Date(selectedImage.created_at).toLocaleString()}
                  </p>
                </div>

                {selectedImage.prompt && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-text-tertiary uppercase tracking-wider">Prompt</label>
                      <button
                        onClick={() => handleCopyPrompt(selectedImage.prompt!)}
                        className="text-xs text-accent hover:text-accent-hover flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        Copy
                      </button>
                    </div>
                    <p className="text-sm text-text-secondary bg-background p-3 rounded-lg max-h-32 overflow-y-auto">
                      {selectedImage.prompt}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-surface-border">
                  <Button
                    variant={selectedImage.is_favorite ? 'primary' : 'secondary'}
                    className="flex-1"
                    onClick={() => handleToggleFavorite(selectedImage.id)}
                  >
                    <Heart className={cn('w-4 h-4 mr-2', selectedImage.is_favorite && 'fill-current')} />
                    {selectedImage.is_favorite ? 'Favorited' : 'Favorite'}
                  </Button>
                  <Button variant="secondary" onClick={() => handleDownload(selectedImage)}>
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" className="text-red-500" onClick={() => handleDelete(selectedImage.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
