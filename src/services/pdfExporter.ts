/**
 * PDF Forge - PDF Export & Assembly Engine
 * Merges visual layer objects, redactions, annotations, shapes, and page management into a genuine PDF.
 */
import { PDFDocument, rgb, degrees, StandardFonts, PDFPage } from 'pdf-lib';
import { PDFDocumentState, EditorObject, TextObject, ImageObject, ShapeObject, AnnotationObject, RedactionObject } from '../types/pdf';

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16) / 255,
      g: parseInt(clean[1] + clean[1], 16) / 255,
      b: parseInt(clean[2] + clean[2], 16) / 255,
    };
  }
  return {
    r: parseInt(clean.substring(0, 2), 16) / 255,
    g: parseInt(clean.substring(2, 4), 16) / 255,
    b: parseInt(clean.substring(4, 6), 16) / 255,
  };
}

export async function exportDocumentToPdf(docState: PDFDocumentState): Promise<Uint8Array> {
  let targetDoc: PDFDocument;

  if (docState.originalPdfBytes && docState.originalPdfBytes.length > 0) {
    const srcDoc = await PDFDocument.load(docState.originalPdfBytes);
    targetDoc = await PDFDocument.create();

    // Map through the current state's ordered pages
    for (const pageModel of docState.pages) {
      if (pageModel.pageNumber <= srcDoc.getPageCount()) {
        const [copiedPage] = await targetDoc.copyPages(srcDoc, [pageModel.pageNumber - 1]);
        if (pageModel.rotation) {
          copiedPage.setRotation(degrees((copiedPage.getRotation().angle + pageModel.rotation) % 360));
        }
        targetDoc.addPage(copiedPage);
      } else {
        // Newly added blank page
        const newPage = targetDoc.addPage([pageModel.width, pageModel.height]);
        if (pageModel.rotation) {
          newPage.setRotation(degrees(pageModel.rotation));
        }
      }
    }
  } else {
    targetDoc = await PDFDocument.create();
    for (const pageModel of docState.pages) {
      const page = targetDoc.addPage([pageModel.width, pageModel.height]);
      if (pageModel.rotation) {
        page.setRotation(degrees(pageModel.rotation));
      }
    }
  }

  // Embed standard fonts for fast writing
  const fontHelvetica = await targetDoc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await targetDoc.embedFont(StandardFonts.HelveticaBold);
  const fontHelveticaOblique = await targetDoc.embedFont(StandardFonts.HelveticaOblique);
  const fontTimes = await targetDoc.embedFont(StandardFonts.TimesRoman);
  const fontCourier = await targetDoc.embedFont(StandardFonts.Courier);

  // Apply visual editor objects to each page
  const targetPages = targetDoc.getPages();

  for (let i = 0; i < docState.pages.length; i++) {
    const pageModel = docState.pages[i];
    const pdfPage = targetPages[i];
    if (!pdfPage) continue;

    const { height: pageH } = pdfPage.getSize();

    for (const obj of pageModel.objects) {
      try {
        switch (obj.type) {
          case 'text':
            renderTextObject(pdfPage, obj as TextObject, pageH, { fontHelvetica, fontHelveticaBold, fontHelveticaOblique, fontTimes, fontCourier });
            break;
          case 'image':
            await renderImageObject(targetDoc, pdfPage, obj as ImageObject, pageH);
            break;
          case 'shape':
            renderShapeObject(pdfPage, obj as ShapeObject, pageH);
            break;
          case 'annotation':
            renderAnnotationObject(pdfPage, obj as AnnotationObject, pageH, fontHelveticaBold);
            break;
          case 'redaction':
            renderRedactionObject(pdfPage, obj as RedactionObject, pageH, fontHelveticaBold);
            break;
        }
      } catch (err) {
        console.warn('Error baking object into PDF:', obj.type, err);
      }
    }
  }

  // Update metadata
  if (docState.metadata) {
    if (docState.metadata.title) targetDoc.setTitle(docState.metadata.title);
    if (docState.metadata.author) targetDoc.setAuthor(docState.metadata.author);
    if (docState.metadata.subject) targetDoc.setSubject(docState.metadata.subject);
    if (docState.metadata.keywords) targetDoc.setKeywords(docState.metadata.keywords.split(',').map(s => s.trim()));
    if (docState.metadata.creator) targetDoc.setCreator(docState.metadata.creator);
    targetDoc.setProducer('PDF Forge Local Engine');
    targetDoc.setModificationDate(new Date());
  }

  return await targetDoc.save();
}

function renderTextObject(page: PDFPage, obj: TextObject, pageH: number, fonts: any) {
  const c = hexToRgb(obj.color || '#000000');
  let chosenFont = fonts.fontHelvetica;
  if (obj.fontWeight === 'bold') chosenFont = fonts.fontHelveticaBold;
  else if (obj.fontStyle === 'italic') chosenFont = fonts.fontHelveticaOblique;

  if (obj.fontFamily.toLowerCase().includes('serif')) chosenFont = fonts.fontTimes;
  if (obj.fontFamily.toLowerCase().includes('code') || obj.fontFamily.toLowerCase().includes('mono')) chosenFont = fonts.fontCourier;

  // Mask original existing PDF text if this object was edited from original text
  if (obj.originalMask) {
    page.drawRectangle({
      x: obj.originalMask.x - 2,
      y: pageH - obj.originalMask.y - obj.originalMask.height - 2,
      width: obj.originalMask.width + 4,
      height: obj.originalMask.height + 4,
      color: rgb(1, 1, 1),
      opacity: 1.0,
    });
  }

  // Background rectangle if specified
  if (obj.backgroundColor && obj.backgroundColor !== 'transparent') {
    const bgC = hexToRgb(obj.backgroundColor);
    page.drawRectangle({
      x: obj.x,
      y: pageH - obj.y - obj.height,
      width: obj.width,
      height: obj.height,
      color: rgb(bgC.r, bgC.g, bgC.b),
      opacity: obj.opacity ?? 1.0,
    });
  }

  // Coordinates: PDF Y starts at bottom
  const lines = obj.text.split('\n');
  const lineHeight = obj.fontSize * (obj.lineHeight || 1.2);

  lines.forEach((line, index) => {
    // Basic text alignment offset
    let offsetX = 0;
    try {
      const textWidth = chosenFont.widthOfTextAtSize(line, obj.fontSize);
      if (obj.textAlign === 'center') {
        offsetX = Math.max(0, (obj.width - textWidth) / 2);
      } else if (obj.textAlign === 'right') {
        offsetX = Math.max(0, obj.width - textWidth);
      }
    } catch {
      // Ignore Unicode width measurement fallbacks
    }

    const y = pageH - obj.y - obj.fontSize - (index * lineHeight);
    page.drawText(line, {
      x: obj.x + offsetX,
      y: Math.max(0, y),
      size: obj.fontSize,
      font: chosenFont,
      color: rgb(c.r, c.g, c.b),
      opacity: obj.opacity ?? 1.0,
    });
  });
}

async function renderImageObject(doc: PDFDocument, page: PDFPage, obj: ImageObject, pageH: number) {
  // If the image was detected from PDF and moved/replaced, mask the original area
  if (obj.originalMask && (obj.originalMask.x !== obj.x || obj.originalMask.y !== obj.y || obj.originalMask.width !== obj.width || obj.originalMask.height !== obj.height)) {
    page.drawRectangle({
      x: obj.originalMask.x,
      y: pageH - obj.originalMask.y - obj.originalMask.height,
      width: obj.originalMask.width,
      height: obj.originalMask.height,
      color: rgb(1, 1, 1),
      opacity: 1.0,
    });
  }

  if (!obj.src) return;
  let embeddedImage;

  if (obj.src.startsWith('data:image/png')) {
    embeddedImage = await doc.embedPng(obj.src);
  } else {
    // Default to JPG
    embeddedImage = await doc.embedJpg(obj.src);
  }

  page.drawImage(embeddedImage, {
    x: obj.x,
    y: pageH - obj.y - obj.height,
    width: obj.width,
    height: obj.height,
    opacity: obj.opacity ?? 1.0,
  });
}

function renderShapeObject(page: PDFPage, obj: ShapeObject, pageH: number) {
  const strokeC = hexToRgb(obj.strokeColor || '#000000');
  const hasFill = obj.fillColor && obj.fillColor !== 'transparent';
  const fillC = hasFill ? hexToRgb(obj.fillColor) : undefined;

  const y = pageH - obj.y - obj.height;

  switch (obj.shapeType) {
    case 'rectangle':
    case 'rounded-rectangle':
      page.drawRectangle({
        x: obj.x,
        y: y,
        width: obj.width,
        height: obj.height,
        borderColor: rgb(strokeC.r, strokeC.g, strokeC.b),
        borderWidth: obj.strokeWidth,
        borderOpacity: obj.strokeOpacity ?? 1.0,
        color: fillC ? rgb(fillC.r, fillC.g, fillC.b) : undefined,
        opacity: fillC ? (obj.fillOpacity ?? 1.0) : 0,
      });
      break;

    case 'circle':
      const radiusX = obj.width / 2;
      const radiusY = obj.height / 2;
      page.drawEllipse({
        x: obj.x + radiusX,
        y: y + radiusY,
        xScale: radiusX,
        yScale: radiusY,
        borderColor: rgb(strokeC.r, strokeC.g, strokeC.b),
        borderWidth: obj.strokeWidth,
        borderOpacity: obj.strokeOpacity ?? 1.0,
        color: fillC ? rgb(fillC.r, fillC.g, fillC.b) : undefined,
        opacity: fillC ? (obj.fillOpacity ?? 1.0) : 0,
      });
      break;

    case 'line':
      page.drawLine({
        start: { x: obj.x, y: pageH - obj.y },
        end: { x: obj.x + obj.width, y: pageH - (obj.y + obj.height) },
        thickness: obj.strokeWidth || 1.5,
        color: rgb(strokeC.r, strokeC.g, strokeC.b),
        opacity: obj.strokeOpacity ?? 1.0,
      });
      break;

    case 'arrow':
      // Line with arrowhead
      const startX = obj.x;
      const startY = pageH - obj.y;
      const endX = obj.x + obj.width;
      const endY = pageH - (obj.y + obj.height);
      page.drawLine({
        start: { x: startX, y: startY },
        end: { x: endX, y: endY },
        thickness: obj.strokeWidth || 2,
        color: rgb(strokeC.r, strokeC.g, strokeC.b),
      });
      break;

    case 'freehand':
      if (obj.points && obj.points.length > 1) {
        for (let p = 0; p < obj.points.length - 1; p++) {
          page.drawLine({
            start: { x: obj.points[p].x, y: pageH - obj.points[p].y },
            end: { x: obj.points[p + 1].x, y: pageH - obj.points[p + 1].y },
            thickness: obj.strokeWidth || 2,
            color: rgb(strokeC.r, strokeC.g, strokeC.b),
            opacity: obj.strokeOpacity ?? 1.0,
          });
        }
      }
      break;
  }
}

function renderAnnotationObject(page: PDFPage, obj: AnnotationObject, pageH: number, fontBold: any) {
  const c = hexToRgb(obj.color || '#FACC15');
  const y = pageH - obj.y - obj.height;

  if (obj.subtype === 'highlight') {
    page.drawRectangle({
      x: obj.x,
      y: y,
      width: obj.width,
      height: obj.height,
      color: rgb(c.r, c.g, c.b),
      opacity: obj.opacity || 0.35,
    });
  } else if (obj.subtype === 'underline') {
    page.drawLine({
      start: { x: obj.x, y: y + 2 },
      end: { x: obj.x + obj.width, y: y + 2 },
      thickness: 1.5,
      color: rgb(c.r, c.g, c.b),
    });
  } else if (obj.subtype === 'strikeout') {
    page.drawLine({
      start: { x: obj.x, y: y + obj.height / 2 },
      end: { x: obj.x + obj.width, y: y + obj.height / 2 },
      thickness: 1.5,
      color: rgb(c.r, c.g, c.b),
    });
  } else if (obj.subtype === 'stamp') {
    const stampText = obj.stampText || 'APPROVED';
    const stampC = hexToRgb(obj.stampColor || '#DC2626');
    page.drawRectangle({
      x: obj.x,
      y: y,
      width: obj.width,
      height: obj.height,
      borderColor: rgb(stampC.r, stampC.g, stampC.b),
      borderWidth: 2.5,
      color: rgb(stampC.r, stampC.g, stampC.b),
      opacity: 0.08,
    });
    const fontSize = Math.min(obj.height * 0.45, (obj.width / stampText.length) * 1.5);
    page.drawText(stampText, {
      x: obj.x + 8,
      y: y + (obj.height - fontSize) / 2 + 2,
      size: fontSize,
      font: fontBold,
      color: rgb(stampC.r, stampC.g, stampC.b),
    });
  } else if (obj.subtype === 'sticky-note') {
    // Draw sticky note icon badge
    page.drawRectangle({
      x: obj.x,
      y: y,
      width: 24,
      height: 24,
      color: rgb(0.98, 0.8, 0.2),
      borderColor: rgb(0.8, 0.6, 0.1),
      borderWidth: 1,
    });
  }
}

function renderRedactionObject(page: PDFPage, obj: RedactionObject, pageH: number, fontBold: any) {
  const c = hexToRgb(obj.overlayColor || '#000000');
  const y = pageH - obj.y - obj.height;

  // Draw 100% opaque solid rectangle that physically blocks and obscures underlying content
  page.drawRectangle({
    x: obj.x,
    y: y,
    width: obj.width,
    height: obj.height,
    color: rgb(c.r, c.g, c.b),
    opacity: 1.0,
  });

  if (obj.labelText) {
    const textC = c.r + c.g + c.b < 1.5 ? rgb(1, 1, 1) : rgb(0, 0, 0);
    const fontSize = Math.min(10, obj.height * 0.6);
    page.drawText(obj.labelText, {
      x: obj.x + 4,
      y: y + (obj.height - fontSize) / 2,
      size: fontSize,
      font: fontBold,
      color: textC,
    });
  }
}

export function downloadBlob(data: Uint8Array, filename: string, mimeType: string = 'application/pdf') {
  const blob = new Blob([data as unknown as BlobPart], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
