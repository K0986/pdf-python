"""
PDF Forge - Security Service
Password encryption, permissions, and metadata scrubbing for privacy.
"""
from typing import Dict, Any

try:
    import fitz
except ImportError:
    fitz = None

class SecurityService:
    @staticmethod
    def encrypt_document(doc_path: str, user_pw: str, owner_pw: str = "", permissions: int = None, output_path: str = ""):
        if not fitz:
            raise RuntimeError("PyMuPDF is required.")
        doc = fitz.open(doc_path)
        try:
            # fitz.PDF_PERM_ACCESSIBILITY | fitz.PDF_PERM_PRINT
            perm = permissions if permissions is not None else (fitz.PDF_PERM_PRINT | fitz.PDF_PERM_COPY)
            doc.save(
                output_path or doc_path,
                encryption=fitz.PDF_ENCRYPT_AES_256,
                user_pw=user_pw,
                owner_pw=owner_pw or user_pw,
                permissions=perm
            )
        finally:
            doc.close()

    @staticmethod
    def scrub_metadata(doc_path: str, output_path: str = ""):
        """Completely sanitizes all metadata from the PDF for total privacy."""
        if not fitz:
            raise RuntimeError("PyMuPDF is required.")
        doc = fitz.open(doc_path)
        try:
            doc.set_metadata({
                "title": "",
                "author": "",
                "subject": "",
                "keywords": "",
                "creator": "",
                "producer": "",
                "creationDate": "",
                "modDate": ""
            })
            doc.save(output_path or doc_path)
        finally:
            doc.close()

    @staticmethod
    def update_metadata(doc_path: str, metadata: Dict[str, str], output_path: str = ""):
        if not fitz:
            raise RuntimeError("PyMuPDF is required.")
        doc = fitz.open(doc_path)
        try:
            doc.set_metadata(metadata)
            doc.save(output_path or doc_path)
        finally:
            doc.close()
