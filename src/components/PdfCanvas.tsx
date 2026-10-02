/**
 * PDF Forge - Main PDF Canvas & Direct In-PDF Engine
 * Direct in-PDF text editing (erases original glyphs on canvas with inline transparent editing)
 * and true image manipulation (wipes original image on drag/delete, instant drag on mousedown, and replacement).
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useEditor } from '../editor/EditorContext';
import { pdfRenderer } from '../services/pdfRenderer';
import {
  EditorObject,
  TextObject,
  ImageObject,
  ShapeObject,
  AnnotationObject,
  RedactionObject,
  ExtractedTextSpan,
  ExtractedImage,
  Point
} from '../types/pdf';
import {
  StickyNote,
  Stamp,
  ShieldAlert,
  Copy,
  Highlighter as HighlightIcon,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Sliders,
  Layers,
  Image as ImageIcon,
  RefreshCw,
  Trash2,
  Download,
  Edit3
} from 'lucide-react';

export const PdfCanvas: React.FC = () => {
  const {
    document,
    currentPageIndex,
    setCurrentPage,
    zoom,
    setZoom,
    zoomIn,
    zoomOut,
    viewRotation,
    toolMode,
    selectedObjectIds,
    selectObject,
    clearSelection,
    addObject,
    updateObject,
    deleteSelectedObjects,
    textPreset,
    shapePreset,
    annotationPreset,
    redactionPreset,
    searchResults,
    currentSearchIndex,
    isMobilePagesOpen,
    setIsMobilePagesOpen,
    isMobilePropertiesOpen,
    setIsMobilePropertiesOpen,
  } = useEditor();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const replaceImageInputRef = useRef<HTMLInputElement>(null);

  const [pageSize, setPageSize] = useState<{ width: number; height: number }>({ width: 595, height: 842 });
  const [extractedSpans, setExtractedSpans] = useState<ExtractedTextSpan[]>([]);
  const [detectedImages, setDetectedImages] = useState<ExtractedImage[]>([]);
  const [hoveredSpan, setHoveredSpan] = useState<ExtractedTextSpan | null>(null);
  const [activeSpanActionMenu, setActiveSpanActionMenu] = useState<{ span: ExtractedTextSpan; x: number; y: number } | null>(null);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<Point>({ x: 0, y: 0 });
  const [drawCurrent, setDrawCurrent] = useState<Point>({ x: 0, y: 0 });
  const [freehandPoints, setFreehandPoints] = useState<Point[]>([]);

  // Dragging / Moving objects
  const [isDraggingObject, setIsDraggingObject] = useState(false);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });
  const [activeDragObjectId, setActiveDragObjectId] = useState<string | null>(null);

  // Resizing objects
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 0, y: 0, width: 0, height: 0
  });

  // Touch Pinch-to-zoom tracking
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number>(1.0);

  const currentPage = document?.pages[currentPageIndex];

  // Helper: Erases a region on the PDF.js background canvas by sampling surrounding color
  const eraseRegionOnCanvas = useCallback((x: number, y: number, width: number, height: number, customColor?: string) => {
    if (!canvasRef.current) return;
    const cvs = canvasRef.current;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const sx = Math.floor(x * zoom * dpr);
    const sy = Math.floor(y * zoom * dpr);
    const sw = Math.ceil(width * zoom * dpr);
    const sh = Math.ceil(height * zoom * dpr);

    let fillColor = customColor || '#ffffff';

    if (!customColor) {
      try {
        const sampleX = Math.max(0, sx - 2);
        const sampleY = Math.max(0, sy - 2);
        const pixel = ctx.getImageData(sampleX, sampleY, 1, 1).data;
        if (pixel[3] > 0) {
          fillColor = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
        }
      } catch {
        fillColor = '#ffffff';
      }
    }

    ctx.save();
    ctx.fillStyle = fillColor;
    ctx.fillRect(sx, sy, sw, sh);
    ctx.restore();
  }, [zoom]);

  // Auto-fit to screen on mobile
  const handleFitWidth = useCallback(() => {
    if (!wrapperRef.current || !pageSize.width) return;
    const availableWidth = wrapperRef.current.clientWidth - (window.innerWidth < 640 ? 24 : 64);
    if (availableWidth > 0 && pageSize.width > 0) {
      const calculatedZoom = Math.max(0.4, Math.min(2.5, Math.round((availableWidth / pageSize.width) * 100) / 100));
      setZoom(calculatedZoom);
    }
  }, [pageSize.width, setZoom]);

  useEffect(() => {
    if (window.innerWidth < 768 && pageSize.width > 0) {
      handleFitWidth();
    }
  }, [pageSize.width, handleFitWidth]);

  // 1. Render PDF Page to Canvas and re-apply active canvas erasures
  useEffect(() => {
    if (!document || !canvasRef.current) return;
    const pageNum = currentPage?.pageNumber || 1;

    let isMounted = true;
    async function renderPage() {
      try {
        if (document?.originalPdfBytes && pageNum <= 500) {
          const dims = await pdfRenderer.renderPageToCanvas(
            pageNum,
            canvasRef.current!,
            zoom,
            (currentPage?.rotation || 0) + viewRotation
          );
          if (isMounted) {
            setPageSize({ width: dims.width / zoom, height: dims.height / zoom });

            // Re-erase all edited text and image masks on the re-rendered canvas
            if (currentPage?.objects) {
              for (const obj of currentPage.objects) {
                const mask = (obj as any).originalMask;
                if (mask) {
                  eraseRegionOnCanvas(mask.x, mask.y, mask.width, mask.height);
                }
              }
            }
          }
        } else {
          const cvs = canvasRef.current!;
          const w = (currentPage?.width || 595) * zoom;
          const h = (currentPage?.height || 842) * zoom;
          cvs.width = w;
          cvs.height = h;
          cvs.style.width = `${w}px`;
          cvs.style.height = `${h}px`;
          const ctx = cvs.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, w, h);
          }
          if (isMounted) {
            setPageSize({ width: currentPage?.width || 595, height: currentPage?.height || 842 });
          }
        }
      } catch (err) {
        console.warn('Canvas render caught:', err);
      }
    }

    renderPage();
    return () => {
      isMounted = false;
    };
  }, [document?.id, currentPageIndex, zoom, viewRotation, currentPage?.rotation, eraseRegionOnCanvas]);

  // 2. Extract Text Spans and Detect Images on Page
  useEffect(() => {
    if (!document || !document.originalPdfBytes) {
      setExtractedSpans([]);
      setDetectedImages([]);
      return;
    }
    const pageNum = currentPage?.pageNumber || 1;
    let isMounted = true;

    async function fetchPageElements() {
      try {
        const spans = await pdfRenderer.extractPageTextSpans(pageNum);
        if (isMounted) {
          setExtractedSpans(spans);
        }
      } catch (e) {
        console.warn('Could not extract text spans:', e);
      }

      try {
        const imgs = await pdfRenderer.extractPageImages(pageNum, canvasRef.current);
        if (isMounted) {
          setDetectedImages(imgs);
        }
      } catch (e) {
        console.warn('Could not extract images:', e);
      }
    }

    const timer = setTimeout(fetchPageElements, 150);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [document?.id, currentPageIndex, zoom]);

  // Coordinate conversion helper
  const getCoordinatesFromEvent = (e: React.MouseEvent | React.TouchEvent | TouchEvent | MouseEvent): Point => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) / zoom;
    const y = (clientY - rect.top) / zoom;
    return { x, y };
  };

  // 3. DIRECT IN-PDF TEXT EDITING (erases the background text glyphs, turns text editable transparently)
  const handleDirectEditText = (span: ExtractedTextSpan) => {
    const pad = 2;
    const spanW = Math.round(span.bbox[2] - span.bbox[0]);
    const spanH = Math.round(span.bbox[3] - span.bbox[1]);
    const maskX = Math.round(span.bbox[0] - pad);
    const maskY = Math.round(span.bbox[1] - pad);
    const maskW = spanW + pad * 2;
    const maskH = spanH + pad * 2;

    // 1. Wipe original baked text directly from the canvas bitmap right now
    eraseRegionOnCanvas(maskX, maskY, maskW, maskH);

    // 2. Check if an active text object already exists
    const existing = currentPage?.objects.find(
      (o) => o.type === 'text' && (o as TextObject).originalMask &&
      Math.abs(o.x - maskX) < 8 && Math.abs(o.y - maskY) < 8
    );

    if (existing) {
      selectObject(existing.id);
      return;
    }

    // 3. Create inline transparent editable text object directly inside the PDF
    const newTextObj: TextObject = {
      id: `direct_text_${Date.now()}`,
      type: 'text',
      x: maskX,
      y: maskY,
      width: Math.max(maskW + 12, 60),
      height: Math.max(maskH + 4, 20),
      text: span.text,
      fontSize: Math.max(10, Math.round(span.size || 12)),
      fontFamily: textPreset.fontFamily || 'Noto Sans',
      fontWeight: 'normal',
      fontStyle: 'normal',
      underline: false,
      textAlign: 'left',
      color: '#0f172a',
      backgroundColor: 'transparent', // Transparent because original was erased on the canvas!
      opacity: 1.0,
      lineHeight: 1.15,
      letterSpacing: 0,
      direction: 'auto',
      isEditedFromPdf: true,
      originalMask: {
        x: maskX,
        y: maskY,
        width: maskW,
        height: maskH,
      },
    };

    addObject(currentPageIndex, newTextObj);
    selectObject(newTextObj.id);
    setActiveSpanActionMenu(null);
  };

  // 4. DIRECT IMAGE ACTIVATION & DRAGGING (erases the background image, initiates drag immediately)
  const handleActivateAndDragImage = (img: ExtractedImage, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();

    // 1. Wipe original image from the canvas bitmap so no ghost duplicate stays behind
    eraseRegionOnCanvas(img.x, img.y, img.width, img.height);

    // 2. Check if an active image object already exists
    let targetObjId = '';
    const existing = currentPage?.objects.find(
      (o) => o.type === 'image' && Math.abs(o.x - img.x) < 5 && Math.abs(o.y - img.y) < 5
    );

    if (existing) {
      targetObjId = existing.id;
    } else {
      const newImgObj: ImageObject = {
        id: `img_edit_${Date.now()}`,
        type: 'image',
        name: img.name,
        src: img.src,
        x: img.x,
        y: img.y,
        width: img.width,
        height: img.height,
        opacity: 1.0,
        keepAspectRatio: true,
        naturalWidth: img.width,
        naturalHeight: img.height,
        isDetectedFromPdf: true,
        originalMask: { x: img.x, y: img.y, width: img.width, height: img.height },
      };
      addObject(currentPageIndex, newImgObj);
      targetObjId = newImgObj.id;
    }

    // 3. Immediately select and start dragging in the current mouse gesture
    selectObject(targetObjId, false);
    setIsDraggingObject(true);
    setActiveDragObjectId(targetObjId);
    const pt = getCoordinatesFromEvent(e);
    setDragOffset({ x: pt.x - img.x, y: pt.y - img.y });
  };

  // 5. Replace Selected Image with New File
  const handleReplaceImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || selectedObjectIds.length === 0) return;

    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const img = new Image();
      img.onload = () => {
        updateObject(currentPageIndex, selectedObjectIds[0], {
          src,
          name: file.name,
          naturalWidth: img.width,
          naturalHeight: img.height,
        });
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Mouse & Touch down
  const handleInteractionStart = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e && e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      pinchStartDistRef.current = dist;
      pinchStartZoomRef.current = zoom;
      return;
    }

    const pt = getCoordinatesFromEvent(e);

    if (toolMode === 'select' || toolMode === 'hand') {
      const target = e.target as HTMLElement;
      if (target === containerRef.current || target.id === 'pdf-render-canvas') {
        clearSelection();
        setActiveSpanActionMenu(null);
      }
      return;
    }

    if (toolMode === 'text') {
      addObject(currentPageIndex, {
        id: `text_${Date.now()}`,
        type: 'text',
        x: pt.x,
        y: pt.y,
        width: 180,
        height: 42,
        text: 'Type text here...',
        fontSize: textPreset.fontSize,
        fontFamily: textPreset.fontFamily,
        fontWeight: textPreset.fontWeight,
        fontStyle: textPreset.fontStyle,
        underline: textPreset.underline,
        textAlign: textPreset.textAlign,
        color: textPreset.color,
        backgroundColor: 'transparent',
        opacity: textPreset.opacity,
        lineHeight: 1.2,
        letterSpacing: 0,
        direction: textPreset.direction,
      } as TextObject);
      return;
    }

    if (toolMode === 'stamp') {
      addObject(currentPageIndex, {
        id: `stamp_${Date.now()}`,
        type: 'annotation',
        subtype: 'stamp',
        x: Math.max(10, pt.x - 70),
        y: Math.max(10, pt.y - 25),
        width: 140,
        height: 50,
        color: annotationPreset.stampColor,
        opacity: 1.0,
        stampText: annotationPreset.stampText,
        stampColor: annotationPreset.stampColor,
      } as AnnotationObject);
      return;
    }

    if (toolMode === 'sticky-note') {
      addObject(currentPageIndex, {
        id: `note_${Date.now()}`,
        type: 'annotation',
        subtype: 'sticky-note',
        x: pt.x,
        y: pt.y,
        width: 36,
        height: 36,
        color: '#facc15',
        opacity: 1.0,
        noteText: 'Review note: verified',
        author: 'User',
        timestamp: new Date().toLocaleDateString(),
      } as AnnotationObject);
      return;
    }

    setIsDrawing(true);
    setDrawStart(pt);
    setDrawCurrent(pt);

    if (toolMode === 'pen' || toolMode === 'highlighter') {
      setFreehandPoints([pt]);
    }
  };

  // Mouse & Touch move
  const handleInteractionMove = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e && e.touches.length === 2 && pinchStartDistRef.current !== null) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      const ratio = dist / pinchStartDistRef.current;
      const newZoom = Math.min(3.0, Math.max(0.4, Math.round(pinchStartZoomRef.current * ratio * 100) / 100));
      setZoom(newZoom);
      return;
    }

    const pt = getCoordinatesFromEvent(e);

    // Active object dragging
    if (isDraggingObject && activeDragObjectId) {
      updateObject(currentPageIndex, activeDragObjectId, {
        x: Math.round(pt.x - dragOffset.x),
        y: Math.round(pt.y - dragOffset.y),
      });
      return;
    }

    // Active object resizing
    if (isResizing && selectedObjectIds.length === 1) {
      const objId = selectedObjectIds[0];
      const deltaX = pt.x - resizeStart.x;
      const deltaY = pt.y - resizeStart.y;
      let newW = resizeStart.width;
      let newH = resizeStart.height;

      if (isResizing.includes('e')) newW = Math.max(20, Math.round(resizeStart.width + deltaX));
      if (isResizing.includes('s')) newH = Math.max(20, Math.round(resizeStart.height + deltaY));

      updateObject(currentPageIndex, objId, { width: newW, height: newH });
      return;
    }

    if (isDrawing) {
      setDrawCurrent(pt);
      if (toolMode === 'pen' || toolMode === 'highlighter') {
        setFreehandPoints((prev) => [...prev, pt]);
      }
    }
  };

  // Mouse & Touch end
  const handleInteractionEnd = () => {
    pinchStartDistRef.current = null;

    if (isDraggingObject) {
      setIsDraggingObject(false);
      setActiveDragObjectId(null);
    }

    if (isResizing) {
      setIsResizing(null);
    }

    if (!isDrawing) return;
    setIsDrawing(false);

    const x = Math.min(drawStart.x, drawCurrent.x);
    const y = Math.min(drawStart.y, drawCurrent.y);
    const width = Math.max(10, Math.abs(drawCurrent.x - drawStart.x));
    const height = Math.max(10, Math.abs(drawCurrent.y - drawStart.y));

    if (toolMode === 'pen' || toolMode === 'highlighter') {
      if (freehandPoints.length > 1) {
        addObject(currentPageIndex, {
          id: `freehand_${Date.now()}`,
          type: 'shape',
          shapeType: 'freehand',
          x,
          y,
          width,
          height,
          points: freehandPoints,
          strokeColor: toolMode === 'highlighter' ? '#fde047' : shapePreset.strokeColor,
          strokeWidth: toolMode === 'highlighter' ? 14 : shapePreset.strokeWidth,
          strokeStyle: 'solid',
          strokeOpacity: toolMode === 'highlighter' ? 0.4 : shapePreset.strokeOpacity,
          fillColor: 'transparent',
          fillOpacity: 0,
        } as ShapeObject);
      }
      setFreehandPoints([]);
      return;
    }

    if (toolMode === 'shape-rect' || toolMode === 'shape-rounded-rect') {
      addObject(currentPageIndex, {
        id: `rect_${Date.now()}`,
        type: 'shape',
        shapeType: toolMode === 'shape-rounded-rect' ? 'rounded-rectangle' : 'rectangle',
        x,
        y,
        width,
        height,
        strokeColor: shapePreset.strokeColor,
        strokeWidth: shapePreset.strokeWidth,
        strokeStyle: shapePreset.strokeStyle,
        strokeOpacity: shapePreset.strokeOpacity,
        fillColor: shapePreset.fillColor,
        fillOpacity: shapePreset.fillOpacity,
      } as ShapeObject);
    } else if (toolMode === 'shape-circle') {
      addObject(currentPageIndex, {
        id: `circle_${Date.now()}`,
        type: 'shape',
        shapeType: 'circle',
        x,
        y,
        width,
        height,
        strokeColor: shapePreset.strokeColor,
        strokeWidth: shapePreset.strokeWidth,
        strokeStyle: shapePreset.strokeStyle,
        strokeOpacity: shapePreset.strokeOpacity,
        fillColor: shapePreset.fillColor,
        fillOpacity: shapePreset.fillOpacity,
      } as ShapeObject);
    } else if (toolMode === 'shape-line' || toolMode === 'shape-arrow') {
      addObject(currentPageIndex, {
        id: `line_${Date.now()}`,
        type: 'shape',
        shapeType: toolMode === 'shape-arrow' ? 'arrow' : 'line',
        x: drawStart.x,
        y: drawStart.y,
        width: drawCurrent.x - drawStart.x,
        height: drawCurrent.y - drawStart.y,
        strokeColor: shapePreset.strokeColor,
        strokeWidth: shapePreset.strokeWidth,
        strokeStyle: shapePreset.strokeStyle,
        strokeOpacity: shapePreset.strokeOpacity,
        fillColor: 'transparent',
        fillOpacity: 0,
      } as ShapeObject);
    } else if (toolMode === 'redact') {
      addObject(currentPageIndex, {
        id: `redact_${Date.now()}`,
        type: 'redaction',
        x,
        y,
        width,
        height,
        overlayColor: redactionPreset.overlayColor,
        labelText: redactionPreset.labelText,
        applied: true,
      } as RedactionObject);
    } else if (toolMode === 'annotation-highlight') {
      addObject(currentPageIndex, {
        id: `annot_${Date.now()}`,
        type: 'annotation',
        subtype: 'highlight',
        x,
        y,
        width,
        height,
        color: annotationPreset.color,
        opacity: annotationPreset.opacity,
      } as AnnotationObject);
    }
  };

  const selectedObject = currentPage?.objects.find((o) => selectedObjectIds.includes(o.id));
  const totalPages = document?.pages.length || 1;

  return (
    <div
      ref={wrapperRef}
      className="flex-1 bg-slate-200/80 dark:bg-slate-950 overflow-auto flex flex-col items-center justify-start p-3 sm:p-6 md:p-8 relative select-none touch-manipulation min-h-0"
    >
      {/* Hidden file input for replacing an image */}
      <input
        type="file"
        ref={replaceImageInputRef}
        onChange={handleReplaceImageFile}
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
      />

      {/* Scrollable Page Canvas Container */}
      <div className="my-auto flex items-center justify-center w-full min-h-full">
        <div
          ref={containerRef}
          onMouseDown={handleInteractionStart}
          onMouseMove={handleInteractionMove}
          onMouseUp={handleInteractionEnd}
          onTouchStart={handleInteractionStart}
          onTouchMove={handleInteractionMove}
          onTouchEnd={handleInteractionEnd}
          style={{
            width: pageSize.width * zoom,
            height: pageSize.height * zoom,
            touchAction: toolMode === 'select' || toolMode === 'hand' ? 'pan-x pan-y' : 'none',
          }}
          className="relative bg-white shadow-2xl rounded-sm transition-shadow cursor-default shrink-0"
        >
          {/* PDF.js Canvas Layer */}
          <canvas id="pdf-render-canvas" ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

          {/* Detected Images Layer (Press down to drag immediately, wipe from background, or delete) */}
          <div className="absolute inset-0 z-10 pointer-events-auto">
            {detectedImages
              .filter((img) => !currentPage?.objects.some((o) => o.type === 'image' && Math.abs(o.x - img.x) < 5 && Math.abs(o.y - img.y) < 5))
              .map((img) => (
                <div
                  key={img.id}
                  onMouseDown={(e) => handleActivateAndDragImage(img, e)}
                  onTouchStart={(e) => handleActivateAndDragImage(img, e)}
                  className="absolute cursor-move border border-dashed border-emerald-500/80 hover:border-emerald-600 hover:bg-emerald-500/10 transition-colors group/img"
                  style={{
                    left: img.x * zoom,
                    top: img.y * zoom,
                    width: img.width * zoom,
                    height: img.height * zoom,
                  }}
                  title="PDF Image detected: Click to drag, delete or replace"
                >
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-bold shadow-xs opacity-0 group-hover/img:opacity-100 transition-opacity pointer-events-none">
                    Drag or Delete Image
                  </div>
                </div>
              ))}
          </div>

          {/* Text Detection Layer (Click directly on any text to edit directly in PDF without overlay feel) */}
          <div className="absolute inset-0 z-12 pointer-events-auto">
            {extractedSpans
              .filter((span) => !currentPage?.objects.some((o) => o.type === 'text' && (o as TextObject).originalMask && Math.abs(o.x - (span.bbox[0] - 2)) < 6 && Math.abs(o.y - (span.bbox[1] - 2)) < 6))
              .map((span, idx) => {
                const isHovered = hoveredSpan === span;
                return (
                  <div
                    key={`span_${idx}`}
                    onMouseEnter={() => setHoveredSpan(span)}
                    onMouseLeave={() => setHoveredSpan(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDirectEditText(span);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveSpanActionMenu({
                        span,
                        x: span.bbox[0] * zoom,
                        y: (span.bbox[3] + 4) * zoom,
                      });
                    }}
                    className={`absolute transition-colors cursor-text group/span ${
                      isHovered ? 'bg-indigo-500/15 ring-1 ring-indigo-500/50 rounded-xs' : ''
                    }`}
                    style={{
                      left: span.bbox[0] * zoom,
                      top: span.bbox[1] * zoom,
                      width: (span.bbox[2] - span.bbox[0]) * zoom,
                      height: (span.bbox[3] - span.bbox[1]) * zoom,
                    }}
                    title={`Click to directly edit: "${span.text}"`}
                  >
                    {isHovered && (
                      <span className="absolute -top-5 left-0 px-1 py-0.5 bg-indigo-600 text-white text-[9px] font-semibold rounded shadow-xs whitespace-nowrap pointer-events-none z-30">
                        Click to Edit Text
                      </span>
                    )}
                  </div>
                );
              })}
          </div>

          {/* Search Highlights */}
          {searchResults
            .filter((res) => res.pageNumber === currentPageIndex + 1)
            .map((res, i) => {
              const isCurrent = i === currentSearchIndex;
              return (
                <div
                  key={`search_${i}`}
                  className={`absolute z-15 pointer-events-none rounded-xs transition-all ${
                    isCurrent ? 'bg-amber-400/80 ring-2 ring-amber-500' : 'bg-yellow-300/50'
                  }`}
                  style={{
                    left: res.rect[0] * zoom,
                    top: res.rect[1] * zoom,
                    width: (res.rect[2] - res.rect[0]) * zoom,
                    height: (res.rect[3] - res.rect[1]) * zoom,
                  }}
                />
              );
            })}

          {/* Editor Objects Layer (Direct In-PDF Text, Shapes, Draggable Images, Stamps, Redactions) */}
          <div className="absolute inset-0 z-20 pointer-events-none">
            {currentPage?.objects.map((obj) => {
              const isSelected = selectedObjectIds.includes(obj.id);

              return (
                <div
                  key={obj.id}
                  onMouseDown={(e) => {
                    if (toolMode === 'select') {
                      e.stopPropagation();
                      selectObject(obj.id, e.shiftKey);
                      setIsDraggingObject(true);
                      setActiveDragObjectId(obj.id);
                      const pt = getCoordinatesFromEvent(e);
                      setDragOffset({ x: pt.x - obj.x, y: pt.y - obj.y });
                    }
                  }}
                  onTouchStart={(e) => {
                    if (toolMode === 'select') {
                      e.stopPropagation();
                      selectObject(obj.id, false);
                      setIsDraggingObject(true);
                      setActiveDragObjectId(obj.id);
                      const pt = getCoordinatesFromEvent(e);
                      setDragOffset({ x: pt.x - obj.x, y: pt.y - obj.y });
                    }
                  }}
                  style={{
                    left: obj.x * zoom,
                    top: obj.y * zoom,
                    width: obj.width * zoom,
                    height: obj.height * zoom,
                  }}
                  className={`absolute pointer-events-auto transition-shadow ${
                    isSelected ? 'ring-2 ring-indigo-500 ring-offset-1' : ''
                  }`}
                >
                  {/* 1. DIRECT IN-PDF TEXT (Transparent inline text, no sticker feel) */}
                  {obj.type === 'text' && (
                    <div
                      contentEditable={toolMode === 'select'}
                      suppressContentEditableWarning
                      onBlur={(e) => updateObject(currentPageIndex, obj.id, { text: e.currentTarget.innerText })}
                      style={{
                        fontFamily: (obj as TextObject).fontFamily,
                        fontSize: `${(obj as TextObject).fontSize * zoom}px`,
                        fontWeight: (obj as TextObject).fontWeight,
                        fontStyle: (obj as TextObject).fontStyle,
                        textDecoration: (obj as TextObject).underline ? 'underline' : 'none',
                        textAlign: (obj as TextObject).textAlign,
                        color: (obj as TextObject).color,
                        backgroundColor: (obj as TextObject).backgroundColor || 'transparent',
                        opacity: (obj as TextObject).opacity,
                        lineHeight: (obj as TextObject).lineHeight || 1.15,
                        direction: (obj as TextObject).direction === 'rtl' ? 'rtl' : 'ltr',
                      }}
                      className="w-full h-full p-0.5 outline-hidden whitespace-pre-wrap select-text cursor-text"
                    >
                      {(obj as TextObject).text}
                    </div>
                  )}

                  {/* 2. DRAGGABLE & RESIZABLE IMAGE */}
                  {obj.type === 'image' && (
                    <div className="w-full h-full relative cursor-move">
                      <img
                        src={(obj as ImageObject).src}
                        alt={(obj as ImageObject).name}
                        style={{ opacity: (obj as ImageObject).opacity }}
                        className="w-full h-full object-contain pointer-events-none select-none"
                      />
                    </div>
                  )}

                  {/* 3. SHAPE */}
                  {obj.type === 'shape' && (
                    <svg className="w-full h-full overflow-visible pointer-events-none">
                      {(obj as ShapeObject).shapeType === 'rectangle' && (
                        <rect
                          x="0"
                          y="0"
                          width={obj.width * zoom}
                          height={obj.height * zoom}
                          stroke={(obj as ShapeObject).strokeColor}
                          strokeWidth={(obj as ShapeObject).strokeWidth * zoom}
                          fill={(obj as ShapeObject).fillColor || 'none'}
                          fillOpacity={(obj as ShapeObject).fillOpacity}
                          strokeOpacity={(obj as ShapeObject).strokeOpacity}
                        />
                      )}
                      {(obj as ShapeObject).shapeType === 'rounded-rectangle' && (
                        <rect
                          x="0"
                          y="0"
                          rx="8"
                          ry="8"
                          width={obj.width * zoom}
                          height={obj.height * zoom}
                          stroke={(obj as ShapeObject).strokeColor}
                          strokeWidth={(obj as ShapeObject).strokeWidth * zoom}
                          fill={(obj as ShapeObject).fillColor || 'none'}
                          fillOpacity={(obj as ShapeObject).fillOpacity}
                          strokeOpacity={(obj as ShapeObject).strokeOpacity}
                        />
                      )}
                      {(obj as ShapeObject).shapeType === 'circle' && (
                        <ellipse
                          cx={(obj.width * zoom) / 2}
                          cy={(obj.height * zoom) / 2}
                          rx={(obj.width * zoom) / 2}
                          ry={(obj.height * zoom) / 2}
                          stroke={(obj as ShapeObject).strokeColor}
                          strokeWidth={(obj as ShapeObject).strokeWidth * zoom}
                          fill={(obj as ShapeObject).fillColor || 'none'}
                          fillOpacity={(obj as ShapeObject).fillOpacity}
                          strokeOpacity={(obj as ShapeObject).strokeOpacity}
                        />
                      )}
                      {(obj as ShapeObject).shapeType === 'freehand' && (obj as ShapeObject).points && (
                        <polyline
                          points={(obj as ShapeObject).points!
                            .map((p) => `${(p.x - obj.x) * zoom},${(p.y - obj.y) * zoom}`)
                            .join(' ')}
                          fill="none"
                          stroke={(obj as ShapeObject).strokeColor}
                          strokeWidth={(obj as ShapeObject).strokeWidth * zoom}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeOpacity={(obj as ShapeObject).strokeOpacity}
                        />
                      )}
                    </svg>
                  )}

                  {/* 4. ANNOTATION */}
                  {obj.type === 'annotation' && (
                    <div className="w-full h-full relative">
                      {(obj as AnnotationObject).subtype === 'highlight' && (
                        <div
                          style={{
                            backgroundColor: (obj as AnnotationObject).color,
                            opacity: (obj as AnnotationObject).opacity,
                          }}
                          className="w-full h-full rounded-xs"
                        />
                      )}
                      {(obj as AnnotationObject).subtype === 'stamp' && (
                        <div
                          style={{
                            borderColor: (obj as AnnotationObject).stampColor || '#dc2626',
                            color: (obj as AnnotationObject).stampColor || '#dc2626',
                          }}
                          className="w-full h-full border-2 rounded-sm border-dashed flex items-center justify-center font-bold tracking-widest uppercase bg-rose-50/20 text-xs px-2"
                        >
                          {(obj as AnnotationObject).stampText || 'APPROVED'}
                        </div>
                      )}
                      {(obj as AnnotationObject).subtype === 'sticky-note' && (
                        <div className="w-9 h-9 rounded-lg bg-amber-400 border border-amber-500 shadow-md flex items-center justify-center text-slate-900 cursor-pointer min-w-[36px] min-h-[36px]">
                          <StickyNote className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* 5. REDACTION */}
                  {obj.type === 'redaction' && (
                    <div
                      style={{ backgroundColor: (obj as RedactionObject).overlayColor || '#000000' }}
                      className="w-full h-full flex items-center justify-center text-white font-mono text-[10px] tracking-wider font-bold select-none shadow-xs"
                    >
                      {(obj as RedactionObject).labelText || '[REDACTED]'}
                    </div>
                  )}

                  {/* Resize Handle */}
                  {isSelected && (
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setIsResizing('se');
                        setResizeStart({ x: obj.x, y: obj.y, width: obj.width, height: obj.height });
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        setIsResizing('se');
                        setResizeStart({ x: obj.x, y: obj.y, width: obj.width, height: obj.height });
                      }}
                      className="absolute -bottom-2.5 -right-2.5 w-6 h-6 flex items-center justify-center cursor-se-resize z-30"
                    >
                      <div className="w-3.5 h-3.5 bg-indigo-600 rounded-full border-2 border-white shadow-sm" />
                    </div>
                  )}

                  {/* Floating Action Controls for Selected Image (Replace / Delete) */}
                  {isSelected && obj.type === 'image' && (
                    <div className="absolute -top-9 left-0 flex items-center gap-1 bg-slate-900 text-white rounded-lg p-1 shadow-lg text-[10px] z-40">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          replaceImageInputRef.current?.click();
                        }}
                        className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 rounded flex items-center gap-1 font-medium"
                        title="Upload new image to replace this one"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Replace</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSelectedObjects();
                        }}
                        className="p-1 hover:bg-rose-600 rounded text-rose-300 hover:text-white"
                        title="Delete Image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Active Drawing Preview */}
          {isDrawing && (
            <svg className="absolute inset-0 pointer-events-none z-30 overflow-visible">
              {(toolMode === 'pen' || toolMode === 'highlighter') && freehandPoints.length > 1 && (
                <polyline
                  points={freehandPoints.map((p) => `${p.x * zoom},${p.y * zoom}`).join(' ')}
                  fill="none"
                  stroke={toolMode === 'highlighter' ? '#fde047' : shapePreset.strokeColor}
                  strokeWidth={(toolMode === 'highlighter' ? 14 : shapePreset.strokeWidth) * zoom}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeOpacity={toolMode === 'highlighter' ? 0.4 : shapePreset.strokeOpacity}
                />
              )}
              {toolMode === 'shape-rect' && (
                <rect
                  x={Math.min(drawStart.x, drawCurrent.x) * zoom}
                  y={Math.min(drawStart.y, drawCurrent.y) * zoom}
                  width={Math.abs(drawCurrent.x - drawStart.x) * zoom}
                  height={Math.abs(drawCurrent.y - drawStart.y) * zoom}
                  stroke={shapePreset.strokeColor}
                  strokeWidth={shapePreset.strokeWidth * zoom}
                  fill={shapePreset.fillColor || 'none'}
                  fillOpacity={shapePreset.fillOpacity}
                />
              )}
              {toolMode === 'redact' && (
                <rect
                  x={Math.min(drawStart.x, drawCurrent.x) * zoom}
                  y={Math.min(drawStart.y, drawCurrent.y) * zoom}
                  width={Math.abs(drawCurrent.x - drawStart.x) * zoom}
                  height={Math.abs(drawCurrent.y - drawStart.y) * zoom}
                  stroke="#dc2626"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                  fill="#000000"
                  fillOpacity="0.8"
                />
              )}
            </svg>
          )}

          {/* Text Right-Click Popover */}
          {activeSpanActionMenu && (
            <div
              style={{
                left: Math.max(10, Math.min(pageSize.width * zoom - 160, activeSpanActionMenu.x)),
                top: Math.max(10, activeSpanActionMenu.y),
              }}
              className="absolute z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-1.5 flex items-center gap-1 text-xs"
            >
              <button
                onClick={() => handleDirectEditText(activeSpanActionMenu.span)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-400 font-medium min-h-[36px]"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Text</span>
              </button>
              <button
                onClick={() => {
                  addObject(currentPageIndex, {
                    id: `redact_${Date.now()}`,
                    type: 'redaction',
                    x: activeSpanActionMenu.span.bbox[0] - 2,
                    y: activeSpanActionMenu.span.bbox[1] - 2,
                    width: activeSpanActionMenu.span.bbox[2] - activeSpanActionMenu.span.bbox[0] + 4,
                    height: activeSpanActionMenu.span.bbox[3] - activeSpanActionMenu.span.bbox[1] + 4,
                    overlayColor: '#000000',
                    labelText: '[REDACTED]',
                    applied: true,
                  } as RedactionObject);
                  setActiveSpanActionMenu(null);
                }}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-400 font-medium min-h-[36px]"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Redact</span>
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(activeSpanActionMenu.span.text);
                  setActiveSpanActionMenu(null);
                }}
                className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 min-h-[36px]"
              >
                <Copy className="w-4 h-4" />
                <span>Copy</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom Touch Bar for Phones & Tablets */}
      <div className="sticky bottom-2 z-30 mt-auto flex items-center gap-2 p-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center gap-1 pr-1 border-r border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPageIndex - 1))}
            disabled={currentPageIndex <= 0}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
            title="Previous Page"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-semibold px-1 text-slate-700 dark:text-slate-200 tabular-nums">
            {currentPageIndex + 1} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPageIndex + 1))}
            disabled={currentPageIndex >= totalPages - 1}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
            title="Next Page"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleFitWidth}
            className="px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors tabular-nums"
            title="Fit to Screen"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={zoomIn}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1 pl-1 border-l border-slate-200 dark:border-slate-800 lg:hidden">
          <button
            onClick={() => {
              setIsMobilePagesOpen(!isMobilePagesOpen);
              if (isMobilePropertiesOpen) setIsMobilePropertiesOpen(false);
            }}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${
              isMobilePagesOpen
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Toggle Pages Drawer"
          >
            <Layers className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setIsMobilePropertiesOpen(!isMobilePropertiesOpen);
              if (isMobilePagesOpen) setIsMobilePagesOpen(false);
            }}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${
              isMobilePropertiesOpen
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Toggle Properties Sheet"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
