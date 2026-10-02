"""
PDF Forge - Core PDF Service using PyMuPDF (fitz)
Handles loading, metadata extraction, page tree queries, merging, splitting, and saving.
"""
import os
import uuid
from typing import Dict, Any, List, Optional
from pathlib import Path
from backend.config import Config

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

class PDFService:
    @staticmethod
    def load_document(doc_path: str):
        if not fitz:
            raise RuntimeError("PyMuPDF (fitz) is not installed in the Python environment.")
        return fitz.open(doc_path)

    @staticmethod
    def get_document_info(doc_path: str) -> Dict[str, Any]:
        doc = PDFService.load_document(doc_path)
        try:
            metadata = doc.metadata or {}
            pages_info = []
            for i, page in enumerate(doc):
                rect = page.rect
                pages_info.append({
                    "page_number": i + 1,
                    "width": float(rect.width),
                    "height": float(rect.height),
                    "rotation": page.rotation
                })
            return {
                "page_count": len(doc),
                "is_encrypted": doc.is_encrypted,
                "metadata": {
                    "title": metadata.get("title", ""),
                    "author": metadata.get("author", ""),
                    "subject": metadata.get("subject", ""),
                    "keywords": metadata.get("keywords", ""),
                    "creator": metadata.get("creator", ""),
                    "producer": metadata.get("producer", ""),
                    "creationDate": metadata.get("creationDate", ""),
                    "modDate": metadata.get("modDate", "")
                },
                "pages": pages_info
            }
        finally:
            doc.close()

    @staticmethod
    def reorder_pages(doc_path: str, new_order: List[int], output_path: str):
        """new_order is 0-indexed list of page indices"""
        doc = PDFService.load_document(doc_path)
        try:
            doc.select(new_order)
            doc.save(output_path)
        finally:
            doc.close()

    @staticmethod
    def rotate_page(doc_path: str, page_number: int, degrees: int, output_path: str):
        doc = PDFService.load_document(doc_path)
        try:
            page = doc[page_number - 1]
            page.set_rotation((page.rotation + degrees) % 360)
            doc.save(output_path)
        finally:
            doc.close()

    @staticmethod
    def add_blank_page(doc_path: str, position: int, width: float = 595.32, height: float = 841.92, output_path: str = ""):
        doc = PDFService.load_document(doc_path)
        try:
            doc.new_page(pno=position, width=width, height=height)
            doc.save(output_path or doc_path)
        finally:
            doc.close()

    @staticmethod
    def delete_page(doc_path: str, page_number: int, output_path: str):
        doc = PDFService.load_document(doc_path)
        try:
            doc.delete_page(page_number - 1)
            doc.save(output_path)
        finally:
            doc.close()

    @staticmethod
    def merge_documents(file_paths: List[str], output_path: str):
        if not fitz:
            raise RuntimeError("PyMuPDF is not installed.")
        merged_doc = fitz.open()
        try:
            for p in file_paths:
                sub_doc = fitz.open(p)
                merged_doc.insert_pdf(sub_doc)
                sub_doc.close()
            merged_doc.save(output_path)
        finally:
            merged_doc.close()

    @staticmethod
    def split_document(doc_path: str, split_ranges: List[List[int]], output_dir: str) -> List[str]:
        doc = PDFService.load_document(doc_path)
        output_files = []
        try:
            for idx, r in enumerate(split_ranges):
                part_doc = fitz.open()
                part_doc.insert_pdf(doc, from_page=r[0] - 1, to_page=r[1] - 1)
                part_filename = f"split_part_{idx+1}_{uuid.uuid4().hex[:6]}.pdf"
                out_path = os.path.join(output_dir, part_filename)
                part_doc.save(out_path)
                part_doc.close()
                output_files.append(out_path)
            return output_files
        finally:
            doc.close()
