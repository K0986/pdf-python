/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { EditorProvider, useEditor } from './editor/EditorContext';
import { Navbar } from './components/Navbar';
import { Toolbar } from './components/Toolbar';
import { PageThumbnailsSidebar } from './components/PageThumbnailsSidebar';
import { PdfCanvas } from './components/PdfCanvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { SearchModal } from './components/SearchModal';
import { PageManagerModal } from './components/PageManagerModal';
import { MetadataModal } from './components/MetadataModal';
import { OcrModal } from './components/OcrModal';
import { LocalLauncherModal } from './components/LocalLauncherModal';
import { exportDocumentToPdf, downloadBlob } from './services/pdfExporter';

function EditorLayout() {
  const {
    document,
    isLoading,
    loadingMessage,
    undo,
    redo,
    deleteSelectedObjects,
    copySelection,
    pasteClipboard,
    setToolMode,
    clearSelection,
    zoomIn,
    zoomOut,
    resetZoom,
  } = useEditor();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isPageManagerOpen, setIsPageManagerOpen] = useState(false);
  const [isMetadataOpen, setIsMetadataOpen] = useState(false);
  const [isOcrOpen, setIsOcrOpen] = useState(false);
  const [isLocalHubOpen, setIsLocalHubOpen] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const { loadPdfBytes } = useEditor();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDraggingFile(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingFile(false);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type === 'application/pdf' || file.name.endsWith('.pdf'))) {
      const reader = new FileReader();
      reader.onload = async () => {
        const buffer = reader.result as ArrayBuffer;
        await loadPdfBytes(new Uint8Array(buffer), file.name);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Global Keyboard Shortcuts (Section 18)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Don't intercept typing in inputs or contentEditable
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Ctrl + Z: Undo
      if (cmdOrCtrl && !e.shiftKey && e.key.toLowerCase() === 'z') {
        if (!isInput) {
          e.preventDefault();
          undo();
        }
      }

      // Ctrl + Shift + Z or Ctrl + Y: Redo
      if (
        (cmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'z') ||
        (cmdOrCtrl && e.key.toLowerCase() === 'y')
      ) {
        if (!isInput) {
          e.preventDefault();
          redo();
        }
      }

      // Ctrl + F: Search
      if (cmdOrCtrl && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsSearchOpen(true);
      }

      // Ctrl + S: Export PDF
      if (cmdOrCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (document) {
          exportDocumentToPdf(document).then((bytes) => {
            downloadBlob(bytes, document.name || 'document.pdf');
          });
        }
      }

      // Ctrl + C: Copy
      if (cmdOrCtrl && e.key.toLowerCase() === 'c' && !isInput) {
        copySelection();
      }

      // Ctrl + V: Paste
      if (cmdOrCtrl && e.key.toLowerCase() === 'v' && !isInput) {
        pasteClipboard();
      }

      // Delete / Backspace: Delete object
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isInput) {
        e.preventDefault();
        deleteSelectedObjects();
      }

      // Escape: Cancel tool and clear selection
      if (e.key === 'Escape') {
        setToolMode('select');
        clearSelection();
        setIsSearchOpen(false);
        setIsPageManagerOpen(false);
        setIsMetadataOpen(false);
        setIsOcrOpen(false);
        setIsLocalHubOpen(false);
      }

      // Zoom + / -
      if (!isInput) {
        if (e.key === '+' || e.key === '=') zoomIn();
        if (e.key === '-') zoomOut();
        if (e.key === '0') resetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    document,
    undo,
    redo,
    deleteSelectedObjects,
    copySelection,
    pasteClipboard,
    setToolMode,
    clearSelection,
    zoomIn,
    zoomOut,
    resetZoom,
  ]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleFileDrop}
      className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 font-sans relative"
    >
      {/* Drag & Drop File Overlay */}
      {isDraggingFile && (
        <div className="absolute inset-0 z-50 bg-indigo-600/90 backdrop-blur-sm flex flex-col items-center justify-center text-white border-4 border-dashed border-white m-4 rounded-3xl animate-in fade-in duration-150">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold">Drop PDF Document Here</h2>
          <p className="text-sm text-indigo-100 mt-1">Instant local parsing & editing</p>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenPageManager={() => setIsPageManagerOpen(true)}
        onOpenLocalHub={() => setIsLocalHubOpen(true)}
        onOpenMetadata={() => setIsMetadataOpen(true)}
      />

      {/* Horizontal Toolbar on Mobile Screens (< md) */}
      <div className="md:hidden shrink-0">
        <Toolbar
          onOpenPageManager={() => setIsPageManagerOpen(true)}
          onOpenOcr={() => setIsOcrOpen(true)}
          mode="mobile"
        />
      </div>

      {/* Main Workspace: Left Tool strip + Thumbnails Sidebar + Center Canvas + Right Properties */}
      <div className="flex flex-1 overflow-hidden relative">
        <div className="hidden md:flex shrink-0">
          <Toolbar
            onOpenPageManager={() => setIsPageManagerOpen(true)}
            onOpenOcr={() => setIsOcrOpen(true)}
            mode="desktop"
          />
        </div>
        <PageThumbnailsSidebar />
        <PdfCanvas />
        <PropertiesPanel onOpenMetadata={() => setIsMetadataOpen(true)} />

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center z-50 transition-all">
            <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
            <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
              {loadingMessage}
            </div>
            <div className="text-xs text-slate-400 mt-1">Local processing</div>
          </div>
        )}
      </div>

      {/* Modals */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <PageManagerModal isOpen={isPageManagerOpen} onClose={() => setIsPageManagerOpen(false)} />
      <MetadataModal isOpen={isMetadataOpen} onClose={() => setIsMetadataOpen(false)} />
      <OcrModal isOpen={isOcrOpen} onClose={() => setIsOcrOpen(false)} />
      <LocalLauncherModal isOpen={isLocalHubOpen} onClose={() => setIsLocalHubOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <EditorProvider>
      <EditorLayout />
    </EditorProvider>
  );
}
