"""
PDF Forge - Flask Application Factory
Production-quality local backend for private, offline-first PDF manipulation.
"""
from flask import Flask, jsonify
from flask_cors import CORS
from backend.config import Config
from backend.routes.pdf import pdf_bp
from backend.routes.pages import pages_bp
from backend.routes.editing import editing_bp
from backend.routes.annotations import annotations_bp
from backend.routes.forms import forms_bp
from backend.routes.export import export_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS for local development (Vite frontend on port 3000 / 5173)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Register modular blueprints
    app.register_blueprint(pdf_bp)
    app.register_blueprint(pages_bp)
    app.register_blueprint(editing_bp)
    app.register_blueprint(annotations_bp)
    app.register_blueprint(forms_bp)
    app.register_blueprint(export_bp)

    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "healthy",
            "service": "PDF Forge Backend",
            "version": "1.0.0",
            "engine": "PyMuPDF (fitz)"
        })

    @app.errorhandler(413)
    def file_too_large(e):
        return jsonify({"error": "File size exceeds 100MB limit"}), 413

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"error": "Internal server error occurred processing PDF"}), 500

    return app

if __name__ == "__main__":
    app = create_app()
    print(f"🚀 PDF Forge backend running on http://{Config.HOST}:{Config.PORT}")
    app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)
