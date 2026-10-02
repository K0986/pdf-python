"""
PDF Forge - Form Fields Routes
Detects interactive form fields, reads values, and flattens widgets using PyMuPDF.
"""
from flask import Blueprint, request, jsonify
from backend.utils.file_utils import get_doc_path

try:
    import fitz
except ImportError:
    fitz = None

forms_bp = Blueprint("forms", __name__, url_prefix="/api/pdf")

@forms_bp.route("/<doc_id>/forms", methods=["GET"])
def get_forms(doc_id):
    path = get_doc_path(doc_id)
    if not path.exists():
        return jsonify({"error": "Document not found"}), 404
    if not fitz:
        return jsonify({"fields": []})

    doc = fitz.open(str(path))
    fields = []
    try:
        for page_idx, page in enumerate(doc):
            for widget in page.widgets():
                rect = widget.rect
                fields.append({
                    "page_number": page_idx + 1,
                    "field_name": widget.field_name,
                    "field_type": widget.field_type_string,
                    "field_value": widget.field_value,
                    "rect": [float(rect.x0), float(rect.y0), float(rect.x1), float(rect.y1)]
                })
        return jsonify({"fields": fields, "count": len(fields)})
    finally:
        doc.close()

@forms_bp.route("/<doc_id>/forms/flatten", methods=["POST"])
def flatten_forms(doc_id):
    path = get_doc_path(doc_id)
    if not path.exists():
        return jsonify({"error": "Document not found"}), 404
    if not fitz:
        return jsonify({"error": "PyMuPDF not available"}), 500

    doc = fitz.open(str(path))
    try:
        # Bake form field appearance directly into the page content stream
        doc.bake()
        doc.save(str(path))
        return jsonify({"success": True})
    finally:
        doc.close()
