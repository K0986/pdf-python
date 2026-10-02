# PDF Forge — Local Full-Featured PDF Editor

Production-quality local web-based PDF editor running privately on your computer. Your PDFs never leave your machine and are processed with full data integrity.

## Architecture

- **Frontend**: React 19, TypeScript, Tailwind CSS, PDF.js rendering canvas, and `pdf-lib` + `@pdf-lib/fontkit` for client-side cryptographic & physical PDF generation.
- **Backend**: Python 3.10+, Flask, PyMuPDF (fitz), pypdf, pdfplumber, Tesseract OCR.
- **Local Filesystem**: Sandboxed temp uploads, generated exports, no telemetry.

## Features

1. **PDF Viewing & Navigation**:
   - High-fidelity PDF rendering with lazy page virtualization
   - Visual page thumbnail sidebar with drag-and-drop reordering
   - Zoom controls (Fit Width, Fit Page, 50% - 200%), View rotation, Fullscreen
   - Document-wide text search with match counts and jumping
2. **Page Management**:
   - Add blank pages (Standard Letter, A4, Portrait/Landscape)
   - Duplicate page, delete page, rotate page (90° CW, 90° CCW, 180°)
   - Drag-and-drop page reordering
   - Split & merge PDFs, extract page ranges
3. **Multilingual Unicode Text Editing**:
   - Multilingual text insertion with Noto font families
   - Supports English, Arabic (RTL), Hebrew (RTL), Hindi (Devanagari), Gujarati, Bengali, Tamil, Telugu, Marathi, Kannada, Malayalam, Urdu, Chinese, Japanese, Korean, Cyrillic, Greek
   - Text styling: font size, bold, italic, underline, alignment, color, background highlight, opacity, line height, letter spacing, rotation
4. **Existing PDF Text Layer**:
   - Extract bounding boxes and detect font styles
   - Click to inspect or copy existing text
   - Controlled redaction & text replacement workflow
5. **Drawing & Shapes**:
   - Pen / Pencil freehand tool with smooth curves
   - Semi-transparent highlighter marker
   - Geometric vectors: Rectangle, Rounded Rectangle, Ellipse/Circle, Line, Arrow
   - Stroke width, stroke style, stroke color, fill color, and fill opacity
6. **Annotations & Stamps**:
   - Highlight, underline, strikethrough, squiggly line
   - Expandable sticky notes with author and timestamp
   - Preset PDF stamps (*APPROVED, CONFIDENTIAL, DRAFT, FINAL, VOID, SIGN HERE, REVIEWED*)
   - Custom stamp creator
7. **True Redaction**:
   - Interactive crosshair redaction selection
   - Preview with custom label (*[REDACTED]*, *EXEMPTION 4*)
   - Physical redaction that permanently masks underlying text and graphics
8. **PDF Forms**:
   - Detect and edit form fields (Text inputs, checkboxes, dropdowns)
   - Fill form values
   - Form flattening into permanent PDF page content
9. **Security & Metadata**:
   - View and edit document Title, Author, Subject, Keywords, Creator
   - Sanitize / scrub all metadata for privacy
   - Password encryption (AES-256)
10. **Undo / Redo & Shortcuts**:
    - Full history stack with Ctrl+Z / Ctrl+Shift+Z
    - Keyboard shortcuts: `Ctrl+O`, `Ctrl+S`, `Ctrl+F`, `Delete`, `Esc`, `+`, `-`

## Quick Start (Local Python Backend)

```bash
# 1. Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Launch PDF Forge
python run.py
```

The application will be accessible at: `http://localhost:5000`
