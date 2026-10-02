"""
PDF Forge - Editing Routes
Handles text detection, search, text insertion, and redaction.
"""
from flask import Blueprint, request, jsonify
from backend.services.text_service import TextService
from backend.services.image_service import ImageService
from backend.utils.file_utils import get_doc_path

editing_bp = Blueprint("editing", __name__, url_prefix="/api/pdf")

@editing_bp.route("/<doc_id>/page/<int:page_number>/text-spans", methods=["GET"])
def get_text_spans(doc_id, page_number):
    path = get_doc_path(doc_id)
    if not path.exists():
        return jsonify({"error": "Document not found"}), 404
    try:
        spans = TextService.extract_text_spans(str(path), page_number)
        return jsonify({"spans": spans})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@editing_bp.route("/<doc_id>/search", methods=["POST"])
def search_document(doc_id):
    path = get_doc_path(doc_id)
    if not path.exists():
        return jsonify({"error": "Document not found"}), 404
    data = request.get_json() or {}
    query = data.get("query", "")
    match_case = data.get("match_case", False)
    if not query:
        return jsonify({"results": []})

    try:
        results = TextService.search_text(str(path), query, match_case=match_case)
        return jsonify({"results": results, "count": len(results)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@editing_bp.route("/<doc_id>/redact", methods=["POST"])
def redact_areas(doc_id):
    path = get_doc_path(doc_id)
    if not path.exists():
        return jsonify({"error": "Document not found"}), 404
    data = request.get_json() or {}
    page_number = int(data.get("page_number", 1))
    rects = data.get("rects", [])
    label = data.get("label", "")
    fill_color = data.get("fill_color", [0, 0, 0])

    if not rects:
        return jsonify({"error": "No redaction rectangles provided"}), 400

    try:
        TextService.apply_true_redaction(str(path), page_number, rects, fill_color=fill_color, label=label, output_path=str(path))
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@editing_bp.route("/<doc_id>/page/<int:page_number>/insert-text", methods=["POST"])
def insert_text(doc_id, page_number):
    path = get_doc_path(doc_id)
    if not path.exists():
        return jsonify({"error": "Document not found"}), 404
    data = request.get_json() or {}
    text = data.get("text", "")
    x = float(data.get("x", 50))
    y = float(data.get("y", 50))
    font_size = float(data.get("font_size", 12))
    color = data.get("color", [0, 0, 0])

    try:
        TextService.insert_text(str(path), page_number, text, x, y, font_size=font_size, color=color, output_path=str(path))
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
