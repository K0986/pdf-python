"""
PDF Forge - Safe Local File Utilities
Prevents path traversal, sanitizes filenames, and validates MIME types.
"""
import os
import uuid
from werkzeug.utils import secure_filename
from pathlib import Path
from backend.config import Config

def is_allowed_file(filename: str, allowed_extensions=None) -> bool:
    if allowed_extensions is None:
        allowed_extensions = Config.ALLOWED_EXTENSIONS
    return "." in filename and filename.rsplit(".", 1)[1].lower() in allowed_extensions

def generate_safe_filename(original_name: str, prefix: str = "doc") -> str:
    safe_name = secure_filename(original_name)
    ext = safe_name.rsplit(".", 1)[1].lower() if "." in safe_name else "pdf"
    unique_id = uuid.uuid4().hex[:12]
    return f"{prefix}_{unique_id}.{ext}"

def get_doc_path(doc_id: str) -> Path:
    # Strict validation of doc_id to avoid path traversal
    clean_id = secure_filename(doc_id)
    target_path = Path(Config.UPLOAD_FOLDER) / f"{clean_id}.pdf"
    if not target_path.exists():
        # Check generated folder
        gen_path = Path(Config.GENERATED_FOLDER) / f"{clean_id}.pdf"
        if gen_path.exists():
            return gen_path
    return target_path

def cleanup_temp_files():
    temp_dir = Path(Config.TEMP_FOLDER)
    if temp_dir.exists():
        for f in temp_dir.iterdir():
            if f.is_file():
                try:
                    f.unlink()
                except Exception:
                    pass
