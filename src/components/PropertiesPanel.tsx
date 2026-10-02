/**
 * PDF Forge - Responsive Properties Panel & Mobile Inspector Sheet
 * Docked panel on desktop; slide-over drawer / bottom sheet on mobile and touch screens.
 */
import React from 'react';
import {
  Type,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
  Copy,
  Layers,
  ShieldAlert,
  StickyNote,
  Stamp,
  Sliders,
  Check,
  Globe,
  X,
  Image as ImageIcon,
  RefreshCw,
  Download
} from 'lucide-react';
import { useEditor } from '../editor/EditorContext';
import { SUPPORTED_FONTS } from '../services/fontManager';
import { TextObject, ShapeObject, AnnotationObject, RedactionObject, ImageObject } from '../types/pdf';

interface PropertiesPanelProps {
  onOpenMetadata: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ onOpenMetadata }) => {
  const {
    document,
    currentPageIndex,
    selectedObjectIds,
    updateObject,
    deleteSelectedObjects,
    copySelection,
    textPreset,
    setTextPreset,
    shapePreset,
    setShapePreset,
    annotationPreset,
    setAnnotationPreset,
    redactionPreset,
    setRedactionPreset,
    toolMode,
    isMobilePropertiesOpen,
    setIsMobilePropertiesOpen,
  } = useEditor();

  const currentPage = document?.pages[currentPageIndex];
  const selectedObject = currentPage?.objects.find((o) => selectedObjectIds.includes(o.id));

  const handleUpdate = (updates: any) => {
    if (selectedObject) {
      updateObject(currentPageIndex, selectedObject.id, updates);
    }
  };

  const STAMP_PRESETS = [
    { label: 'APPROVED', color: '#16a34a' },
    { label: 'CONFIDENTIAL', color: '#dc2626' },
    { label: 'DRAFT', color: '#ea580c' },
    { label: 'FINAL', color: '#2563eb' },
    { label: 'VOID', color: '#9333ea' },
    { label: 'SIGN HERE', color: '#0284c7' },
  ];

  const COLOR_PALETTE = [
    '#0f172a', '#475569', '#dc2626', '#ea580c', '#f59e0b',
    '#16a34a', '#0284c7', '#2563eb', '#9333ea', '#ffffff',
  ];

  const inspectorContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 select-none">
      {/* Header */}
      <div className="h-12 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0">
        <span className="flex items-center gap-1.5 font-bold">
          <Sliders className="w-4 h-4 text-indigo-500" />
          <span>Properties & Style</span>
        </span>
        <div className="flex items-center gap-1">
          {selectedObject && (
            <>
              <button
                onClick={copySelection}
                className="min-w-[36px] min-h-[36px] flex items-center justify-center hover:text-slate-900 dark:hover:text-slate-100 rounded-lg"
                title="Copy Object"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={deleteSelectedObjects}
                className="min-w-[36px] min-h-[36px] flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                title="Delete Object"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
          {/* Mobile close button */}
          <button
            onClick={() => setIsMobilePropertiesOpen(false)}
            className="min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg lg:hidden"
            title="Close Sheet"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        {/* TEXT PROPERTIES */}
        {(selectedObject?.type === 'text' || toolMode === 'text') && (
          <div className="space-y-4">
            <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
              <Type className="w-4 h-4 text-indigo-500" />
              <span>Typography & Multilingual</span>
            </div>

            {/* Font Family */}
            <div className="space-y-1.5">
              <label className="text-slate-500 dark:text-slate-400 font-medium flex items-center justify-between">
                <span>Font Family</span>
                <Globe className="w-3.5 h-3.5 text-slate-400" />
              </label>
              <select
                value={selectedObject?.type === 'text' ? (selectedObject as TextObject).fontFamily : textPreset.fontFamily}
                onChange={(e) => {
                  const val = e.target.value;
                  setTextPreset((p) => ({ ...p, fontFamily: val }));
                  handleUpdate({ fontFamily: val });
                }}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-indigo-500 min-h-[44px]"
              >
                {SUPPORTED_FONTS.map((font) => (
                  <option key={font.id} value={font.name}>
                    {font.name} ({font.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Font Size & Alignment */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-slate-500 dark:text-slate-400 font-medium">Font Size</label>
                <input
                  type="number"
                  min="8"
                  max="120"
                  value={selectedObject?.type === 'text' ? (selectedObject as TextObject).fontSize : textPreset.fontSize}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setTextPreset((p) => ({ ...p, fontSize: val }));
                    handleUpdate({ fontSize: val });
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 min-h-[44px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 dark:text-slate-400 font-medium">Alignment</label>
                <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-0.5 min-h-[44px] items-center">
                  {(['left', 'center', 'right'] as const).map((align) => {
                    const current = selectedObject?.type === 'text' ? (selectedObject as TextObject).textAlign : textPreset.textAlign;
                    return (
                      <button
                        key={align}
                        onClick={() => {
                          setTextPreset((p) => ({ ...p, textAlign: align }));
                          handleUpdate({ textAlign: align });
                        }}
                        className={`flex-1 h-8 flex items-center justify-center rounded-md ${
                          current === align ? 'bg-white dark:bg-slate-700 shadow-xs text-indigo-600 dark:text-indigo-400' : 'text-slate-500'
                        }`}
                      >
                        {align === 'left' && <AlignLeft className="w-4 h-4" />}
                        {align === 'center' && <AlignCenter className="w-4 h-4" />}
                        {align === 'right' && <AlignRight className="w-4 h-4" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Styling Toggles */}
            <div className="flex gap-1.5">
              <button
                onClick={() => {
                  const current = selectedObject?.type === 'text' ? (selectedObject as TextObject).fontWeight : textPreset.fontWeight;
                  const next = current === 'bold' ? 'normal' : 'bold';
                  setTextPreset((p) => ({ ...p, fontWeight: next }));
                  handleUpdate({ fontWeight: next });
                }}
                className={`flex-1 min-h-[44px] rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold ${
                  (selectedObject?.type === 'text' ? (selectedObject as TextObject).fontWeight : textPreset.fontWeight) === 'bold'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Bold className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  const current = selectedObject?.type === 'text' ? (selectedObject as TextObject).fontStyle : textPreset.fontStyle;
                  const next = current === 'italic' ? 'normal' : 'italic';
                  setTextPreset((p) => ({ ...p, fontStyle: next }));
                  handleUpdate({ fontStyle: next });
                }}
                className={`flex-1 min-h-[44px] rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center italic ${
                  (selectedObject?.type === 'text' ? (selectedObject as TextObject).fontStyle : textPreset.fontStyle) === 'italic'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Italic className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  const current = selectedObject?.type === 'text' ? (selectedObject as TextObject).underline : textPreset.underline;
                  const next = !current;
                  setTextPreset((p) => ({ ...p, underline: next }));
                  handleUpdate({ underline: next });
                }}
                className={`flex-1 min-h-[44px] rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center underline ${
                  (selectedObject?.type === 'text' ? (selectedObject as TextObject).underline : textPreset.underline)
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Underline className="w-4 h-4" />
              </button>
            </div>

            {/* Colors */}
            <div className="space-y-1.5">
              <label className="text-slate-500 dark:text-slate-400 font-medium">Text Color</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PALETTE.map((color) => {
                  const current = selectedObject?.type === 'text' ? (selectedObject as TextObject).color : textPreset.color;
                  return (
                    <button
                      key={color}
                      onClick={() => {
                        setTextPreset((p) => ({ ...p, color }));
                        handleUpdate({ color });
                      }}
                      className={`w-7 h-7 rounded-full border border-slate-300 dark:border-slate-600 relative transition-transform ${
                        current === color ? 'scale-115 ring-2 ring-indigo-500' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* IMAGE PROPERTIES (Replace, Delete, Extract, Opacity, Dimensions) */}
        {selectedObject?.type === 'image' && (
          <div className="space-y-4">
            <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
              <ImageIcon className="w-4 h-4 text-indigo-500" />
              <span>Image Controls</span>
            </div>

            <div className="text-[11px] text-slate-500 truncate font-mono bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
              {(selectedObject as ImageObject).name || 'Embedded PDF Image'}
            </div>

            {/* Quick Actions: Replace & Extract */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  const input = window.document.querySelector('input[type="file"][accept*="image"]') as HTMLInputElement;
                  if (input) input.click();
                }}
                className="py-2 px-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-semibold flex items-center justify-center gap-1.5 min-h-[40px] transition-colors"
                title="Replace this image with a new file"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Replace</span>
              </button>

              <button
                onClick={() => {
                  const a = window.document.createElement('a');
                  a.href = (selectedObject as ImageObject).src;
                  a.download = (selectedObject as ImageObject).name || `image_${Date.now()}.png`;
                  a.click();
                }}
                className="py-2 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-center gap-1.5 min-h-[40px] transition-colors"
                title="Download extracted image file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Extract</span>
              </button>
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-slate-500 dark:text-slate-400 font-medium">Width (pt)</label>
                <input
                  type="number"
                  min="10"
                  max="2000"
                  value={Math.round(selectedObject.width)}
                  onChange={(e) => handleUpdate({ width: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 min-h-[40px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 dark:text-slate-400 font-medium">Height (pt)</label>
                <input
                  type="number"
                  min="10"
                  max="2000"
                  value={Math.round(selectedObject.height)}
                  onChange={(e) => handleUpdate({ height: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 min-h-[40px]"
                />
              </div>
            </div>

            {/* Opacity */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-500 dark:text-slate-400 font-medium">
                <span>Opacity</span>
                <span>{Math.round(((selectedObject as ImageObject).opacity ?? 1.0) * 100)}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={Math.round(((selectedObject as ImageObject).opacity ?? 1.0) * 100)}
                onChange={(e) => handleUpdate({ opacity: Number(e.target.value) / 100 })}
                className="w-full accent-indigo-600 min-h-[36px]"
              />
            </div>

            {/* Delete button */}
            <button
              onClick={deleteSelectedObjects}
              className="w-full py-2 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-semibold flex items-center justify-center gap-1.5 min-h-[40px] transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Image</span>
            </button>
          </div>
        )}

        {/* SHAPE PROPERTIES */}
        {(selectedObject?.type === 'shape' || toolMode.startsWith('shape-') || toolMode === 'pen') && (
          <div className="space-y-4">
            <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>Stroke & Fill</span>
            </div>

            {/* Stroke Width Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-500 dark:text-slate-400 font-medium">
                <span>Stroke Width</span>
                <span>
                  {(selectedObject?.type === 'shape' ? (selectedObject as ShapeObject).strokeWidth : shapePreset.strokeWidth)} px
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="24"
                value={selectedObject?.type === 'shape' ? (selectedObject as ShapeObject).strokeWidth : shapePreset.strokeWidth}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setShapePreset((p) => ({ ...p, strokeWidth: val }));
                  handleUpdate({ strokeWidth: val });
                }}
                className="w-full accent-indigo-600 min-h-[36px]"
              />
            </div>

            {/* Stroke Color */}
            <div className="space-y-1.5">
              <label className="text-slate-500 dark:text-slate-400 font-medium">Stroke Color</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PALETTE.map((color) => {
                  const current = selectedObject?.type === 'shape' ? (selectedObject as ShapeObject).strokeColor : shapePreset.strokeColor;
                  return (
                    <button
                      key={color}
                      onClick={() => {
                        setShapePreset((p) => ({ ...p, strokeColor: color }));
                        handleUpdate({ strokeColor: color });
                      }}
                      className={`w-7 h-7 rounded-full border border-slate-300 dark:border-slate-600 relative transition-transform ${
                        current === color ? 'scale-115 ring-2 ring-indigo-500' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Fill Color */}
            <div className="space-y-1.5">
              <label className="text-slate-500 dark:text-slate-400 font-medium">Fill Color</label>
              <div className="flex flex-wrap gap-2 items-center">
                <button
                  onClick={() => {
                    setShapePreset((p) => ({ ...p, fillColor: 'transparent' }));
                    handleUpdate({ fillColor: 'transparent' });
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 min-h-[36px] flex items-center"
                >
                  None
                </button>
                {COLOR_PALETTE.slice(0, 7).map((color) => {
                  const current = selectedObject?.type === 'shape' ? (selectedObject as ShapeObject).fillColor : shapePreset.fillColor;
                  return (
                    <button
                      key={color}
                      onClick={() => {
                        setShapePreset((p) => ({ ...p, fillColor: color }));
                        handleUpdate({ fillColor: color });
                      }}
                      className={`w-7 h-7 rounded-full border border-slate-300 dark:border-slate-600 relative transition-transform ${
                        current === color ? 'scale-115 ring-2 ring-indigo-500' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* REDACTION PROPERTIES */}
        {(selectedObject?.type === 'redaction' || toolMode === 'redact') && (
          <div className="space-y-4 bg-rose-50/50 dark:bg-rose-950/20 p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/40">
            <div className="font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              <span>True Redaction Security</span>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Redactions permanently destroy and mask underlying text and vectors. They cannot be uncovered by inspecting the PDF source.
            </p>

            <div className="space-y-1">
              <label className="text-slate-500 dark:text-slate-400 font-medium">Redaction Label</label>
              <input
                type="text"
                value={selectedObject?.type === 'redaction' ? ((selectedObject as RedactionObject).labelText || '') : redactionPreset.labelText}
                onChange={(e) => {
                  const val = e.target.value;
                  setRedactionPreset((p) => ({ ...p, labelText: val }));
                  handleUpdate({ labelText: val });
                }}
                placeholder="[REDACTED]"
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-200 min-h-[44px]"
              />
            </div>
          </div>
        )}

        {/* STAMPS & STICKY NOTES */}
        {(selectedObject?.type === 'annotation' || toolMode === 'stamp' || toolMode === 'sticky-note') && (
          <div className="space-y-4">
            <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
              <Stamp className="w-4 h-4 text-indigo-500" />
              <span>Official Stamps</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {STAMP_PRESETS.map((stamp) => (
                <button
                  key={stamp.label}
                  onClick={() => {
                    setAnnotationPreset((p) => ({ ...p, stampText: stamp.label, stampColor: stamp.color }));
                    handleUpdate({ stampText: stamp.label, stampColor: stamp.color });
                  }}
                  className="py-2.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-center font-bold tracking-wider text-[11px] transition-all min-h-[44px]"
                  style={{ color: stamp.color }}
                >
                  {stamp.label}
                </button>
              ))}
            </div>

            {selectedObject?.type === 'annotation' && (selectedObject as AnnotationObject).subtype === 'sticky-note' && (
              <div className="space-y-1.5 pt-2">
                <label className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                  <StickyNote className="w-4 h-4 text-amber-500" />
                  <span>Sticky Note Comment</span>
                </label>
                <textarea
                  rows={3}
                  value={(selectedObject as AnnotationObject).noteText || ''}
                  onChange={(e) => handleUpdate({ noteText: e.target.value })}
                  placeholder="Type your review note or feedback here..."
                  className="w-full bg-amber-50 dark:bg-slate-800 border border-amber-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-amber-500"
                />
              </div>
            )}
          </div>
        )}

        {/* DEFAULT / NO SELECTION: DOCUMENT INFO */}
        {!selectedObject && !['text', 'pen', 'highlighter', 'redact', 'stamp'].includes(toolMode) && (
          <div className="space-y-4 text-slate-600 dark:text-slate-400">
            <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
              <Sliders className="w-4 h-4 text-indigo-500" />
              <span>Document Specs</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                <span>Page Size:</span>
                <span className="font-medium text-slate-900 dark:text-slate-200 tabular-nums">
                  {Math.round(currentPage?.width || 595)} × {Math.round(currentPage?.height || 842)} pt
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                <span>Total Pages:</span>
                <span className="font-medium text-slate-900 dark:text-slate-200 tabular-nums">
                  {document?.pages.length || 0}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                <span>Active Page Objects:</span>
                <span className="font-medium text-slate-900 dark:text-slate-200 tabular-nums">
                  {currentPage?.objects.length || 0}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                onOpenMetadata();
                setIsMobilePropertiesOpen(false);
              }}
              className="w-full py-2.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs transition-colors flex items-center justify-center gap-1.5 min-h-[44px]"
            >
              <span>Edit PDF Metadata & Security</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* 1. DESKTOP PROPERTIES PANEL (lg:flex) */}
      <aside className="hidden lg:flex w-64 border-l border-slate-200 dark:border-slate-800 shrink-0">
        {inspectorContent}
      </aside>

      {/* 2. MOBILE BOTTOM SHEET / SLIDEOVER (< lg) */}
      {isMobilePropertiesOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex justify-end">
          {/* Backdrop */}
          <div
            onClick={() => setIsMobilePropertiesOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
          />
          {/* Slideover panel */}
          <div className="relative w-80 max-w-[85vw] h-full shadow-2xl z-50 animate-in slide-in-from-right duration-200">
            {inspectorContent}
          </div>
        </div>
      )}
    </>
  );
};
