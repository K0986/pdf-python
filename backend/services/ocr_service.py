"""
PDF Forge - OCR Service
Optional Optical Character Recognition pipeline for scanned documents using Tesseract / OCRmyPDF.
"""
from typing import Dict, Any

try:
    import fitz
    import pytesseract
    from PIL import Image
    import io
except ImportError:
    fitz = None
    pytesseract = None

class OCRService:
    @staticmethod
    def is_ocr_available() -> bool:
        if not pytesseract:
            return False
        try:
            pytesseract.get_tesseract_version()
            return True
        except Exception:
            return False

    @staticmethod
    def recognize_page_text(doc_path: str, page_number: int, lang: str = "eng") -> Dict[str, Any]:
        """Runs Tesseract on rendered page and returns extracted plain text and bounding boxes."""
        if not fitz:
            raise RuntimeError("PyMuPDF required for OCR page rendering.")
        if not pytesseract:
            raise RuntimeError("Tesseract/pytesseract is not configured in this environment.")
        
        doc = fitz.open(doc_path)
        try:
            page = doc[page_number - 1]
            pix = page.get_pixmap(dpi=300)
            img = Image.open(io.BytesIO(pix.tobytes("png")))
            text = pytesseract.image_to_string(img, lang=lang)
            data = pytesseract.image_to_data(img, lang=lang, output_type=pytesseract.Output.DICT)
            
            words = []
            for i in range(len(data['text'])):
                w = data['text'][i].strip()
                if w:
                    words.append({
                        "text": w,
                        "left": data['left'][i],
                        "top": data['top'][i],
                        "width": data['width'][i],
                        "height": data['height'][i],
                        "conf": data['conf'][i]
                    })
            return {
                "text": text,
                "words": words,
                "language": lang
            }
        finally:
            doc.close()
