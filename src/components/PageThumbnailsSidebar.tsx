/**
 * PDF Forge - Page Thumbnails Sidebar & Mobile Drawer
 * Responsive sidebar on desktop; animated slide-over drawer on mobile/tablet.
 */
import React, { useEffect, useState } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  X,
  Layers
} from 'lucide-react';
import { useEditor } from '../editor/EditorContext';
import { pdfRenderer } from '../services/pdfRenderer';

export const PageThumbnailsSidebar: React.FC = () => {
  const {
    document,
    currentPageIndex,
    setCurrentPage,
    addBlankPage,
    deletePage,
    duplicatePage,
    rotatePage,
    reorderPages,
    isMobilePagesOpen,
    setIsMobilePagesOpen,
  } = useEditor();

  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [draggedPageIndex, setDraggedPageIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!document) return;

    let isMounted = true;
    async function loadThumbs() {
      const newThumbs: Record<number, string> = {};
      for (let i = 0; i < document!.pages.length; i++) {
        const page = document!.pages[i];
        if (page.pageNumber <= (document!.originalPdfBytes ? 100 : 0)) {
          const url = await pdfRenderer.getThumbnailDataUrl(page.pageNumber, 160);
          if (url) newThumbs[i] = url;
        }
      }
      if (isMounted) {
        setThumbnails(newThumbs);
      }
    }

    loadThumbs();
    return () => {
      isMounted = false;
    };
  }, [document?.pages.length, document?.originalPdfBytes]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedPageIndex(index);
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedPageIndex === null || draggedPageIndex === targetIndex || !document) return;

    const newOrder = document.pages.map((_, i) => i);
    const [removed] = newOrder.splice(draggedPageIndex, 1);
    newOrder.splice(targetIndex, 0, removed);

    reorderPages(newOrder);
    setCurrentPage(targetIndex);
    setDraggedPageIndex(null);
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0 || !document) return;
    const newOrder = document.pages.map((_, i) => i);
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    reorderPages(newOrder);
    setCurrentPage(index - 1);
  };

  const handleMoveDown = (index: number) => {
    if (!document || index >= document.pages.length - 1) return;
    const newOrder = document.pages.map((_, i) => i);
    [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
    reorderPages(newOrder);
    setCurrentPage(index + 1);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 select-none">
      {/* Sidebar Header */}
      <div className="h-12 px-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
        <span className="flex items-center gap-1.5 font-bold">
          <Layers className="w-4 h-4 text-indigo-500" />
          <span>Pages ({document?.pages.length || 0})</span>
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => addBlankPage()}
            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Add Blank Page"
          >
            <Plus className="w-4 h-4" />
          </button>
          {/* Close for mobile drawer */}
          <button
            onClick={() => setIsMobilePagesOpen(false)}
            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 lg:hidden transition-colors"
            title="Close Drawer"
          >
            <X className="w-4 h-4" />
          </button>
          {/* Collapse for desktop */}
          <button
            onClick={() => setIsCollapsed(true)}
            className="min-w-[36px] min-h-[36px] hidden lg:flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Collapse Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Thumbnails Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {document?.pages.map((page, index) => {
          const isSelected = index === currentPageIndex;
          const thumbUrl = thumbnails[index];

          return (
            <div
              key={page.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              onClick={() => {
                setCurrentPage(index);
                if (window.innerWidth < 1024) {
                  setIsMobilePagesOpen(false);
                }
              }}
              className={`group relative rounded-xl border transition-all cursor-pointer p-2 flex flex-col items-center bg-white dark:bg-slate-800/90 shadow-xs touch-manipulation ${
                isSelected
                  ? 'border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                  : 'border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              {/* Thumbnail Container */}
              <div
                className="w-full aspect-[1/1.4] bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center relative border border-slate-200/50 dark:border-slate-700/50"
                style={{ transform: `rotate(${page.rotation || 0}deg)` }}
              >
                {thumbUrl ? (
                  <img src={thumbUrl} alt={`Page ${index + 1}`} className="w-full h-full object-contain pointer-events-none" />
                ) : (
                  <div className="text-xs text-slate-400 font-medium">Page {index + 1}</div>
                )}

                {page.objects.length > 0 && (
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white shadow-xs">
                    {page.objects.length}
                  </span>
                )}
              </div>

              {/* Page Number and Actions */}
              <div className="w-full flex items-center justify-between mt-2 pt-1 text-xs text-slate-500 dark:text-slate-400">
                <span className={`font-semibold ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : ''}`}>
                  Page {index + 1}
                </span>

                <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveUp(index);
                    }}
                    disabled={index === 0}
                    className="p-1 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-30"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveDown(index);
                    }}
                    disabled={index === (document?.pages.length || 0) - 1}
                    className="p-1 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-30"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      rotatePage(index, 90);
                    }}
                    className="p-1 hover:text-indigo-600 dark:hover:text-indigo-400"
                    title="Rotate 90° CW"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicatePage(index);
                    }}
                    className="p-1 hover:text-emerald-600 dark:hover:text-emerald-400"
                    title="Duplicate Page"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {document.pages.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePage(index);
                      }}
                      className="p-1 hover:text-rose-600 dark:hover:text-rose-400"
                      title="Delete Page"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {/* 1. DESKTOP SIDEBAR (lg:flex) */}
      <aside className={`hidden lg:flex transition-all duration-200 border-r border-slate-200 dark:border-slate-800 shrink-0 ${isCollapsed ? 'w-10' : 'w-56'}`}>
        {isCollapsed ? (
          <div className="w-10 bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center py-3 select-none">
            <button
              onClick={() => setIsCollapsed(false)}
              className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="Expand Page Thumbnails"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="mt-8 text-[11px] font-semibold text-slate-400 rotate-90 whitespace-nowrap tracking-wider">
              PAGES ({document?.pages.length || 0})
            </div>
          </div>
        ) : (
          sidebarContent
        )}
      </aside>

      {/* 2. MOBILE DRAWER SLIDEOVER (< lg) */}
      {isMobilePagesOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          {/* Backdrop */}
          <div
            onClick={() => setIsMobilePagesOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
          />
          {/* Slideover panel */}
          <div className="relative w-64 max-w-[80vw] h-full shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
