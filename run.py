#!/usr/bin/env python3
"""
PDF Forge - One-Click Development Launcher
Launches the Flask PyMuPDF backend and serves the application.
"""
import sys
import os
import subprocess
import webbrowser

def check_dependencies():
    print("🔍 Checking PDF Forge environment...")
    try:
        import flask
        import fitz
        print("✅ Flask & PyMuPDF (fitz) verified.")
    except ImportError as e:
        print(f"⚠️  Missing dependency: {e.name}")
        print("💡 Run: pip install -r requirements.txt")
        return False
    return True

def main():
    print("=" * 60)
    print("   📄 PDF Forge — Local Full-Featured PDF Editor")
    print("=" * 60)
    print("Local, private, desktop-class PDF editing powered by PyMuPDF.")
    print("Your documents never leave your computer.")
    print("-" * 60)

    from backend.app import create_app
    from backend.config import Config

    app = create_app()
    url = f"http://{Config.HOST}:{Config.PORT}"
    print(f"🚀 Starting PDF Forge server at {url}")
    print("Press Ctrl+C to stop.")

    try:
        app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)
    except KeyboardInterrupt:
        print("\n🛑 PDF Forge stopped.")

if __name__ == "__main__":
    main()
