/**
 * PDF Forge - High Fidelity PDF Rendering Service
 * Powered by PDF.js with lazy rendering, text layer extraction, and thumbnail generation.
 */
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { ExtractedTextSpan, ExtractedImage } from '../types/pdf';

// Configure PDF.js worker reliably from local bundled URL (same-origin, avoids iframe CORS blocks)
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

export class PDFRendererService {
  private pdfDocument: any = null;
  private currentBytes: Uint8Array | null = null;
  private thumbnailCache: Map<number, string> = new Map();

  async loadDocument(data: Uint8Array): Promise<{ pageCount: number; pages: { width: number; height: number; rotation: number }[] }> {
    // Keep an intact copy in case PDF.js worker transfers/detaches the buffer
    this.currentBytes = new Uint8Array(data);
    this.thumbnailCache.clear();

    const loadingTask = pdfjsLib.getDocument({
      data: data.slice(0), // pass clone so original buffer is never detached
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@legacy/cmaps/',
      cMapPacked: true,
      standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@legacy/standard_fonts/',
    });

    this.pdfDocument = await loadingTask.promise;
    const pageCount = this.pdfDocument.numPages;
    const pages = [];

    for (let i = 1; i <= pageCount; i++) {
      const page = await this.pdfDocument.getPage(i);
      const viewport = page.getViewport({ scale: 1.0 });
      pages.push({
        width: viewport.width,
        height: viewport.height,
        rotation: page.rotate || 0,
      });
    }

    return { pageCount, pages };
  }

  async renderPageToCanvas(
    pageNumber: number,
    canvas: HTMLCanvasElement,
    scale: number = 1.0,
    rotation: number = 0
  ): Promise<{ width: number; height: number }> {
    if (!this.pdfDocument) throw new Error('No PDF document loaded');
    const page = await this.pdfDocument.getPage(pageNumber);

    const baseRotation = page.rotate || 0;
    const effectiveRotation = (baseRotation + rotation) % 360;
    const viewport = page.getViewport({ scale, rotation: effectiveRotation });

    // Handle high DPI displays for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Could not get canvas context');

    ctx.save();
    ctx.scale(dpr, dpr);

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
      enableWebGL: true,
    };

    await page.render(renderContext).promise;
    ctx.restore();

    return { width: viewport.width, height: viewport.height };
  }

  async extractPageTextSpans(pageNumber: number): Promise<ExtractedTextSpan[]> {
    if (!this.pdfDocument) return [];
    try {
      const page = await this.pdfDocument.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const viewport = page.getViewport({ scale: 1.0 });
      const spans: ExtractedTextSpan[] = [];

      for (const item of textContent.items as any[]) {
        if (!item.str || item.str.trim() === '') continue;
        const tx = item.transform; // [scaleX, skewY, skewX, scaleY, transX, transY]
        const x = tx[4];
        // PDF coordinates have origin at bottom-left, viewport is top-left
        const y = viewport.height - tx[5] - (item.height || 10);
        const width = item.width || 30;
        const height = item.height || 12;

        spans.push({
          text: item.str,
          bbox: [x, y, x + width, y + height],
          pageNumber,
          font: item.fontName,
          size: Math.abs(tx[3]) || 12,
        });
      }

      return spans;
    } catch (err) {
      console.warn('Text extraction error:', err);
      return [];
    }
  }

  async extractPageImages(pageNumber: number, renderedCanvas?: HTMLCanvasElement | null): Promise<ExtractedImage[]> {
    if (!this.pdfDocument) return [];
    try {
      const page = await this.pdfDocument.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.0 });
      const opList = await page.getOperatorList();
      const images: ExtractedImage[] = [];

      let ctm = [1, 0, 0, 1, 0, 0];
      const ctmStack: number[][] = [];

      const multiplyMatrix = (m1: number[], m2: number[]) => [
        m1[0] * m2[0] + m1[2] * m2[1],
        m1[1] * m2[0] + m1[3] * m2[1],
        m1[0] * m2[2] + m1[2] * m2[3],
        m1[1] * m2[2] + m1[3] * m2[3],
        m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
        m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
      ];

      for (let i = 0; i < opList.fnArray.length; i++) {
        const fn = opList.fnArray[i];
        const args = opList.argsArray[i];

        if (fn === pdfjsLib.OPS.save) {
          ctmStack.push([...ctm]);
        } else if (fn === pdfjsLib.OPS.restore) {
          ctm = ctmStack.pop() || [1, 0, 0, 1, 0, 0];
        } else if (fn === pdfjsLib.OPS.transform) {
          ctm = multiplyMatrix(ctm, args);
        } else if (
          fn === pdfjsLib.OPS.paintImageXObject ||
          fn === pdfjsLib.OPS.paintInlineImageXObject ||
          fn === pdfjsLib.OPS.paintImageMaskXObject
        ) {
          const imgName = args[0];
          const scaleX = Math.sqrt(ctm[0] * ctm[0] + ctm[1] * ctm[1]);
          const scaleY = Math.sqrt(ctm[2] * ctm[2] + ctm[3] * ctm[3]);
          const x = ctm[4];
          const y = viewport.height - (ctm[5] + scaleY);
          const w = scaleX;
          const h = scaleY;

          if (w < 8 || h < 8) continue;

          let dataUrl = '';
          if (renderedCanvas) {
            try {
              const cropCanvas = document.createElement('canvas');
              const dpr = window.devicePixelRatio || 1;
              const sx = Math.max(0, x * dpr);
              const sy = Math.max(0, y * dpr);
              const sw = Math.min(renderedCanvas.width - sx, w * dpr);
              const sh = Math.min(renderedCanvas.height - sy, h * dpr);

              if (sw > 0 && sh > 0) {
                cropCanvas.width = sw;
                cropCanvas.height = sh;
                const cropCtx = cropCanvas.getContext('2d');
                if (cropCtx) {
                  cropCtx.drawImage(renderedCanvas, sx, sy, sw, sh, 0, 0, sw, sh);
                  dataUrl = cropCanvas.toDataURL('image/png');
                }
              }
            } catch (cropErr) {
              console.warn('Canvas crop error for image:', cropErr);
            }
          }

          images.push({
            id: `detected_img_${pageNumber}_${i}_${Date.now()}`,
            name: typeof imgName === 'string' ? imgName : `Page_${pageNumber}_Image_${i + 1}`,
            src: dataUrl,
            x: Math.round(x),
            y: Math.round(y),
            width: Math.round(w),
            height: Math.round(h),
            pageNumber,
          });
        }
      }

      return images;
    } catch (err) {
      console.warn('extractPageImages error:', err);
      return [];
    }
  }

  async getThumbnailDataUrl(pageNumber: number, targetWidth: number = 180): Promise<string> {
    if (this.thumbnailCache.has(pageNumber)) {
      return this.thumbnailCache.get(pageNumber)!;
    }

    if (!this.pdfDocument) return '';
    try {
      const page = await this.pdfDocument.getPage(pageNumber);
      const unscaledViewport = page.getViewport({ scale: 1.0 });
      const scale = targetWidth / unscaledViewport.width;
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';

      await page.render({
        canvasContext: ctx,
        viewport,
      }).promise;

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      this.thumbnailCache.set(pageNumber, dataUrl);
      return dataUrl;
    } catch (err) {
      console.warn('Thumbnail generation failed:', err);
      return '';
    }
  }

  getDocument() {
    return this.pdfDocument;
  }
}

export const pdfRenderer = new PDFRendererService();
