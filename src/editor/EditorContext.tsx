/**
 * PDF Forge - Editor Context and State Management
 * Complete undo/redo history, multi-selection, page management, and tool configurations.
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  PDFDocumentState,
  PDFPageModel,
  EditorObject,
  ToolMode,
  SearchResult,
  DocumentMetadata,
  TextObject,
  ShapeObject,
  AnnotationObject,
  RedactionObject
} from '../types/pdf';
import { createWelcomeGuidePdf } from '../services/samplePdfs';
import { pdfRenderer } from '../services/pdfRenderer';
import { PDFDocument } from 'pdf-lib';

interface TextPreset {
  fontFamily: string;
  fontSize: number;
  color: string;
  backgroundColor?: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  underline: boolean;
  textAlign: 'left' | 'center' | 'right';
  opacity: number;
  direction: 'ltr' | 'rtl' | 'auto';
}

interface ShapePreset {
  strokeColor: string;
  strokeWidth: number;
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  strokeOpacity: number;
  fillColor: string;
  fillOpacity: number;
}

interface AnnotationPreset {
  color: string;
  opacity: number;
  subtype: 'highlight' | 'underline' | 'strikeout' | 'squiggly' | 'sticky-note' | 'stamp';
  stampText: string;
  stampColor: string;
}

interface RedactionPreset {
  overlayColor: string;
  labelText: string;
}

interface EditorContextType {
  document: PDFDocumentState | null;
  currentPageIndex: number;
  selectedObjectIds: string[];
  toolMode: ToolMode;
  zoom: number;
  viewRotation: number;
  theme: 'dark' | 'light';
  canUndo: boolean;
  canRedo: boolean;
  searchQuery: string;
  searchResults: SearchResult[];
  currentSearchIndex: number;
  isSearching: boolean;
  isLoading: boolean;
  loadingMessage: string;

  // Mobile drawer states
  isMobilePagesOpen: boolean;
  setIsMobilePagesOpen: (open: boolean) => void;
  isMobilePropertiesOpen: boolean;
  setIsMobilePropertiesOpen: (open: boolean) => void;

  // Presets
  textPreset: TextPreset;
  shapePreset: ShapePreset;
  annotationPreset: AnnotationPreset;
  redactionPreset: RedactionPreset;

  // Actions
  loadPdfBytes: (bytes: Uint8Array, name?: string) => Promise<void>;
  setCurrentPage: (pageIndex: number) => void;
  setToolMode: (mode: ToolMode) => void;
  setZoom: (zoom: number | ((prev: number) => number)) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  rotateView: (degrees: number) => void;
  toggleTheme: () => void;
  setSelectedObjectIds: (ids: string[]) => void;
  selectObject: (id: string, multi?: boolean) => void;
  clearSelection: () => void;

  addObject: (pageIndex: number, obj: EditorObject) => void;
  updateObject: (pageIndex: number, objId: string, updates: Partial<EditorObject>) => void;
  deleteSelectedObjects: () => void;
  reorderPages: (newOrder: number[]) => void;
  rotatePage: (pageIndex: number, degrees: number) => void;
  deletePage: (pageIndex: number) => void;
  duplicatePage: (pageIndex: number) => void;
  addBlankPage: (position?: number) => void;

  undo: () => void;
  redo: () => void;
  copySelection: () => void;
  pasteClipboard: () => void;
  updateMetadata: (metadata: Partial<DocumentMetadata>) => void;

  setTextPreset: React.Dispatch<React.SetStateAction<TextPreset>>;
  setShapePreset: React.Dispatch<React.SetStateAction<ShapePreset>>;
  setAnnotationPreset: React.Dispatch<React.SetStateAction<AnnotationPreset>>;
  setRedactionPreset: React.Dispatch<React.SetStateAction<RedactionPreset>>;

  setSearchQuery: (query: string) => void;
  setSearchResults: (results: SearchResult[]) => void;
  setCurrentSearchIndex: (idx: number) => void;
  nextSearchResult: () => void;
  prevSearchResult: () => void;
  setIsSearching: (isSearching: boolean) => void;
}

const EditorContext = createContext<EditorContextType | null>(null);

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [document, setDocument] = useState<PDFDocumentState | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [selectedObjectIds, setSelectedObjectIds] = useState<string[]>([]);
  const [toolMode, setToolMode] = useState<ToolMode>('select');
  const [zoom, setZoom] = useState<number>(1.0);
  const [viewRotation, setViewRotation] = useState<number>(0);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingMessage, setLoadingMessage] = useState<string>('Initializing PDF Forge...');
  const [isMobilePagesOpen, setIsMobilePagesOpen] = useState<boolean>(false);
  const [isMobilePropertiesOpen, setIsMobilePropertiesOpen] = useState<boolean>(false);

  // Undo / Redo history
  const historyRef = useRef<{ past: PDFDocumentState[]; future: PDFDocumentState[] }>({
    past: [],
    future: [],
  });
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);

  // Clipboard
  const clipboardRef = useRef<EditorObject[]>([]);

  // Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState<number>(0);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Tool Presets
  const [textPreset, setTextPreset] = useState<TextPreset>({
    fontFamily: 'Noto Sans',
    fontSize: 16,
    color: '#0f172a',
    backgroundColor: 'transparent',
    fontWeight: 'normal',
    fontStyle: 'normal',
    underline: false,
    textAlign: 'left',
    opacity: 1.0,
    direction: 'auto',
  });

  const [shapePreset, setShapePreset] = useState<ShapePreset>({
    strokeColor: '#2563eb',
    strokeWidth: 2,
    strokeStyle: 'solid',
    strokeOpacity: 1.0,
    fillColor: 'transparent',
    fillOpacity: 0.2,
  });

  const [annotationPreset, setAnnotationPreset] = useState<AnnotationPreset>({
    color: '#facc15',
    opacity: 0.4,
    subtype: 'highlight',
    stampText: 'APPROVED',
    stampColor: '#dc2626',
  });

  const [redactionPreset, setRedactionPreset] = useState<RedactionPreset>({
    overlayColor: '#000000',
    labelText: '[REDACTED]',
  });

  // Apply dark mode class to document root
  useEffect(() => {
    if (theme === 'dark') {
      window.document.documentElement.classList.add('dark');
    } else {
      window.document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const updateHistoryState = () => {
    setCanUndo(historyRef.current.past.length > 0);
    setCanRedo(historyRef.current.future.length > 0);
  };

  const pushHistory = (newDoc: PDFDocumentState) => {
    if (document) {
      historyRef.current.past.push(JSON.parse(JSON.stringify(document)));
      if (historyRef.current.past.length > 30) {
        historyRef.current.past.shift();
      }
      historyRef.current.future = [];
      updateHistoryState();
    }
    setDocument(newDoc);
  };

  // Load PDF Bytes into Editor
  const loadPdfBytes = useCallback(async (bytes: Uint8Array, name: string = 'Document.pdf') => {
    try {
      setIsLoading(true);
      setLoadingMessage(`Loading ${name}...`);

      // Ensure we have an independent copy of bytes so worker transfer never detaches user data
      const safeBytes = new Uint8Array(bytes);
      let pageCount = 0;
      let renderedPages: { width: number; height: number; rotation: number }[] = [];

      try {
        const result = await pdfRenderer.loadDocument(safeBytes);
        pageCount = result.pageCount;
        renderedPages = result.pages;
      } catch (renderErr) {
        console.warn('PDF.js renderer loading encountered an issue, falling back to pdf-lib parser:', renderErr);
        // Fallback to pdf-lib for parsing external PDF structure
        const pdfDoc = await PDFDocument.load(safeBytes, { ignoreEncryption: true });
        pageCount = pdfDoc.getPageCount();
        renderedPages = pdfDoc.getPages().map((p) => {
          const { width, height } = p.getSize();
          return {
            width: width || 595.28,
            height: height || 841.89,
            rotation: p.getRotation().angle || 0,
          };
        });
      }

      if (pageCount === 0 || renderedPages.length === 0) {
        throw new Error('No valid pages found in PDF');
      }

      const pageModels: PDFPageModel[] = renderedPages.map((p, idx) => ({
        id: `page_${idx + 1}_${Date.now()}`,
        pageNumber: idx + 1,
        width: p.width,
        height: p.height,
        rotation: p.rotation || 0,
        objects: [],
      }));

      const newDoc: PDFDocumentState = {
        id: `doc_${Date.now()}`,
        name,
        pageCount,
        pages: pageModels,
        originalPdfBytes: safeBytes.slice(0),
        metadata: {
          title: name.replace('.pdf', ''),
          author: 'Local User',
          subject: '',
          keywords: '',
          creator: 'PDF Forge',
          producer: 'PDF Forge Engine',
        },
        isEncrypted: false,
      };

      historyRef.current = { past: [], future: [] };
      updateHistoryState();
      setDocument(newDoc);
      setCurrentPageIndex(0);
      setSelectedObjectIds([]);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Failed to load PDF bytes:', err);
      setIsLoading(false);
      alert(`Unable to open this PDF document: ${err?.message || 'File corrupted or unsupported structure'}`);
    }
  }, []);

  // Initial load: create and load Welcome Guide
  useEffect(() => {
    async function initWelcome() {
      try {
        const welcomeBytes = await createWelcomeGuidePdf();
        await loadPdfBytes(welcomeBytes, 'PDF_Forge_Welcome_Guide.pdf');
      } catch (err) {
        console.error('Initial guide load error:', err);
        setIsLoading(false);
      }
    }
    initWelcome();
  }, [loadPdfBytes]);

  const undo = () => {
    if (historyRef.current.past.length === 0 || !document) return;
    const previous = historyRef.current.past.pop()!;
    historyRef.current.future.push(JSON.parse(JSON.stringify(document)));
    setDocument(previous);
    updateHistoryState();
  };

  const redo = () => {
    if (historyRef.current.future.length === 0 || !document) return;
    const next = historyRef.current.future.pop()!;
    historyRef.current.past.push(JSON.parse(JSON.stringify(document)));
    setDocument(next);
    updateHistoryState();
  };

  const addObject = (pageIndex: number, obj: EditorObject) => {
    if (!document) return;
    const newPages = [...document.pages];
    const targetPage = { ...newPages[pageIndex] };
    targetPage.objects = [...targetPage.objects, obj];
    newPages[pageIndex] = targetPage;
    pushHistory({ ...document, pages: newPages });
    setSelectedObjectIds([obj.id]);
  };

  const updateObject = (pageIndex: number, objId: string, updates: Partial<EditorObject>) => {
    if (!document) return;
    const newPages = [...document.pages];
    const targetPage = { ...newPages[pageIndex] };
    targetPage.objects = targetPage.objects.map((o) => (o.id === objId ? ({ ...o, ...updates } as EditorObject) : o));
    newPages[pageIndex] = targetPage;
    pushHistory({ ...document, pages: newPages });
  };

  const deleteSelectedObjects = () => {
    if (!document || selectedObjectIds.length === 0) return;
    const newPages = document.pages.map((page, pageIdx) => {
      if (pageIdx !== currentPageIndex) return page;

      const toDelete = page.objects.filter((obj) => selectedObjectIds.includes(obj.id));
      const remaining = page.objects.filter((obj) => !selectedObjectIds.includes(obj.id));

      // For any deleted item from original PDF (image or text), retain mask so original is removed on export
      for (const obj of toDelete) {
        const mask = (obj as any).originalMask;
        if (mask) {
          remaining.push({
            id: `mask_deleted_${Date.now()}_${Math.random()}`,
            type: 'shape',
            shapeType: 'rectangle',
            x: mask.x,
            y: mask.y,
            width: mask.width,
            height: mask.height,
            strokeColor: 'transparent',
            strokeWidth: 0,
            strokeStyle: 'solid',
            strokeOpacity: 0,
            fillColor: '#ffffff',
            fillOpacity: 1.0,
          } as ShapeObject);
        }
      }

      return {
        ...page,
        objects: remaining,
      };
    });

    pushHistory({ ...document, pages: newPages });
    setSelectedObjectIds([]);
  };

  const selectObject = (id: string, multi = false) => {
    if (multi) {
      setSelectedObjectIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    } else {
      setSelectedObjectIds([id]);
    }
  };

  const clearSelection = () => {
    setSelectedObjectIds([]);
  };

  const reorderPages = (newOrder: number[]) => {
    if (!document) return;
    const newPages = newOrder.map((oldIdx) => document.pages[oldIdx]);
    pushHistory({ ...document, pages: newPages });
  };

  const rotatePage = (pageIndex: number, degrees: number) => {
    if (!document) return;
    const newPages = [...document.pages];
    const targetPage = { ...newPages[pageIndex] };
    targetPage.rotation = (targetPage.rotation + degrees) % 360;
    newPages[pageIndex] = targetPage;
    pushHistory({ ...document, pages: newPages });
  };

  const deletePage = (pageIndex: number) => {
    if (!document || document.pages.length <= 1) return;
    const newPages = document.pages.filter((_, idx) => idx !== pageIndex);
    const newCurrent = Math.min(currentPageIndex, newPages.length - 1);
    setCurrentPageIndex(newCurrent);
    pushHistory({ ...document, pages: newPages, pageCount: newPages.length });
  };

  const duplicatePage = (pageIndex: number) => {
    if (!document) return;
    const sourcePage = document.pages[pageIndex];
    const clonedPage: PDFPageModel = {
      ...JSON.parse(JSON.stringify(sourcePage)),
      id: `page_${Date.now()}`,
    };
    const newPages = [...document.pages];
    newPages.splice(pageIndex + 1, 0, clonedPage);
    pushHistory({ ...document, pages: newPages, pageCount: newPages.length });
    setCurrentPageIndex(pageIndex + 1);
  };

  const addBlankPage = (position?: number) => {
    if (!document) return;
    const insertIdx = position !== undefined ? position : document.pages.length;
    const blankPage: PDFPageModel = {
      id: `blank_${Date.now()}`,
      pageNumber: 9999, // newly added
      width: 595.28,
      height: 841.89,
      rotation: 0,
      objects: [],
    };
    const newPages = [...document.pages];
    newPages.splice(insertIdx, 0, blankPage);
    pushHistory({ ...document, pages: newPages, pageCount: newPages.length });
    setCurrentPageIndex(insertIdx);
  };

  const copySelection = () => {
    if (!document || selectedObjectIds.length === 0) return;
    const currentPage = document.pages[currentPageIndex];
    const selected = currentPage.objects.filter((o) => selectedObjectIds.includes(o.id));
    clipboardRef.current = JSON.parse(JSON.stringify(selected));
  };

  const pasteClipboard = () => {
    if (!document || clipboardRef.current.length === 0) return;
    const newObjects = clipboardRef.current.map((obj) => ({
      ...obj,
      id: `obj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      x: obj.x + 20,
      y: obj.y + 20,
    }));
    const newPages = [...document.pages];
    const targetPage = { ...newPages[currentPageIndex] };
    targetPage.objects = [...targetPage.objects, ...newObjects];
    newPages[currentPageIndex] = targetPage;
    pushHistory({ ...document, pages: newPages });
    setSelectedObjectIds(newObjects.map((o) => o.id));
  };

  const updateMetadata = (metadata: Partial<DocumentMetadata>) => {
    if (!document) return;
    pushHistory({
      ...document,
      metadata: { ...document.metadata, ...metadata },
    });
  };

  const zoomIn = () => setZoom((z) => Math.min(3.0, Math.round((z + 0.15) * 100) / 100));
  const zoomOut = () => setZoom((z) => Math.max(0.4, Math.round((z - 0.15) * 100) / 100));
  const resetZoom = () => setZoom(1.0);
  const rotateView = (deg: number) => setViewRotation((prev) => (prev + deg) % 360);
  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  const nextSearchResult = () => {
    if (searchResults.length === 0) return;
    const nextIdx = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIdx);
    setCurrentPageIndex(searchResults[nextIdx].pageNumber - 1);
  };

  const prevSearchResult = () => {
    if (searchResults.length === 0) return;
    const prevIdx = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentSearchIndex(prevIdx);
    setCurrentPageIndex(searchResults[prevIdx].pageNumber - 1);
  };

  return (
    <EditorContext.Provider
      value={{
        document,
        currentPageIndex,
        selectedObjectIds,
        toolMode,
        zoom,
        viewRotation,
        theme,
        canUndo,
        canRedo,
        searchQuery,
        searchResults,
        currentSearchIndex,
        isSearching,
        isLoading,
        loadingMessage,
        isMobilePagesOpen,
        setIsMobilePagesOpen,
        isMobilePropertiesOpen,
        setIsMobilePropertiesOpen,
        textPreset,
        shapePreset,
        annotationPreset,
        redactionPreset,
        loadPdfBytes,
        setCurrentPage: setCurrentPageIndex,
        setToolMode,
        setZoom,
        zoomIn,
        zoomOut,
        resetZoom,
        rotateView,
        toggleTheme,
        setSelectedObjectIds,
        selectObject,
        clearSelection,
        addObject,
        updateObject,
        deleteSelectedObjects,
        reorderPages,
        rotatePage,
        deletePage,
        duplicatePage,
        addBlankPage,
        undo,
        redo,
        copySelection,
        pasteClipboard,
        updateMetadata,
        setTextPreset,
        setShapePreset,
        setAnnotationPreset,
        setRedactionPreset,
        setSearchQuery,
        setSearchResults,
        setCurrentSearchIndex,
        nextSearchResult,
        prevSearchResult,
        setIsSearching,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
};
