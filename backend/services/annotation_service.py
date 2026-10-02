"""
PDF Forge - Annotation Service
Supports highlight, underline, strikeout, sticky notes, ink drawings, and stamps.
"""
from typing import List, Dict, Any

try:
    import fitz
except ImportError:
    fitz = None

class AnnotationService:
    @staticmethod
    def add_highlight(doc_path: str, page_number: int, rect: List[float], color: List[float] = None, output_path: str = ""):
        if not fitz:
            raise RuntimeError("PyMuPDF is required.")
        doc = fitz.open(doc_path)
        color = color or [1.0, 1.0, 0.0]
        try:
            page = doc[page_number - 1]
            annot = page.add_highlight_annot(fitz.Rect(rect[0], rect[1], rect[2], rect[3]))
            annot.set_colors(stroke=color)
            annot.update()
            doc.save(output_path or doc_path)
        finally:
            doc.close()

    @staticmethod
    def add_sticky_note(doc_path: str, page_number: int, point: List[float], text: str, output_path: str = ""):
        if not fitz:
            raise RuntimeError("PyMuPDF is required.")
        doc = fitz.open(doc_path)
        try:
            page = doc[page_number - 1]
            annot = page.add_text_annot(fitz.Point(point[0], point[1]), text)
            annot.update()
            doc.save(output_path or doc_path)
        finally:
            doc.close()

    @staticmethod
    def add_stamp(doc_path: str, page_number: int, rect: List[float], stamp_text: str = "APPROVED", output_path: str = ""):
        if not fitz:
            raise RuntimeError("PyMuPDF is required.")
        doc = fitz.open(doc_path)
        try:
            page = doc[page_number - 1]
            target_rect = fitz.Rect(rect[0], rect[1], rect[2], rect[3])
            # Draw bordered stamp box with text
            page.draw_rect(target_rect, color=(0.85, 0.15, 0.15), width=2.5)
            font_size = min(target_rect.height * 0.45, target_rect.width / max(1, len(stamp_text)) * 1.5)
            center_x = target_rect.x0 + 10
            center_y = target_rect.y0 + target_rect.height * 0.65
            page.insert_text(fitz.Point(center_x, center_y), stamp_text, fontsize=font_size, color=(0.85, 0.15, 0.15))
            doc.save(output_path or doc_path)
        finally:
            doc.close()
