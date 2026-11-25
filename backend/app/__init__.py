"""App package"""

__all__ = ["app", "init_db", "get_db", "Instance", "Metric", "HealthAlert"]


def __getattr__(name):
    """Lazy import to prevent circular dependency when submodules import each other"""
    if name == "app":
        from .main import app
        return app
    if name in ("init_db", "get_db"):
        from . import database
        return getattr(database, name)
    if name in ("Instance", "Metric", "HealthAlert"):
        from . import models
        return getattr(models, name)
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
