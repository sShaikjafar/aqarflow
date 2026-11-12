from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.v1 import auth, properties
from app.core.database import get_db
from app.core.storage import UPLOAD_DIR

app = FastAPI(title="AqarFlow API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(properties.router, prefix="/api/v1")
app.mount("/media", StaticFiles(directory=UPLOAD_DIR), name="media")


@app.get("/api/v1/health")
def health():
    return {"status": "ok"}


@app.get("/api/v1/health/db")
def health_db(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"database": "connected"}
