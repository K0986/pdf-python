/**
 * PDF Forge - Page Manager Modal
 * Visual grid organizer: batch rotation, page extraction, deletion, merge, and split.
 */
import React, { useState } from 'react';
import {
  X,
  RotateCw,
  Trash2,
  Copy,
  Plus,
  Layers,
  ArrowRightLeft,
  FileDown,
  Merge
} from 'lucide-react';
import { useEditor } from '../editor/EditorContext';
import { exportDocumentToPdf, downloadBlob } from '../services/pdfExporter';
import { PDFDocument } from 'pdf-lib';

interface PageManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PageManagerModal: React.FC<PageManagerModalProps> = ({ isOpen, onClose }) => {
  const {
    document,
    rotatePage,
    deletePage,
    duplicatePage,
    addBlankPage,
    loadPdfBytes,
  } = useEditor();

  const [selectedPages, setSelectedPages] = useState<number[]>([]);

  if (!isOpen || !document) return null;

  const togglePageSelection = (idx: number) => {
    setSelectedPages((prev) => (prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]));
  };

  const handleSelectAll = () => {
    if (selectedPages.length === document.pages.length) {
      setSelectedPages([]);
    } else {
      setSelectedPages(document.pages.map((_, i) => i));
    }
  };

  const handleBatchRotate = (degrees: number) => {
    selectedPages.forEach((idx) => rotatePage(idx, degrees));
  };

  const handleBatchDelete = () => {
    if (selectedPages.length >= document.pages.length) return;
    // Delete in descending order so indices don't shift
    const sorted = [...selectedPages].sort((a, b) => b - a);
    sorted.forEach((idx) => deletePage(idx));
    setSelectedPages([]);
  };

  const handleExtractSelected = async () => {
    if (selectedPages.length === 0) return;
    try {
      const extractedPagesState = {
        ...document,
        pages: selectedPages.map((i) => document.pages[i]),
        name: `Extracted_Pages_${Date.now()}.pdf`,
      };
      const bytes = await exportDocumentToPdf(extractedPagesState);
      downloadBlob(bytes, `Extracted_Pages_${Date.now()}.pdf`);
    } catch (err) {
      console.error('Extract pages failed:', err);
    }
  };

  const handleMergePdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const currentBytes = await exportDocumentToPdf(document);

      const targetDoc = await PDFDocument.load(currentBytes);
      const incomingDoc = await PDFDocument.load(new Uint8Array(arrayBuffer));

      const copiedPages = await targetDoc.copyPages(incomingDoc, incomingDoc.getPageIndices());
      copiedPages.forEach((p) => targetDoc.addPage(p));

      const mergedBytes = await targetDoc.save();
      await loadPdfBytes(mergedBytes, `Merged_${document.name}`);
      onClose();
    } catch (err) {
      console.error('Merge failed:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden transition-colors">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200 text-sm">
            <Layers className="w-4 h-4 text-indigo-500" />
            <span>Page Organizer & Batch Manager</span>
            <span className="text-xs text-slate-400">({document.pages.length} pages)</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Controls Bar */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 font-medium text-slate-700 dark:text-slate-300"
            >
              {selectedPages.length === document.pages.length ? 'Deselect All' : 'Select All'}
            </button>
            <span className="text-slate-400">{selectedPages.length} selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBatchRotate(90)}
              disabled={selectedPages.length === 0}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40"
            >
              <RotateCw className="w-3.5 h-3.5 text-indigo-500" />
              <span>Rotate 90°</span>
            </button>

            <button
              onClick={handleExtractSelected}
              disabled={selectedPages.length === 0}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40"
            >
              <FileDown className="w-3.5 h-3.5 text-emerald-500" />
              <span>Extract Selected</span>
            </button>

            <label className="flex items-center gap-1 px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
              <Merge className="w-3.5 h-3.5 text-purple-500" />
              <span>Merge Another PDF</span>
              <input type="file" accept="application/pdf" onChange={handleMergePdf} className="hidden" />
            </label>

            <button
              onClick={() => addBlankPage()}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Blank</span>
            </button>

            {selectedPages.length > 0 && selectedPages.length < document.pages.length && (
              <button
                onClick={handleBatchDelete}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-400 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>

        {/* Page Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {document.pages.map((page, index) => {
            const isSelected = selectedPages.includes(index);

            return (
              <div
                key={page.id}
                onClick={() => togglePageSelection(index)}
                className={`relative rounded-xl border-2 p-3 bg-white dark:bg-slate-800 flex flex-col items-center cursor-pointer transition-all ${
                  isSelected
                    ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md scale-[1.02]'
                    : 'border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {/* Selection Checkbox */}
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}}
                  className="absolute top-2 left-2 rounded accent-indigo-600 z-10"
                />

                {/* Page Canvas Container */}
                <div
                  className="w-full aspect-[1/1.4] bg-slate-100 dark:bg-slate-900 rounded-lg flex items-center justify-center relative overflow-hidden border border-slate-200/40 dark:border-slate-700/40"
                  style={{ transform: `rotate(${page.rotation || 0}deg)` }}
                >
                  <div className="text-center p-2">
                    <span className="text-2xl font-bold text-slate-300 dark:text-slate-600">
                      {index + 1}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {Math.round(page.width)} × {Math.round(page.height)}
                    </div>
                  </div>
                </div>

                {/* Page Footer Label */}
                <div className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Page {index + 1}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
