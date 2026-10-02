"""
PDF Forge - Configuration Module
Safe local file paths, size limits, and security configuration.
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
STORAGE_DIR = BASE_DIR / "storage"
UPLOAD_FOLDER = STORAGE_DIR / "uploads"
GENERATED_FOLDER = STORAGE_DIR / "generated"
TEMP_FOLDER = STORAGE_DIR / "temp"

# Ensure all local storage folders exist
for folder in [STORAGE_DIR, UPLOAD_FOLDER, GENERATED_FOLDER, TEMP_FOLDER]:
    folder.mkdir(parents=True, exist_ok=True)

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "pdf-forge-local-secret-key-12893812")
    MAX_CONTENT_LENGTH = 100 * 1024 * 1024  # 100MB limit for high-res documents
    ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "webp"}
    DEBUG = os.getenv("FLASK_DEBUG", "True").lower() in ("true", "1")
    PORT = int(os.getenv("PORT", "5000"))
    HOST = os.getenv("HOST", "127.0.0.1")
    UPLOAD_FOLDER = str(UPLOAD_FOLDER)
    GENERATED_FOLDER = str(GENERATED_FOLDER)
    TEMP_FOLDER = str(TEMP_FOLDER)
