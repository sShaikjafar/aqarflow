from pathlib import Path

# backend/uploads  (images are stored here for the MVP)
UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
