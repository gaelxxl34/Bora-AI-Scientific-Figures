# Bora API — AI Scientific Figures Backend

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from api.routes import ai
from api.routes import generate
from api.routes import auth

try:
    from api.routes import icons
    _has_icons = True
except Exception:
    _has_icons = False

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        from models.database import init_db
        await init_db()
    except Exception as e:
        logger.warning("Database init skipped (not available): %s", e)
    yield


app = FastAPI(
    title="Bora API",
    description="AI Scientific Figures — Backend API",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Route routers
if _has_icons:
    app.include_router(icons.router, prefix="/icons", tags=["icons"])
app.include_router(ai.router, prefix="/ai", tags=["ai"])
app.include_router(generate.router, prefix="/generate", tags=["generate"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])


@app.get("/")
async def root():
    return {"name": "Bora API", "version": "0.1.0", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "ok"}
