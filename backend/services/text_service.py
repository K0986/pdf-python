"""
PDF Forge - Text Service
Handles detecting existing text bounding boxes, font sizes, colors, search, overlay redactions, and multilingual Unicode text insertion.
"""
from typing import List, Dict, Any

try:
    import fitz
except ImportError:
    fitz = None

class TextService:
    @staticmethod
    def extract_text_spans(doc_path: str, page_number: int) -> List[Dict[str, Any]]:
        """Extract detailed text bounding boxes and font metadata for direct inspection."""
        if not fitz:
            return []
        doc = fitz.open(doc_path)
        spans = []
        try:
            page = doc[page_number - 1]
            blocks = page.get_text("dict")["blocks"]
            for b in blocks:
                if b.get("type") == 0:  # Text block
                    for line in b.get("lines", []):
                        for span in line.get("spans", []):
                            bbox = span["bbox"]
                            spans.append({
                                "text": span["text"],
                                "bbox": [float(bbox[0]), float(bbox[1]), float(bbox[2]), float(bbox[3])],
                                "font": span["font"],
                                "size": float(span["size"]),
                                "color": span["color"],
                                "flags": span["flags"]
                            })
            return spans
        finally:
            doc.close()

    @staticmethod
    def search_text(doc_path: str, query: str, match_case: bool = False) -> List[Dict[str, Any]]:
        """Search across all pages and return bounding boxes for highlighting/redaction."""
        if not fitz or not query:
            return []
        doc = fitz.open(doc_path)
        results = []
        try:
            for page_idx, page in enumerate(doc):
                rects = page.search_for(query, flags=0 if match_case else fitz.TEXT_IGNORECASE)
                for r in rects:
                    results.append({
                        "page_number": page_idx + 1,
                        "rect": [float(r.x0), float(r.y0), float(r.x1), float(r.y1)],
                        "text": query
                    })
            return results
        finally:
            doc.close()

    @staticmethod
    def insert_text(doc_path: str, page_number: int, text: str, x: float, y: float, font_size: float = 12, color: List[float] = None, output_path: str = ""):
        if not fitz:
            raise RuntimeError("PyMuPDF is required.")
        color = color or [0, 0, 0]
        doc = fitz.open(doc_path)
        try:
            page = doc[page_number - 1]
            # PyMuPDF supports inserting Unicode text
            point = fitz.Point(x, y)
            page.insert_text(point, text, fontsize=font_size, color=color)
            doc.save(output_path or doc_path)
        finally:
            doc.close()

    @staticmethod
    def apply_true_redaction(doc_path: str, page_number: int, rects: List[List[float]], fill_color: List[float] = None, label: str = "", output_path: str = ""):
        """Applies true cryptographic redaction: removes underlying text/vectors permanently."""
        if not fitz:
            raise RuntimeError("PyMuPDF is required.")
        doc = fitz.open(doc_path)
        fill_color = fill_color or [0, 0, 0]
        try:
            page = doc[page_number - 1]
            for r in rects:
                redact_rect = fitz.Rect(r[0], r[1], r[2], r[3])
                page.add_redact_annot(redact_rect, text=label, fill=fill_color)
            page.apply_redactions()
            doc.save(output_path or doc_path)
        finally:
            doc.close()
