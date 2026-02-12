'use client';

import { Button } from '@/components/ui';
import { useState, useCallback } from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  Minus,
  Undo2,
  Redo2,
  Highlighter,
  LucideIcon,
  Type,
  Image as ImageIcon,
  X,
  Upload,
} from 'lucide-react';
import { Editor } from '@tiptap/react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface EditorToolbarProps {
  editor: Editor | null;
  className?: string;
  storyId?: string;
}

type ToolItem = 
  | { type: 'divider' }
  | { type: 'font-select' }
  | { type: 'image-insert' }
  | { icon: LucideIcon; action: () => void; isActive: boolean; tooltip: string; disabled?: boolean };

const FONT_FAMILIES = [
  { value: '', label: 'Default' },
  { value: 'serif', label: 'Serif' },
  { value: 'sans-serif', label: 'Sans Serif' },
  { value: 'monospace', label: 'Monospace' },
  { value: 'cursive', label: 'Cursive' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: '"Times New Roman", serif', label: 'Times New Roman' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Helvetica, sans-serif', label: 'Helvetica' },
  { value: '"Courier New", monospace', label: 'Courier New' },
];

export function EditorToolbar({ editor, className, storyId }: EditorToolbarProps) {
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [storyImages, setStoryImages] = useState<any[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const loadStoryImages = useCallback(async () => {
    if (!storyId) return;
    try {
      setLoadingImages(true);
      const data = await api.getStoryImages(storyId);
      // Backend returns an array directly
      setStoryImages(Array.isArray(data) ? data : (data.images || []));
    } catch (error) {
      console.error('Failed to load images:', error);
    } finally {
      setLoadingImages(false);
    }
  }, [storyId]);

  const handleFontChange = (fontFamily: string) => {
    if (fontFamily) {
      editor.chain().focus().setFontFamily(fontFamily).run();
    } else {
      editor.chain().focus().unsetFontFamily().run();
    }
    setShowFontDropdown(false);
  };

  const handleImageInsert = (src: string) => {
    if (src) {
      // Convert relative path to full URL if needed
      // If it starts with /static, it's a backend file
      const fullUrl = src.startsWith('/static') 
        ? `http://localhost:8000${src}` 
        : src.startsWith('/') && !src.startsWith('http') 
          ? `http://localhost:8000${src}` 
          : src;
          
      editor.chain().focus().setImage({ src: fullUrl }).run();
      setShowImageModal(false);
      setImageUrl('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storyId) return;

    try {
      setUploading(true);
      const image = await api.uploadImage(storyId, file);
      handleImageInsert(image.file_path);
      // Refresh gallery
      loadStoryImages();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const openImageModal = () => {
    setShowImageModal(true);
    if (storyId) {
      loadStoryImages();
    }
  };

  // Early return after all hooks are declared
  if (!editor) return null;

  const tools: ToolItem[] = [
    {
      icon: Bold,
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive('bold'),
      tooltip: 'Bold',
    },
    {
      icon: Italic,
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive('italic'),
      tooltip: 'Italic',
    },
    {
      icon: Strikethrough,
      action: () => editor.chain().focus().toggleStrike().run(),
      isActive: editor.isActive('strike'),
      tooltip: 'Strikethrough',
    },
    { type: 'divider' },
    {
      icon: Heading1,
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: editor.isActive('heading', { level: 1 }),
      tooltip: 'Heading 1',
    },
    {
      icon: Heading2,
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: editor.isActive('heading', { level: 2 }),
      tooltip: 'Heading 2',
    },
    {
      icon: Heading3,
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: editor.isActive('heading', { level: 3 }),
      tooltip: 'Heading 3',
    },
    { type: 'divider' },
    {
      icon: Quote,
      action: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: editor.isActive('blockquote'),
      tooltip: 'Quote',
    },
    {
      icon: List,
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive('bulletList'),
      tooltip: 'Bullet List',
    },
    {
      icon: ListOrdered,
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive('orderedList'),
      tooltip: 'Numbered List',
    },
    {
      icon: Minus,
      action: () => editor.chain().focus().setHorizontalRule().run(),
      isActive: false,
      tooltip: 'Divider',
    },
    { type: 'divider' },
    { type: 'font-select' },
    { type: 'image-insert' },
    { type: 'divider' },
    {
      icon: Highlighter,
      action: () => editor.chain().focus().toggleHighlight().run(),
      isActive: editor.isActive('highlight'),
      tooltip: 'Highlight',
    },
    { type: 'divider' },
    {
      icon: Undo2,
      action: () => editor.chain().focus().undo().run(),
      isActive: false,
      disabled: !editor.can().undo(),
      tooltip: 'Undo',
    },
    {
      icon: Redo2,
      action: () => editor.chain().focus().redo().run(),
      isActive: false,
      disabled: !editor.can().redo(),
      tooltip: 'Redo',
    },
  ];

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-1 p-2 bg-surface border-b border-surface-border',
          className
        )}
      >
        {tools.map((tool, index) => {
          if ('type' in tool) {
            if (tool.type === 'divider') {
              return <div key={index} className="w-px h-6 bg-surface-border mx-1" />;
            }
            if (tool.type === 'font-select') {
              return (
                <div key={index} className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setShowFontDropdown(!showFontDropdown)}
                    title="Font Family"
                  >
                    <Type className="w-4 h-4 mr-1" />
                    Font
                  </Button>
                  {showFontDropdown && (
                    <div className="absolute top-full left-0 mt-1 bg-surface border border-surface-border rounded-lg shadow-lg z-50 min-w-[180px]">
                      {FONT_FAMILIES.map((font) => (
                        <button
                          key={font.value}
                          onClick={() => handleFontChange(font.value)}
                          className={cn(
                            'w-full px-3 py-2 text-left text-sm hover:bg-accent/10 transition-colors',
                            editor.isActive('textStyle', { fontFamily: font.value }) && 'bg-accent/20 text-accent'
                          )}
                          style={{ fontFamily: font.value || undefined }}
                        >
                          {font.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            if (tool.type === 'image-insert') {
              return (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={openImageModal}
                  title="Insert Image"
                >
                  <ImageIcon className="w-4 h-4 mr-1" />
                  Image
                </Button>
              );
            }
          }
          
          const Icon = tool.icon;
          return (
            <Button
              key={index}
              variant="ghost"
              size="icon"
              className={cn(
                'h-8 w-8',
                tool.isActive && 'bg-accent/20 text-accent'
              )}
              onClick={tool.action}
              disabled={tool.disabled}
              title={tool.tooltip}
            >
              <Icon className="w-4 h-4" />
            </Button>
          );
        })}
      </div>

      {/* Image Insert Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-surface p-4 border-b border-surface-border flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary">
                🖼️ Insert Image
              </h3>
              <button
                onClick={() => setShowImageModal(false)}
                className="p-1 text-text-tertiary hover:text-text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Upload Section */}
              {storyId && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Upload Image
                  </label>
                  <div className="flex items-center justify-center border-2 border-dashed border-surface-border rounded-lg p-6 hover:bg-accent/5 transition-colors cursor-pointer relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="text-center">
                      {uploading ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-accent border-t-transparent mx-auto mb-2" />
                      ) : (
                        <Upload className="w-6 h-6 text-text-tertiary mx-auto mb-2" />
                      )}
                      <p className="text-sm text-text-secondary">
                        {uploading ? 'Uploading...' : 'Click or drop image to upload'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* URL Input */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Or Paste URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 px-3 py-2 bg-surface border border-surface-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                  <Button onClick={() => handleImageInsert(imageUrl)} disabled={!imageUrl}>
                    Insert
                  </Button>
                </div>
              </div>

              {/* Story Images Gallery */}
              {storyId && (
                <div>
                  <h4 className="text-sm font-medium text-text-secondary mb-3">
                    Your Story Images
                  </h4>
                  {loadingImages ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent" />
                    </div>
                  ) : storyImages.length === 0 ? (
                    <p className="text-center text-text-tertiary py-8">
                      No images yet. Generate images from the Gallery tab.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {storyImages.map((image) => (
                        <button
                          key={image.id}
                          onClick={() => handleImageInsert(image.file_path)}
                          className="group relative aspect-square rounded-lg overflow-hidden border-2 border-surface-border hover:border-accent transition-colors"
                        >
                          <img
                            src={image.file_path.startsWith('http') 
                              ? image.file_path 
                              : `http://localhost:8000${image.file_path.startsWith('/') ? '' : '/'}${image.file_path}`}
                            alt={image.title || 'Story image'}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium">
                              Insert
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
