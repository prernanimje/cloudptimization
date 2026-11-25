"""FastAPI application entry point"""
import logging
import sys
from pathlib import Path

# Add backend directory to sys.path so 'app' package is always resolvable
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi import FastAPI, HTTPException  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from fastapi.middleware.trustedhost import TrustedHostMiddleware  # noqa: E402
from starlette.responses import JSONResponse  # noqa: E402

try:
    from app.database import init_db  # noqa: E402
    from app.config import APP_TITLE, APP_VERSION, FRONTEND_URL, DEBUG  # noqa: E402
    from app.routes import instances, upload, analysis, health, metrics, auth  # noqa: E402
except ImportError:
    from .database import init_db  # type: ignore  # noqa: E402
    from .config import APP_TITLE, APP_VERSION, FRONTEND_URL, DEBUG  # type: ignore  # noqa: E402
    from .routes import instances, upload, analysis, health, metrics, auth  # type: ignore  # noqa: E402

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=APP_TITLE,
    version=APP_VERSION,
    description="Cloud Cost Optimization Dashboard API"
)

# Parse allowed frontend origins from environment (supports comma-separated list)
configured_origins = [url.strip() for url in str(FRONTEND_URL).split(",") if url.strip()]
allowed_origins = list(set([
    *configured_origins,
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]))

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https?://.*(vercel\.app|netlify\.app|onrender\.com|railway\.app|localhost|127\.0\.0\.1).*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add security middleware
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["localhost", "127.0.0.1", "*"])


# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database on application startup"""
    logger.info("🚀 Starting Cloud Optimization Dashboard...")
    try:
        init_db()
        logger.info("✅ Database initialized successfully")

        # Start Real-Time Simulation Engine
        try:
            from app.services.simulation import simulation_engine
        except ImportError:
            from .services.simulation import simulation_engine  # type: ignore
        simulation_engine.start()
        logger.info("✅ Simulation Engine started")

    except Exception as e:
        logger.error(f"⚠️  Database initialization warning: {str(e)}")
        logger.info("Continuing without database. API will fail until database is available.")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on application shutdown"""
    logger.info("🛑 Shutting down application...")
    try:
        try:
            from app.services.simulation import simulation_engine
        except ImportError:
            from .services.simulation import simulation_engine  # type: ignore
        simulation_engine.stop()
    except Exception as e:
        logger.warning(f"Error stopping simulation engine: {e}")


# ============ ROUTES ============

# Health check endpoint
@app.get("/", tags=["Health"])
async def root():
    """Root endpoint - API is running"""
    return {
        "message": "Cloud Cost Optimization Dashboard API",
        "status": "running",
        "version": APP_VERSION,
        "docs": "/docs"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "api"}


# Include routers
app.include_router(instances.router, prefix="/api", tags=["Instances"])
app.include_router(upload.router, prefix="/api", tags=["Upload"])
app.include_router(analysis.router, prefix="/api", tags=["Analysis"])
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(metrics.router, prefix="/api", tags=["Metrics"])
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])


# ============ ERROR HANDLERS ============

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Handle HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "status": "error"}
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions"""
    logger.error(f"Unexpected error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "status": "error"}
    )


if __name__ == "__main__":
    import uvicorn
    app_target = "app.main:app" if Path("app").exists() else app
    uvicorn.run(app_target, host="0.0.0.0", port=8000, reload=DEBUG)
