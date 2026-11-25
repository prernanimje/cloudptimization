"""Vercel Serverless Function entry point for FastAPI (Root deployment)"""
import sys
from pathlib import Path

# Add project root and backend directory to sys.path
root_dir = Path(__file__).resolve().parent.parent
backend_dir = root_dir / "backend"

for path in [str(backend_dir), str(root_dir)]:
    if path not in sys.path:
        sys.path.insert(0, path)

try:
    from app.main import app  # noqa: E402
except ImportError:
    from backend.app.main import app  # noqa: E402

__all__ = ["app"]
