"""
PDF Forge - Annotation Routes
Endpoints for adding highlights, sticky notes, and stamps.
"""
from flask import Blueprint, request, jsonify
from backend.services.annotation_service import AnnotationService
from backend.utils.file_utils import get_doc_path

annotations_bp = Blueprint("annotations", __name__, url_prefix="/api/pdf")

@annotations_bp.route("/<doc_id>/annotate/highlight", methods=["POST"])
def add_highlight(doc_id):
    path = get_doc_path(doc_id)
    if not path.exists():
        return jsonify({"error": "Document not found"}), 404
    data = request.get_json() or {}
    page_number = int(data.get("page_number", 1))
    rect = data.get("rect", [0, 0, 100, 20])
    color = data.get("color", [1.0, 1.0, 0.0])

    try:
        AnnotationService.add_highlight(str(path), page_number, rect, color=color, output_path=str(path))
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@annotations_bp.route("/<doc_id>/annotate/sticky-note", methods=["POST"])
def add_sticky_note(doc_id):
    path = get_doc_path(doc_id)
    if not path.exists():
        return jsonify({"error": "Document not found"}), 404
    data = request.get_json() or {}
    page_number = int(data.get("page_number", 1))
    point = data.get("point", [50, 50])
    text = data.get("text", "")

    try:
        AnnotationService.add_sticky_note(str(path), page_number, point, text, output_path=str(path))
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@annotations_bp.route("/<doc_id>/annotate/stamp", methods=["POST"])
def add_stamp(doc_id):
    path = get_doc_path(doc_id)
    if not path.exists():
        return jsonify({"error": "Document not found"}), 404
    data = request.get_json() or {}
    page_number = int(data.get("page_number", 1))
    rect = data.get("rect", [100, 100, 250, 150])
    stamp_text = data.get("stamp_text", "APPROVED")

    try:
        AnnotationService.add_stamp(str(path), page_number, rect, stamp_text=stamp_text, output_path=str(path))
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
