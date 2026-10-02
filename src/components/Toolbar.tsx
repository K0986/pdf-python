/**
 * PDF Forge - Responsive Touch & Desktop Toolbar
 * Adaptive vertical strip on desktop, horizontal thumb-friendly toolbar on mobile, with 44px minimum touch targets.
 */
import React, { useState, useRef } from 'react';
import {
  MousePointer,
  Hand,
  Type,
  Pen,
  Highlighter,
  Square,
  Circle,
  Minus,
  MoveRight,
  Image as ImageIcon,
  StickyNote,
  Stamp,
  ShieldAlert,
  CheckSquare,
  Link as LinkIcon,
  Layers,
  ChevronDown
} from 'lucide-react';
import { useEditor } from '../editor/EditorContext';
import { ToolMode } from '../types/pdf';

interface ToolbarProps {
  onOpenPageManager: () => void;
  onOpenOcr: () => void;
  mode?: 'desktop' | 'mobile' | 'auto';
}

export const Toolbar: React.FC<ToolbarProps> = ({ onOpenPageManager, onOpenOcr, mode = 'auto' }) => {
  const { toolMode, setToolMode, addObject, currentPageIndex } = useEditor();
  const [activeFlyout, setActiveFlyout] = useState<'shapes' | 'annotations' | 'forms' | null>(null);
  const imageUploadRef = useRef<HTMLInputElement>(null);

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const maxWidth = 250;
        const scale = Math.min(1, maxWidth / img.width);
        addObject(currentPageIndex, {
          id: `img_${Date.now()}`,
          type: 'image',
          name: file.name,
          src,
          x: 60,
          y: 60,
          width: Math.round(img.width * scale),
          height: Math.round(img.height * scale),
          opacity: 1.0,
          keepAspectRatio: true,
          naturalWidth: img.width,
          naturalHeight: img.height,
        });
        setToolMode('select');
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const isShapeActive = [
    'shape-rect',
    'shape-rounded-rect',
    'shape-circle',
    'shape-line',
    'shape-arrow',
  ].includes(toolMode);

  const isAnnotActive = [
    'annotation-highlight',
    'annotation-underline',
    'annotation-strikeout',
    'sticky-note',
    'stamp',
  ].includes(toolMode);

  const isFormActive = ['form-text', 'form-checkbox', 'form-dropdown'].includes(toolMode);

  return (
    <>
      <input
        type="file"
        ref={imageUploadRef}
        onChange={handleImageFile}
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
      />

      {/* 1. DESKTOP / TABLET VERTICAL TOOL STRIP */}
      {(mode === 'desktop' || mode === 'auto') && (
        <aside className={`${mode === 'auto' ? 'hidden md:flex' : 'flex'} w-14 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-col items-center py-3 select-none z-20 transition-colors shrink-0`}>
        {/* Navigation Tools */}
        <div className="flex flex-col gap-1 pb-2 border-b border-slate-100 dark:border-slate-800 w-full items-center">
          <button
            onClick={() => {
              setToolMode('select');
              setActiveFlyout(null);
            }}
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-colors relative ${
              toolMode === 'select'
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Select & Move (V)"
          >
            <MousePointer className="w-5 h-5" />
          </button>

          <button
            onClick={() => {
              setToolMode('hand');
              setActiveFlyout(null);
            }}
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-colors relative ${
              toolMode === 'hand'
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Hand / Pan View (H)"
          >
            <Hand className="w-5 h-5" />
          </button>
        </div>

        {/* Content Creation Tools */}
        <div className="flex flex-col gap-1 py-2 border-b border-slate-100 dark:border-slate-800 w-full items-center">
          {/* Text Tool */}
          <button
            onClick={() => {
              setToolMode('text');
              setActiveFlyout(null);
            }}
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-colors relative ${
              toolMode === 'text'
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Add Text Box (T) • Multilingual Unicode"
          >
            <Type className="w-5 h-5" />
          </button>

          {/* Freehand Pen */}
          <button
            onClick={() => {
              setToolMode('pen');
              setActiveFlyout(null);
            }}
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-colors relative ${
              toolMode === 'pen'
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Freehand Pen / Signature (P)"
          >
            <Pen className="w-5 h-5" />
          </button>

          {/* Highlighter */}
          <button
            onClick={() => {
              setToolMode('highlighter');
              setActiveFlyout(null);
            }}
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-colors relative ${
              toolMode === 'highlighter'
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Marker / Highlighter"
          >
            <Highlighter className="w-5 h-5" />
          </button>

          {/* Shapes Group */}
          <div className="relative">
            <button
              onClick={() => setActiveFlyout(activeFlyout === 'shapes' ? null : 'shapes')}
              className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-colors relative ${
                isShapeActive
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Geometric Shapes"
            >
              <Square className="w-5 h-5" />
            </button>

            {activeFlyout === 'shapes' && (
              <div className="absolute left-full top-0 ml-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-1.5 flex flex-col gap-1 z-50 w-40">
                <button
                  onClick={() => {
                    setToolMode('shape-rect');
                    setActiveFlyout(null);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg min-h-[40px]"
                >
                  <Square className="w-4 h-4" />
                  <span>Rectangle</span>
                </button>
                <button
                  onClick={() => {
                    setToolMode('shape-circle');
                    setActiveFlyout(null);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg min-h-[40px]"
                >
                  <Circle className="w-4 h-4" />
                  <span>Circle</span>
                </button>
                <button
                  onClick={() => {
                    setToolMode('shape-line');
                    setActiveFlyout(null);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg min-h-[40px]"
                >
                  <Minus className="w-4 h-4" />
                  <span>Line</span>
                </button>
                <button
                  onClick={() => {
                    setToolMode('shape-arrow');
                    setActiveFlyout(null);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg min-h-[40px]"
                >
                  <MoveRight className="w-4 h-4" />
                  <span>Arrow</span>
                </button>
              </div>
            )}
          </div>

          {/* Image Tool */}
          <button
            onClick={() => imageUploadRef.current?.click()}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Insert Image"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Annotations & Redaction */}
        <div className="flex flex-col gap-1 py-2 border-b border-slate-100 dark:border-slate-800 w-full items-center">
          {/* Annotations Group */}
          <div className="relative">
            <button
              onClick={() => setActiveFlyout(activeFlyout === 'annotations' ? null : 'annotations')}
              className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-colors relative ${
                isAnnotActive
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Annotations & Stamps"
            >
              <StickyNote className="w-5 h-5" />
            </button>

            {activeFlyout === 'annotations' && (
              <div className="absolute left-full top-0 ml-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-1.5 flex flex-col gap-1 z-50 w-44">
                <button
                  onClick={() => {
                    setToolMode('sticky-note');
                    setActiveFlyout(null);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg min-h-[40px]"
                >
                  <StickyNote className="w-4 h-4 text-amber-500" />
                  <span>Sticky Note</span>
                </button>
                <button
                  onClick={() => {
                    setToolMode('stamp');
                    setActiveFlyout(null);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg min-h-[40px]"
                >
                  <Stamp className="w-4 h-4 text-rose-500" />
                  <span>Official Stamp</span>
                </button>
                <button
                  onClick={() => {
                    setToolMode('annotation-highlight');
                    setActiveFlyout(null);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg min-h-[40px]"
                >
                  <Highlighter className="w-4 h-4 text-yellow-500" />
                  <span>Highlight Area</span>
                </button>
              </div>
            )}
          </div>

          {/* Redaction Tool */}
          <button
            onClick={() => {
              setToolMode('redact');
              setActiveFlyout(null);
            }}
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-colors relative ${
              toolMode === 'redact'
                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Redaction Tool (R)"
          >
            <ShieldAlert className="w-5 h-5 text-rose-500" />
          </button>

          {/* Forms Tool */}
          <button
            onClick={() => {
              setToolMode('form-text');
              setActiveFlyout(null);
            }}
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-colors relative ${
              isFormActive
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Form Field"
          >
            <CheckSquare className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom Tools */}
        <div className="mt-auto flex flex-col gap-1 pt-2 border-t border-slate-100 dark:border-slate-800 w-full items-center">
          <button
            onClick={onOpenPageManager}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Page Organizer"
          >
            <Layers className="w-5 h-5 text-indigo-500" />
          </button>
        </div>
      </aside>
      )}

      {/* 2. MOBILE & SMARTPHONE HORIZONTAL SCROLLABLE TOOL STRIP */}
      {(mode === 'mobile' || mode === 'auto') && (
      <div className={`${mode === 'auto' ? 'flex md:hidden' : 'flex'} w-full h-13 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-2 items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 z-25`}>
        <button
          onClick={() => setToolMode('select')}
          className={`min-w-[40px] h-10 px-2.5 flex items-center gap-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
            toolMode === 'select'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800'
          }`}
        >
          <MousePointer className="w-4 h-4" />
          <span>Select</span>
        </button>

        <button
          onClick={() => setToolMode('hand')}
          className={`min-w-[40px] h-10 px-2.5 flex items-center gap-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
            toolMode === 'hand'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800'
          }`}
        >
          <Hand className="w-4 h-4" />
          <span>Pan</span>
        </button>

        <button
          onClick={() => setToolMode('text')}
          className={`min-w-[40px] h-10 px-2.5 flex items-center gap-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
            toolMode === 'text'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800'
          }`}
        >
          <Type className="w-4 h-4" />
          <span>Text</span>
        </button>

        <button
          onClick={() => setToolMode('pen')}
          className={`min-w-[40px] h-10 px-2.5 flex items-center gap-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
            toolMode === 'pen'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800'
          }`}
        >
          <Pen className="w-4 h-4" />
          <span>Pen</span>
        </button>

        <button
          onClick={() => setToolMode('highlighter')}
          className={`min-w-[40px] h-10 px-2.5 flex items-center gap-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
            toolMode === 'highlighter'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800'
          }`}
        >
          <Highlighter className="w-4 h-4 text-amber-500" />
          <span>Highlight</span>
        </button>

        <button
          onClick={() => setToolMode('shape-rect')}
          className={`min-w-[40px] h-10 px-2.5 flex items-center gap-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
            isShapeActive
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800'
          }`}
        >
          <Square className="w-4 h-4" />
          <span>Shape</span>
        </button>

        <button
          onClick={() => setToolMode('stamp')}
          className={`min-w-[40px] h-10 px-2.5 flex items-center gap-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
            toolMode === 'stamp'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800'
          }`}
        >
          <Stamp className="w-4 h-4 text-rose-500" />
          <span>Stamp</span>
        </button>

        <button
          onClick={() => setToolMode('redact')}
          className={`min-w-[40px] h-10 px-2.5 flex items-center gap-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
            toolMode === 'redact'
              ? 'bg-rose-600 text-white'
              : 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-500" />
          <span>Redact</span>
        </button>

        <button
          onClick={() => imageUploadRef.current?.click()}
          className="min-w-[40px] h-10 px-2.5 flex items-center gap-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800"
        >
          <ImageIcon className="w-4 h-4" />
          <span>Image</span>
        </button>
      </div>
      )}
    </>
  );
};
