"""Configuration and environment variables"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Ensure we prioritize backend/.env
backend_dir = Path(__file__).resolve().parent.parent
backend_env = backend_dir / ".env"
if backend_env.exists():
    load_dotenv(backend_env, override=True)
else:
    load_dotenv()

# Database connection
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./cloud_optimization.db"
)

# If using SQLite relative path, anchor it to backend_dir so it resolves consistently
if DATABASE_URL.startswith("sqlite:///./") or DATABASE_URL.startswith("sqlite:////."):
    rel_db_name = DATABASE_URL.split("sqlite:///./")[-1]
    db_file_path = (backend_dir / rel_db_name).resolve()
    DATABASE_URL = f"sqlite:///{db_file_path.as_posix()}"

# API Keys
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "your-openai-api-key-here")
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY", "your-sendgrid-api-key-here")

# Email Configuration
EMAIL_FROM = os.getenv("EMAIL_FROM", "alerts@cloudoptimization.com")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@example.com")

# Frontend URL (for CORS)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Application Settings
DEBUG = os.getenv("DEBUG", "True") == "True"
APP_TITLE = "Real-Time Cloud Cost Simulation & Optimization Engine"
APP_VERSION = "1.0.0"

# Alert Thresholds
CPU_WARNING_THRESHOLD = 75  # %
CPU_CRITICAL_THRESHOLD = 90  # %
RAM_WARNING_THRESHOLD = 75  # %
RAM_CRITICAL_THRESHOLD = 90  # %
STORAGE_WARNING_THRESHOLD = 80  # %
STORAGE_CRITICAL_THRESHOLD = 95  # %

# Recommendation Thresholds
UNDERUTILIZED_CPU_THRESHOLD = 30  # % - instance using less than this
OVERPROVISIONED_RAM_THRESHOLD = 20  # % - instance using less than this
UNDERUTILIZED_STORAGE_THRESHOLD = 40  # % - instance using less than this
