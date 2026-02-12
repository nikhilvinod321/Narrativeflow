'use client';

import React, { useState, useEffect, useRef, forwardRef } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { cn } from '@/lib/utils';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

interface BookReaderProps {
  content: string;
  title: string;
  onClose: () => void;
  className?: string;
}


const Page = forwardRef<HTMLDivElement, { children: React.ReactNode; number: number; total: number; fontSize: number }>(
  ({ children, number, total, fontSize }, ref) => {
    return (
      <div className="page bg-[#fdfbf7] shadow-lg border-l border-[#f0f0f0] h-full overflow-hidden relative" ref={ref}>
        <div className="page-content p-8 h-full flex flex-col">
          <div 
            className="flex-1 prose max-w-none text-gray-800 text-justify overflow-hidden"
            style={{ fontSize: `${fontSize}px`, lineHeight: '1.6' }}
          >
            {children}
          </div>
          <div className="page-footer mt-auto pt-4 border-t border-gray-100 flex justify-between text-xs text-gray-400 font-serif">
            <span>NarrativeFlow</span>
            <span>{number} / {total}</span>
          </div>
        </div>
        {/* Paper texture overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-5 bg-[url('/paper-texture.png')] mix-blend-multiply" />
        {/* Spine shadow */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/5 to-transparent pointer-events-none" />
      </div>
    );
  }
);

Page.displayName = 'Page';

export function BookReader({ content, title, onClose, className }: BookReaderProps) {
  const [pages, setPages] = useState<string[]>([]);
  const bookRef = useRef<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [fontSize, setFontSize] = useState(18); // Default font size (px)

  // Split content into pages (basic simulation for now)
  // In a real implementation, you'd calculate text height
  useEffect(() => {
    if (!content) return;
    
    // Improved splitting logic using top-level children to avoid nesting duplication
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    // Use childNodes to catch both Elements (p, div, h1) and loose Text nodes
    const nodes = Array.from(tempDiv.childNodes);
    
    const newPages: string[] = [];
    let currentPageContent = '';
    let currentHeightEstimate = 0;
    
    // Dynamic capacity based on font size.
    // Instead of char count, let's try a rough "height" estimate relative to font size.
    // An average page might have ~600px of usable height.
    // A line is roughly (fontSize * 1.6) px high.
    
    // We use a safer average char width to avoid underestimating content height
    // Proportional fonts like Merriweather are wider.
    const LINE_HEIGHT = fontSize * 1.6;
    const PAGE_HEIGHT = 420; // Reduced to prevent cutoff at bottom
    const CHAR_WIDTH = fontSize * 0.85; // Increased width estimate to be conservative about line wrapping
    const AVAILABLE_WIDTH = 450; // Closer to actual page width (500px - 64px padding)
    
    // Calculate approximately how many characters fit on one line
    const CHARS_PER_LINE = Math.floor(AVAILABLE_WIDTH / CHAR_WIDTH);

    // Helper to estimate height in pixels
    const getEstimatedHeight = (textLength: number, isHeader: boolean) => {
        const lines = Math.max(1, Math.ceil(textLength / CHARS_PER_LINE));
        const blockOverhead = isHeader ? LINE_HEIGHT * 2.5 : LINE_HEIGHT * 1.5; // More margin buffer
        return (lines * LINE_HEIGHT) + blockOverhead;
    };
    
    nodes.forEach((node) => {
      // Process Text Nodes and Paragraphs that might need splitting
      if (node.nodeType === Node.TEXT_NODE || (node.nodeType === Node.ELEMENT_NODE && node.nodeName === 'P')) {
        const element = node as Element;
        const textContent = node.textContent?.trim();
        const hasImage = node.nodeType === Node.ELEMENT_NODE && element.querySelector('img');

        // Allow if there is text OR an image. Only skip if completely empty.
        if (!textContent && !hasImage) return;

        // Special handling for Paragraphs containing Images
        if (hasImage) {
            const img = element.querySelector('img');
            let height = 330; // Base height for image (280px max-height + margins + padding safety)
            
            let finalHTML = element.outerHTML;
            if (img) {
                 const src = img.getAttribute('src');
                 const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                 
                 // Ensure src is valid (re-apply fix if needed)
                 const imgSrc = (src?.startsWith('/') || src?.startsWith('static/')) 
                    ? `${API_URL}${src.startsWith('/') ? '' : '/'}${src}`
                    : src || '';

                 const alt = img.getAttribute('alt') || '';
                 // Wrap image to enforce sizing
                 finalHTML = `<div style="display: flex; justify-content: center; margin: 1rem 0;"><img src="${imgSrc}" alt="${alt}" style="max-height: 280px; max-width: 100%; object-fit: contain;" /></div>`;
                 
                 // If there was also text in the paragraph, append it
                 if (textContent) {
                    finalHTML += `<p class="text-justify">${textContent}</p>`; 
                    // Add text height to total height estimate
                    height += getEstimatedHeight(textContent.length, false);
                 }
            }

            if (currentHeightEstimate + height > PAGE_HEIGHT && currentPageContent) {
                newPages.push(currentPageContent);
                currentPageContent = finalHTML;
                currentHeightEstimate = height;
            } else {
                currentPageContent += finalHTML;
                currentHeightEstimate += height;
            }
            return; // Done with this node
        }

        const isHeader = false;
        const totalHeight = getEstimatedHeight(textContent!.length, isHeader);

        // If a single block is too big for ANY page, we must split it
        if (totalHeight > PAGE_HEIGHT) {
            // How many chars fit in one page?
            // Max lines = PAGE_HEIGHT / LINE_HEIGHT
            const maxLinesPerPage = Math.floor(PAGE_HEIGHT / LINE_HEIGHT);
            // Use 80% capacity for splitting to leave room for orphans/widows
            const charsPerPage = Math.floor(maxLinesPerPage * CHARS_PER_LINE * 0.9);
            
            // Split text into chunks
            let remainingText = textContent || "";
            
            while (remainingText.length > 0) {
                // Take a chunk that fits
                // Try to split at a sentence or space boundary near the limit
                let splitIndex = charsPerPage;
                
                if (splitIndex < remainingText.length) {
                    // Look for last period, then last space
                    const lastPeriod = remainingText.lastIndexOf('.', splitIndex);
                    const lastSpace = remainingText.lastIndexOf(' ', splitIndex);
                    
                    if (lastPeriod > splitIndex * 0.7) {
                        splitIndex = lastPeriod + 1;
                    } else if (lastSpace > splitIndex * 0.7) {
                        splitIndex = lastSpace;
                    }
                } else {
                    splitIndex = remainingText.length;
                }
                
                const chunk = remainingText.substring(0, splitIndex).trim();
                remainingText = remainingText.substring(splitIndex).trim();
                
                if (chunk) {
                    // Check if this chunk fits in current page
                    const chunkHeight = getEstimatedHeight(chunk.length, false);
                    if (currentHeightEstimate + chunkHeight > PAGE_HEIGHT && currentPageContent) {
                        newPages.push(currentPageContent);
                        currentPageContent = `<p>${chunk}</p>`;
                        currentHeightEstimate = chunkHeight;
                    } else {
                        currentPageContent += `<p>${chunk}</p>`;
                        currentHeightEstimate += chunkHeight;
                    }
                }
            }
            return; // Done processing this node
        }
        
        // Normal processing for blocks that fit on a page
        const nodeHTML = node.nodeType === Node.TEXT_NODE 
            ? `<p>${textContent}</p>` 
            : (node as Element).outerHTML;
            
        if (currentHeightEstimate + totalHeight > PAGE_HEIGHT && currentPageContent) {
            newPages.push(currentPageContent);
            currentPageContent = nodeHTML;
            currentHeightEstimate = totalHeight;
        } else {
            currentPageContent += nodeHTML;
            currentHeightEstimate += totalHeight;
        }
      } 
      // Handle non-splittable elements (Headers, Images, Divs)
      else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        const isHeader = /^H[1-6]$/.test(element.nodeName);
        const textLength = element.textContent?.length || 0;
        
        // Give images a fixed height estimate
        // And ensure they render with max-height in CSS
        let height = 0;
        let finalHTML = element.outerHTML;

        if (element.tagName === 'IMG' || element.querySelector('img')) {
             height = 330; 
             const img = element.tagName === 'IMG' ? element : element.querySelector('img');
             
             if (img) {
                const src = img.getAttribute('src');
                const alt = img.getAttribute('alt') || '';
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                
                // Ensure src is valid relative to backend
                const imgSrc = (src?.startsWith('/') || src?.startsWith('static/')) 
                    ? `${API_URL}${src.startsWith('/') ? '' : '/'}${src}`
                    : src || '';

                // If it's a wrapper div, try to preserve text content if any, 
                // but usually wrappers from editor just hold the image.
                // For simplicity/safety, we reconstruct the image block.
                // If there IS text in this wrapper (e.g. caption), we should preserve it.
                const text = element.textContent?.trim();
                
                finalHTML = `<div style="display: flex; flex-col; alignItems: center; justify-content: center; margin: 1rem 0;"><img src="${imgSrc}" alt="${alt}" style="max-height: 280px; max-width: 100%; object-fit: contain;" /></div>`;
                
                if (text && element.tagName !== 'IMG') {
                   finalHTML += `<p class="text-sm text-center text-gray-500 mt-2 font-sans italic">${text}</p>`;
                   height += 40; // Add space for caption
                }
             }
        } else {
             height = getEstimatedHeight(textLength, isHeader);
        }

        if (currentHeightEstimate + height > PAGE_HEIGHT && currentPageContent) {
            newPages.push(currentPageContent);
            currentPageContent = finalHTML;
            currentHeightEstimate = height;
        } else {
            currentPageContent += finalHTML;
            currentHeightEstimate += height;
        }
      }
    });

    if (currentPageContent) {
      newPages.push(currentPageContent);
    }
    
    // Fallback if no pages created (e.g. empty content seems unlikely but possible)
    if (newPages.length === 0 && content.trim()) {
        newPages.push(content);
    }
    
    // Add cover page
    newPages.unshift(`
      <div class="h-full flex flex-col items-center justify-center text-center p-8 border-4 border-double border-gray-800 m-4">
        <h1 class="text-4xl font-serif font-bold mb-4 text-gray-900">${title}</h1>
        <div class="w-16 h-1 bg-gray-800 my-8"></div>
        <p class="text-gray-600 font-serif italic">Created with NarrativeFlow</p>
      </div>
    `);

    setPages(newPages);
    setTotalPages(newPages.length);
  }, [content, title, fontSize]);

  const nextFlip = () => {
    bookRef.current?.pageFlip()?.flipNext();
  };

  const prevFlip = () => {
    bookRef.current?.pageFlip()?.flipPrev();
  };
  
  const increaseFont = () => setFontSize(prev => Math.min(prev + 2, 32));
  const decreaseFont = () => setFontSize(prev => Math.max(prev - 2, 12));

  return (
    <div className={cn("fixed inset-0 z-50 bg-stone-900/95 flex flex-col", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 bg-stone-900 text-stone-300 border-b border-stone-800">
        <div className="flex items-center gap-4">
          <h2 className="font-serif text-xl text-white">{title}</h2>
          <span className="text-sm px-3 py-1 bg-stone-800 rounded-full">
            Page {currentPage + 1} of {totalPages}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 mr-4 bg-stone-800 rounded-lg p-1">
                <button
                    onClick={decreaseFont}
                    className="p-1.5 hover:bg-stone-700 rounded-md transition-colors text-stone-400 hover:text-white"
                    title="Decrease font size"
                >
                    <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs w-8 text-center font-mono">{fontSize}px</span>
                <button
                    onClick={increaseFont}
                    className="p-1.5 hover:bg-stone-700 rounded-md transition-colors text-stone-400 hover:text-white"
                    title="Increase font size"
                >
                    <ZoomIn className="w-4 h-4" />
                </button>
            </div>
            
            <button 
                onClick={onClose}
                className="p-2 hover:bg-stone-800 rounded-full transition-colors text-stone-400 hover:text-white"
            >
                <X className="w-6 h-6" />
                <span className="sr-only">Close Reader</span>
            </button>
        </div>
      </div>

      {/* Book Container */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-hidden relative">
        {/* Navigation Arrows */}
        <button 
          onClick={prevFlip}
          className="absolute left-8 p-4 text-stone-500 hover:text-white transition-colors z-10 bg-black/20 rounded-full hover:bg-black/40 backdrop-blur-sm"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
        
        <button 
          onClick={nextFlip}
          className="absolute right-8 p-4 text-stone-500 hover:text-white transition-colors z-10 bg-black/20 rounded-full hover:bg-black/40 backdrop-blur-sm"
        >
          <ChevronRight className="w-8 h-8" />
        </button>

        {/* FlipBook */}
        <div className="shadow-2xl">
            {pages.length > 0 && (
                <HTMLFlipBook
                // Force re-render when page count or font size changes to avoid rendering glitches
                key={`book-${pages.length}-${fontSize}`}
                width={500}
                height={700}
                size="stretch"
                minWidth={300}
                maxWidth={600}
                minHeight={400}
                maxHeight={800}
                maxShadowOpacity={0.5}
                showCover={true}
                mobileScrollSupport={true}
                onFlip={(e) => setCurrentPage(e.data)}
                ref={bookRef}
                className="mx-auto"
                style={{}} 
                startPage={0} 
                drawShadow={true} 
                flippingTime={1000} 
                usePortrait={false} 
                startZIndex={0} 
                autoSize={true} 
                clickEventForward={true} 
                useMouseEvents={true} 
                swipeDistance={30} 
                showPageCorners={true} 
                disableFlipByClick={false}
                >
                {pages.map((content, index) => (
                    <Page key={index} number={index + 1} total={totalPages} fontSize={fontSize}>
                        <div dangerouslySetInnerHTML={{ __html: content }} />
                    </Page>
                ))}
                </HTMLFlipBook>
            )}
        </div>
      </div>
    </div>
  );
}
