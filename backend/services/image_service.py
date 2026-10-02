"""
PDF Forge - Image Service
Handles inserting images (PNG, JPEG, WebP) into PDF pages, scaling, and positioning.
"""
from typing import List

try:
    import fitz
except ImportError:
    fitz = None

class ImageService:
    @staticmethod
    def insert_image(doc_path: str, page_number: int, image_path: str, bbox: List[float], output_path: str = ""):
        if not fitz:
            raise RuntimeError("PyMuPDF is required.")
        doc = fitz.open(doc_path)
        try:
            page = doc[page_number - 1]
            rect = fitz.Rect(bbox[0], bbox[1], bbox[2], bbox[3])
            page.insert_image(rect, filename=image_path)
            doc.save(output_path or doc_path)
        finally:
            doc.close()
