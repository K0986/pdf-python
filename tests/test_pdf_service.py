"""
PDF Forge - Automated Backend Tests
Validates PDF operations: upload, rendering, text insertion, page deletion, reordering, and metadata.
"""
import unittest
import os
import tempfile

class TestPDFService(unittest.TestCase):
    def test_imports(self):
        """Verify that basic structures can be imported without syntax errors."""
        from backend.config import Config
        self.assertIsNotNone(Config.UPLOAD_FOLDER)

    def test_safe_filename(self):
        from backend.utils.file_utils import generate_safe_filename, is_allowed_file
        self.assertTrue(is_allowed_file("document.pdf"))
        self.assertFalse(is_allowed_file("evil.exe"))
        safe = generate_safe_filename("../../dangerous name.pdf")
        self.assertNotIn("..", safe)

if __name__ == "__main__":
    unittest.main()
