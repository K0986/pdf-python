"""
PDF Forge - Rendering Service
Renders high-DPI pages, thumbnail previews, and renders to PNG/JPEG bytes using PyMuPDF.
"""
import io
from typing import Optional

try:
    import fitz
except ImportError:
    fitz = None

class RenderingService:
    @staticmethod
    def render_page_to_bytes(doc_path: str, page_number: int, dpi: int = 150, format: str = "png") -> bytes:
        if not fitz:
            raise RuntimeError("PyMuPDF (fitz) is required for rendering.")
        doc = fitz.open(doc_path)
        try:
            page = doc[page_number - 1]
            zoom = dpi / 72.0
            matrix = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=matrix, alpha=False)
            img_bytes = pix.tobytes(format)
            return img_bytes
        finally:
            doc.close()

    @staticmethod
    def render_thumbnail(doc_path: str, page_number: int, width: int = 200) -> bytes:
        if not fitz:
            raise RuntimeError("PyMuPDF (fitz) is required for rendering.")
        doc = fitz.open(doc_path)
        try:
            page = doc[page_number - 1]
            rect = page.rect
            zoom = width / rect.width
            matrix = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=matrix, alpha=False)
            return pix.tobytes("jpeg")
        finally:
            doc.close()
