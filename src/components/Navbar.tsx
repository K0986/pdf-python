/**
 * PDF Forge - Responsive Touch & Mobile Navigation Bar
 * 44px touch targets, mobile menu dropdown, clean layout across phone, tablet, and desktop viewports.
 */
import React, { useRef, useState } from 'react';
import {
  FolderOpen,
  Download,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Search,
  Moon,
  Sun,
  FileText,
  FilePlus,
  Terminal,
  ChevronDown,
  Sparkles,
  Maximize2,
  Menu,
  X,
  Layers,
  Sliders
} from 'lucide-react';
import { useEditor } from '../editor/EditorContext';
import { exportDocumentToPdf, downloadBlob } from '../services/pdfExporter';
import { createWelcomeGuidePdf, createBlankDocument, createMutualNdaSamplePdf } from '../services/samplePdfs';

interface NavbarProps {
  onOpenSearch: () => void;
  onOpenPageManager: () => void;
  onOpenLocalHub: () => void;
  onOpenMetadata: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSearch,
  onOpenPageManager,
  onOpenLocalHub,
  onOpenMetadata,
}) => {
  const {
    document,
    canUndo,
    canRedo,
    undo,
    redo,
    zoom,
    zoomIn,
    zoomOut,
    resetZoom,
    rotateView,
    theme,
    toggleTheme,
    loadPdfBytes,
    isMobilePagesOpen,
    setIsMobilePagesOpen,
    isMobilePropertiesOpen,
    setIsMobilePropertiesOpen,
  } = useEditor();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showTemplatesMenu, setShowTemplatesMenu] = useState(false);
  const [showMobileMoreMenu, setShowMobileMoreMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      await loadPdfBytes(new Uint8Array(arrayBuffer), file.name);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
    setShowMobileMoreMenu(false);
  };

  const handleExportPdf = async () => {
    if (!document) return;
    try {
      setIsExporting(true);
      setShowExportMenu(false);
      setShowMobileMoreMenu(false);
      const pdfBytes = await exportDocumentToPdf(document);
      const filename = document.name.endsWith('.pdf') ? document.name : `${document.name}.pdf`;
      downloadBlob(pdfBytes, filename, 'application/pdf');
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPageImage = async () => {
    setShowExportMenu(false);
    setShowMobileMoreMenu(false);
    const canvas = window.document.querySelector('#pdf-render-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const a = window.document.createElement('a');
    a.href = dataUrl;
    a.download = `page_export_${Date.now()}.png`;
    a.click();
  };

  return (
    <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 sm:px-4 flex items-center justify-between select-none z-30 transition-colors shadow-xs shrink-0">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="application/pdf"
        className="hidden"
      />

      {/* Left: Branding & Document Info */}
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white tracking-tight shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-xs">
            <FileText className="w-4 h-4" />
          </div>
          <span className="text-sm sm:text-base font-semibold">PDF Forge</span>
        </div>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

        {/* Current Document Name */}
        <button
          onClick={onOpenMetadata}
          title="Click to view & edit PDF metadata"
          className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 px-1.5 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors max-w-[120px] sm:max-w-[200px] truncate"
        >
          <span className="truncate font-medium">{document?.name || 'Untitled'}</span>
          <span className="text-[10px] text-slate-400">({document?.pages.length || 0}p)</span>
        </button>
      </div>

      {/* Center: Undo, Redo, Zoom (on tablet/desktop) */}
      <div className="hidden sm:flex items-center gap-1 md:gap-2">
        {/* Open Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="min-h-[38px] px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
          title="Open PDF (Ctrl+O)"
        >
          <FolderOpen className="w-4 h-4 text-indigo-500" />
          <span className="hidden md:inline">Open</span>
        </button>

        {/* Samples Menu */}
        <div className="relative">
          <button
            onClick={() => setShowTemplatesMenu(!showTemplatesMenu)}
            className="min-h-[38px] px-2 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden md:inline">Samples</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showTemplatesMenu && (
            <div className="absolute left-0 mt-1 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl py-1 z-50 text-xs">
              <button
                onClick={async () => {
                  setShowTemplatesMenu(false);
                  const bytes = await createMutualNdaSamplePdf();
                  await loadPdfBytes(bytes, 'Mutual_Non_Disclosure_Agreement.pdf');
                }}
                className="w-full text-left px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 min-h-[44px]"
              >
                <FileText className="w-4 h-4 text-purple-500" />
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Mutual NDA Agreement</div>
                  <div className="text-[10px] text-slate-400">Apex & Nova Systems (2 pages)</div>
                </div>
              </button>
              <button
                onClick={async () => {
                  setShowTemplatesMenu(false);
                  const bytes = await createWelcomeGuidePdf();
                  await loadPdfBytes(bytes, 'PDF_Forge_Welcome_Guide.pdf');
                }}
                className="w-full text-left px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 min-h-[44px] border-t border-slate-100 dark:border-slate-800"
              >
                <FileText className="w-4 h-4 text-indigo-500" />
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Welcome & Feature Guide</div>
                  <div className="text-[10px] text-slate-400">Complete tour of tools & redaction</div>
                </div>
              </button>
              <button
                onClick={async () => {
                  setShowTemplatesMenu(false);
                  const bytes = await createBlankDocument(1);
                  await loadPdfBytes(bytes, 'Blank_Document.pdf');
                }}
                className="w-full text-left px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 min-h-[44px] border-t border-slate-100 dark:border-slate-800"
              >
                <FilePlus className="w-4 h-4 text-emerald-500" />
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">New Blank Page</div>
                  <div className="text-[10px] text-slate-400">Fresh clean canvas</div>
                </div>
              </button>
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* Undo / Redo */}
        <div className="flex items-center">
          <button
            onClick={undo}
            disabled={!canUndo}
            className={`min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg transition-colors ${
              canUndo
                ? 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                : 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className={`min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg transition-colors ${
              canRedo
                ? 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                : 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden md:block" />

        {/* Rotate View */}
        <button
          onClick={() => rotateView(90)}
          className="min-w-[36px] min-h-[36px] hidden md:flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="Rotate View 90°"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      {/* Right: Actions, Theme, Export, Mobile Menu */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* Undo on mobile */}
        <div className="flex items-center sm:hidden">
          <button
            onClick={undo}
            disabled={!canUndo}
            className={`min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg ${
              canUndo ? 'text-slate-700 dark:text-slate-300' : 'text-slate-300 dark:text-slate-700'
            }`}
          >
            <Undo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <button
          onClick={onOpenSearch}
          className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="Search in PDF (Ctrl+F)"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Local Python Hub Info Modal */}
        <button
          onClick={onOpenLocalHub}
          className="min-h-[36px] hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition-colors"
          title="Python Engine Architecture"
        >
          <Terminal className="w-3.5 h-3.5 text-emerald-500" />
          <span className="hidden xl:inline">Local Engine</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title={`Switch Theme`}
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={isExporting}
            className="min-h-[40px] px-3 flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{isExporting ? 'Saving...' : 'Export'}</span>
            <ChevronDown className="w-3 h-3 text-indigo-200 hidden sm:inline" />
          </button>

          {showExportMenu && (
            <div className="absolute right-0 mt-1.5 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl py-1.5 z-50 text-xs">
              <button
                onClick={handleExportPdf}
                className="w-full text-left px-3.5 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 min-h-[44px]"
              >
                <Download className="w-4 h-4 text-indigo-500 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Save as PDF</div>
                  <div className="text-[10px] text-slate-400">Genuine compiled PDF</div>
                </div>
              </button>
              <button
                onClick={handleExportPageImage}
                className="w-full text-left px-3.5 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 min-h-[44px] border-t border-slate-100 dark:border-slate-800"
              >
                <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Export Page as PNG</div>
                  <div className="text-[10px] text-slate-400">High-DPI raster image</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Mobile More Actions Menu Toggle (< sm) */}
        <div className="relative sm:hidden">
          <button
            onClick={() => setShowMobileMoreMenu(!showMobileMoreMenu)}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>

          {showMobileMoreMenu && (
            <div className="absolute right-0 mt-1.5 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-50 text-xs space-y-1">
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowMobileMoreMenu(false);
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 min-h-[44px] text-slate-800 dark:text-slate-200 font-medium"
              >
                <FolderOpen className="w-4 h-4 text-indigo-500" />
                <span>Open PDF File</span>
              </button>

              <button
                onClick={() => {
                  onOpenPageManager();
                  setShowMobileMoreMenu(false);
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 min-h-[44px] text-slate-800 dark:text-slate-200 font-medium"
              >
                <Layers className="w-4 h-4 text-purple-500" />
                <span>Page Organizer</span>
              </button>

              <button
                onClick={() => {
                  onOpenMetadata();
                  setShowMobileMoreMenu(false);
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 min-h-[44px] text-slate-800 dark:text-slate-200 font-medium"
              >
                <Sliders className="w-4 h-4 text-amber-500" />
                <span>Document Properties</span>
              </button>

              <button
                onClick={() => {
                  onOpenLocalHub();
                  setShowMobileMoreMenu(false);
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 min-h-[44px] text-slate-800 dark:text-slate-200 font-medium border-t border-slate-100 dark:border-slate-800"
              >
                <Terminal className="w-4 h-4 text-emerald-500" />
                <span>Local Engine Info</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
