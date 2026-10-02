"""
PDF Forge - PDF Document Routes
Endpoints for upload, info, download, metadata, and security.
"""
import os
import uuid
from flask import Blueprint, request, jsonify, send_file
from werkzeug.utils import secure_filename
from backend.config import Config
from backend.services.pdf_service import PDFService
from backend.services.security_service import SecurityService
from backend.utils.file_utils import get_doc_path, is_allowed_file

pdf_bp = Blueprint("pdf", __name__, url_prefix="/api/pdf")

@pdf_bp.route("/upload", methods=["POST"])
def upload_pdf():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    file = request.files["file"]
    if file.filename == "" or not is_allowed_file(file.filename, {"pdf"}):
        return jsonify({"error": "Invalid PDF file"}), 400

    doc_id = uuid.uuid4().hex[:12]
    filename = f"{doc_id}.pdf"
    save_path = os.path.join(Config.UPLOAD_FOLDER, filename)
    file.save(save_path)

    try:
        info = PDFService.get_document_info(save_path)
        return jsonify({
            "doc_id": doc_id,
            "filename": secure_filename(file.filename),
            **info
        })
    except Exception as e:
        return jsonify({"error": f"Failed to parse PDF: {str(e)}"}), 500

@pdf_bp.route("/<doc_id>", methods=["GET"])
def get_pdf_info(doc_id):
    path = get_doc_path(doc_id)
    if not path.exists():
        return jsonify({"error": "Document not found"}), 404
    try:
        info = PDFService.get_document_info(str(path))
        return jsonify({"doc_id": doc_id, **info})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@pdf_bp.route("/<doc_id>/download", methods=["GET"])
def download_pdf(doc_id):
    path = get_doc_path(doc_id)
    if not path.exists():
        return jsonify({"error": "Document not found"}), 404
    return send_file(
        str(path),
        mimetype="application/pdf",
        as_attachment=True,
        download_name=f"{doc_id}.pdf"
    )

@pdf_bp.route("/<doc_id>/security", methods=["POST"])
def update_security(doc_id):
    path = get_doc_path(doc_id)
    if not path.exists():
        return jsonify({"error": "Document not found"}), 404
    data = request.get_json() or {}
    password = data.get("password")
    scrub = data.get("scrub_metadata", False)

    try:
        if scrub:
            SecurityService.scrub_metadata(str(path))
        if password:
            SecurityService.encrypt_document(str(path), user_pw=password)
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
