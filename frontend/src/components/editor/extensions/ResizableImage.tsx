import { NodeViewWrapper, NodeViewProps, ReactNodeViewRenderer } from '@tiptap/react';
import Image from '@tiptap/extension-image';
import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { AlignCenter, AlignLeft, AlignRight, GripVertical } from 'lucide-react';

const ResizableImageComponent = (props: NodeViewProps) => {
  const { node, updateAttributes, selected, extension, getPos, editor } = props;
  const { isEditable } = editor;
  
  const [resizing, setResizing] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initial width from attributes or default to 100%
  const [width, setWidth] = useState(node.attrs.width || '100%');

  // Sync state with node attributes
  useEffect(() => {
    setWidth(node.attrs.width || '100%');
  }, [node.attrs.width]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    if (!isEditable) return;
    
    e.preventDefault();
    e.stopPropagation();
    setResizing(true);
    
    const startX = e.clientX;
    const startWidth = imageRef.current?.offsetWidth || 0;
    
    // Track width in closure variable to ensure we have the latest value for onMouseUp
    let currentNewWidth = startWidth;
    
    // Get parent width to calculate percentage if needed, or stick to pixels
    const parentWidth = containerRef.current?.parentElement?.offsetWidth || 800;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const currentX = moveEvent.clientX;
      const diffX = currentX - startX;
      
      // Calculate new width
      let newWidth = startWidth + diffX;
      
      // Constrain width
      if (newWidth < 100) newWidth = 100; // Min size
      if (newWidth > parentWidth) newWidth = parentWidth; // Max size
      
      currentNewWidth = newWidth;
      
      // Update local state for smooth feedback
      setWidth(`${newWidth}px`);
    };
    
    const onMouseUp = () => {
      setResizing(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      
      // Save final width
      updateAttributes({ width: `${currentNewWidth}px` });
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [isEditable, updateAttributes]);

  const setAlign = (align: 'left' | 'center' | 'right') => {
    updateAttributes({ align });
  };

  const align = node.attrs.align || 'center';

  return (
    <NodeViewWrapper className={cn("relative group my-4 flex", {
      'justify-start': align === 'left',
      'justify-center': align === 'center',
      'justify-end': align === 'right',
    })} ref={containerRef}>
      <div className="relative inline-block max-w-full">
        {/* Alignment Toolbar - Visible when selected or hovering */}
        {isEditable && (selected || resizing) && (
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-surface border border-surface-border rounded-lg shadow-lg flex gap-1 p-1 z-50 animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setAlign('left')}
              className={cn("p-1.5 rounded hover:bg-accent/10 transition-colors", align === 'left' && "bg-accent/20 text-accent")}
              title="Align Left"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setAlign('center')}
              className={cn("p-1.5 rounded hover:bg-accent/10 transition-colors", align === 'center' && "bg-accent/20 text-accent")}
              title="Align Center"
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setAlign('right')}
              className={cn("p-1.5 rounded hover:bg-accent/10 transition-colors", align === 'right' && "bg-accent/20 text-accent")}
              title="Align Right"
            >
              <AlignRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* The Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={node.attrs.src}
          alt={node.attrs.alt}
          ref={imageRef}
          className={cn(
            "rounded-lg transition-all duration-75 ease-linear",
            selected && "ring-2 ring-accent ring-offset-2 ring-offset-background"
          )}
          style={{ 
            width: width,
            maxWidth: '100%',
            height: 'auto',
            display: 'block'
          }}
        />

        {/* Resize Handle */}
        {isEditable && (selected || resizing) && (
          <div
            className="absolute right-0 bottom-0 w-8 h-8 flex items-center justify-center cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70 rounded-tl-lg text-white"
            onMouseDown={handleResizeStart}
            // Touch support skipped for brevity
          >
             <GripVertical className="w-4 h-4" />
          </div>
        )}
        
         {/* Simple Right Border Drag Handle overlay */}
         {isEditable && (selected || resizing) && (
             <div 
               className="absolute top-0 right-0 w-2 h-full cursor-ew-resize hover:bg-accent/50 transition-colors"
               onMouseDown={handleResizeStart}
             />
         )}
      </div>
    </NodeViewWrapper>
  );
};

export const ResizableImage = Image.extend({
  name: 'resizableImage',
  
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        renderHTML: (attributes) => ({
          width: attributes.width,
        }),
      },
      align: {
        default: 'center',
        renderHTML: (attributes) => ({
          'data-align': attributes.align,
        }),
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },
});
