"""
PDF Forge - Page Management Routes
Handles thumbnails, high-res page render, page rotation, deletion, addition, and reordering.
"""
import io
from flask import Blueprint, request, jsonify, send_file, Response
from backend.services.pdf_service import PDFService
from backend.services.rendering_service import RenderingService
from backend.utils.file_utils import get_doc_path

pages_bp = Blueprint("pages", __name__, url_prefix="/api/pdf")

@pages_bp.route("/<doc_id>/page/<int:page_number>/render", methods=["GET"])
def render_page(doc_id, page_number):
    path = get_doc_path(doc_id)
    if not path.exists():
        return jsonify({"error": "Document not found"}), 404
    dpi = int(request.args.get("dpi", 150))
    fmt = request.args.get("format", "png").lower()

    try:
        img_bytes = RenderingService.render_page_to_bytes(str(path), page_number, dpi=dpi, format=fmt)
        return Response(img_bytes, mimetype=f"image/{fmt}")
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@pages_bp.route("/<doc_id>/page/<int:page_number>/thumbnail", methods=["GET"])
def render_thumbnail(doc_id, page_number):
    path = get_doc_path(doc_id)
    if not path.exists():
        return jsonify({"error": "Document not found"}), 404
    width = int(request.args.get("width", 200))

    try:
        img_bytes = RenderingService.render_thumbnail(str(path), page_number, width=width)
        return Response(img_bytes, mimetype="image/jpeg")
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@pages_bp.route("/<doc_id>/pages/reorder", methods=["POST"])
def reorder_pages(doc_id):
    path = get_doc_path(doc_id)
    if not path.exists():
        return jsonify({"error": "Document not found"}), 404
    data = request.get_json() or {}
    new_order = data.get("order", [])
    if not new_order:
        return jsonify({"error": "Order array is required"}), 400

    try:
        PDFService.reorder_pages(str(path), new_order, str(path))
        info = PDFService.get_document_info(str(path))
        return jsonify({"success": True, "info": info})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@pages_bp.route("/<doc_id>/page/<int:page_number>/rotate", methods=["POST"])
def rotate_page(doc_id, page_number):
    path = get_doc_path(doc_id)
    if not path.exists():
        return jsonify({"error": "Document not found"}), 404
    data = request.get_json() or {}
    degrees = int(data.get("degrees", 90))

    try:
        PDFService.rotate_page(str(path), page_number, degrees, str(path))
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@pages_bp.route("/<doc_id>/page/<int:page_number>", methods=["DELETE"])
def delete_page(doc_id, page_number):
    path = get_doc_path(doc_id)
    if not path.exists():
        return jsonify({"error": "Document not found"}), 404
    try:
        PDFService.delete_page(str(path), page_number, str(path))
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@pages_bp.route("/<doc_id>/page/blank", methods=["POST"])
def add_blank_page(doc_id):
    path = get_doc_path(doc_id)
    if not path.exists():
        return jsonify({"error": "Document not found"}), 404
    data = request.get_json() or {}
    position = int(data.get("position", -1))
    width = float(data.get("width", 595.32))
    height = float(data.get("height", 841.92))

    try:
        PDFService.add_blank_page(str(path), position, width, height, str(path))
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
