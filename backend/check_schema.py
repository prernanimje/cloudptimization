"""Check and display database schema"""
import sys
from pathlib import Path

# Ensure backend folder is on path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from sqlalchemy import inspect
from app.database import engine

def check_schema():
    inspector = inspect(engine)
    print(f"Connected to database: {engine.url.render_as_string(hide_password=True)}")
    tables = inspector.get_table_names()
    print(f"Found {len(tables)} tables: {', '.join(tables)}\n")
    
    for table_name in tables:
        print(f"Table: {table_name}")
        for col in inspector.get_columns(table_name):
            pk_str = " (PRIMARY KEY)" if col.get('primary_key') else ""
            print(f"  - {col['name']}: {col['type']}{pk_str}")
        print()

if __name__ == "__main__":
    check_schema()
