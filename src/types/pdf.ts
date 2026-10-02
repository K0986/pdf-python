/**
 * PDF Forge - Document and Editor Model Types
 */

export type ToolMode =
  | 'select'
  | 'hand'
  | 'text'
  | 'pen'
  | 'highlighter'
  | 'shape-rect'
  | 'shape-rounded-rect'
  | 'shape-circle'
  | 'shape-line'
  | 'shape-arrow'
  | 'image'
  | 'annotation-highlight'
  | 'annotation-underline'
  | 'annotation-strikeout'
  | 'sticky-note'
  | 'stamp'
  | 'redact'
  | 'form-text'
  | 'form-checkbox'
  | 'form-dropdown'
  | 'link';

export interface Point {
  x: number;
  y: number;
}

export interface BaseObject {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  locked?: boolean;
}

export interface TextObject extends BaseObject {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  underline: boolean;
  textAlign: 'left' | 'center' | 'right';
  color: string;
  backgroundColor?: string;
  opacity: number;
  lineHeight: number;
  letterSpacing: number;
  direction: 'ltr' | 'rtl' | 'auto';
  isEditedFromPdf?: boolean;
  originalMask?: { x: number; y: number; width: number; height: number };
}

export interface ImageObject extends BaseObject {
  type: 'image';
  src: string; // Base64 data URL
  name: string;
  opacity: number;
  keepAspectRatio: boolean;
  naturalWidth: number;
  naturalHeight: number;
  isDetectedFromPdf?: boolean;
  originalMask?: { x: number; y: number; width: number; height: number };
}

export interface ShapeObject extends BaseObject {
  type: 'shape';
  shapeType: 'rectangle' | 'rounded-rectangle' | 'circle' | 'line' | 'arrow' | 'freehand';
  points?: Point[];
  strokeColor: string;
  strokeWidth: number;
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  strokeOpacity: number;
  fillColor: string;
  fillOpacity: number;
}

export interface AnnotationObject extends BaseObject {
  type: 'annotation';
  subtype: 'highlight' | 'underline' | 'strikeout' | 'squiggly' | 'sticky-note' | 'stamp';
  color: string;
  opacity: number;
  noteText?: string;
  author?: string;
  timestamp?: string;
  stampText?: string;
  stampColor?: string;
}

export interface RedactionObject extends BaseObject {
  type: 'redaction';
  overlayColor: string;
  labelText?: string;
  applied: boolean;
}

export interface FormFieldObject extends BaseObject {
  type: 'form-field';
  fieldType: 'text' | 'checkbox' | 'radio' | 'dropdown';
  fieldName: string;
  value: string | boolean;
  options?: string[];
  required: boolean;
}

export interface LinkObject extends BaseObject {
  type: 'link';
  linkType: 'url' | 'page';
  targetUrl?: string;
  targetPage?: number;
}

export type EditorObject =
  | TextObject
  | ImageObject
  | ShapeObject
  | AnnotationObject
  | RedactionObject
  | FormFieldObject
  | LinkObject;

export interface PDFPageModel {
  id: string;
  pageNumber: number; // 1-based original index
  width: number;
  height: number;
  rotation: number; // 0, 90, 180, 270
  objects: EditorObject[];
}

export interface DocumentMetadata {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
  creationDate?: string;
  modDate?: string;
}

export interface PDFDocumentState {
  id: string;
  name: string;
  pageCount: number;
  pages: PDFPageModel[];
  originalPdfBytes: Uint8Array | null;
  metadata: DocumentMetadata;
  isEncrypted: boolean;
}

export interface ExtractedTextSpan {
  text: string;
  bbox: [number, number, number, number]; // [x0, y0, x1, y1]
  pageNumber: number;
  font?: string;
  size?: number;
}

export interface SearchResult {
  pageNumber: number;
  text: string;
  rect: [number, number, number, number];
  index: number;
}

export interface ExtractedImage {
  id: string;
  name: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pageNumber: number;
}
