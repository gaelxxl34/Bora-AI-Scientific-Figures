# Bora API — AI Scientific Figures Backend

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
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
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://172.237.145.217",
        "https://172.237.145.217",
        "https://bora-ai-scientific-figures.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
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


@app.get("/", response_class=HTMLResponse)
async def root():
    return """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Bora API</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
         background:#0f1117;color:#e2e8f0;display:flex;align-items:center;
         justify-content:center;min-height:100vh}
    .card{background:#1a1d2e;border:1px solid #2d3148;border-radius:16px;
          padding:48px;max-width:460px;width:90%;text-align:center}
    .logo{font-size:32px;font-weight:700;background:linear-gradient(135deg,#3b82f6,#8b5cf6);
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:8px}
    .subtitle{font-size:14px;color:#94a3b8;margin-bottom:32px}
    .status{display:inline-flex;align-items:center;gap:8px;background:#16a34a15;
            border:1px solid #16a34a40;border-radius:24px;padding:8px 20px;margin-bottom:24px}
    .dot{width:8px;height:8px;border-radius:50%;background:#16a34a;
         animation:pulse 2s ease-in-out infinite}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
    .status span{font-size:13px;font-weight:500;color:#4ade80}
    .info{font-size:12px;color:#64748b;line-height:1.8}
    .info a{color:#3b82f6;text-decoration:none}
    .info a:hover{text-decoration:underline}
    .version{margin-top:24px;font-size:11px;color:#475569}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Bora API</div>
    <p class="subtitle">AI Scientific Figures — Backend</p>
    <div class="status">
      <div class="dot"></div>
      <span>Running</span>
    </div>
    <div class="info">
      <p>Docs: <a href="/docs">/docs</a> &nbsp;|&nbsp; OpenAPI: <a href="/redoc">/redoc</a></p>
    </div>
    <p class="version">v0.1.0</p>
  </div>
</body>
</html>"""


@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}
