"""
PDF Forge - Export, Merge, and Split Routes
"""
import os
import uuid
from flask import Blueprint, request, jsonify, send_file
from werkzeug.utils import secure_filename
from backend.config import Config
from backend.services.pdf_service import PDFService
from backend.utils.file_utils import get_doc_path

export_bp = Blueprint("export", __name__, url_prefix="/api/pdf")

@export_bp.route("/merge", methods=["POST"])
def merge_pdfs():
    data = request.get_json() or {}
    doc_ids = data.get("doc_ids", [])
    if len(doc_ids) < 2:
        return jsonify({"error": "At least 2 documents are required for merge"}), 400

    file_paths = []
    for d_id in doc_ids:
        p = get_doc_path(d_id)
        if not p.exists():
            return jsonify({"error": f"Document {d_id} not found"}), 404
        file_paths.append(str(p))

    merged_id = f"merged_{uuid.uuid4().hex[:8]}"
    out_path = os.path.join(Config.GENERATED_FOLDER, f"{merged_id}.pdf")

    try:
        PDFService.merge_documents(file_paths, out_path)
        info = PDFService.get_document_info(out_path)
        return jsonify({"doc_id": merged_id, "success": True, **info})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@export_bp.route("/<doc_id>/split", methods=["POST"])
def split_pdf(doc_id):
    path = get_doc_path(doc_id)
    if not path.exists():
        return jsonify({"error": "Document not found"}), 404
    data = request.get_json() or {}
    ranges = data.get("ranges", [])
    if not ranges:
        return jsonify({"error": "Page ranges are required, e.g. [[1, 2], [3, 5]]"}), 400

    try:
        parts = PDFService.split_document(str(path), ranges, Config.GENERATED_FOLDER)
        part_ids = [os.path.basename(p).replace(".pdf", "") for p in parts]
        return jsonify({"success": True, "part_ids": part_ids})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
