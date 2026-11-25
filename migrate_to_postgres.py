"""
SQLite to PostgreSQL Migration Script
Migrates all tables, schemas, and data from local SQLite database
(backend/cloud_optimization.db) to cloud PostgreSQL (Vercel Postgres, Neon, Supabase, Render).

Usage:
    python migrate_to_postgres.py "postgresql://user:password@host/dbname?sslmode=require"
"""
import sys
import os
from pathlib import Path
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

# Set up paths
backend_dir = Path(__file__).resolve().parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.models import Base, User, Instance, Metric, HealthAlert  # noqa: E402


def migrate(postgres_url: str):
    if not postgres_url:
        print("❌ Error: Please provide your PostgreSQL connection string!")
        print('Example: python migrate_to_postgres.py "postgresql://user:pass@ep-...neon.tech/neondb?sslmode=require"')
        sys.exit(1)

    if postgres_url.startswith("postgres://"):
        postgres_url = postgres_url.replace("postgres://", "postgresql://", 1)

    # 1. Connect to local SQLite
    sqlite_path = backend_dir / "cloud_optimization.db"
    if not sqlite_path.exists():
        sqlite_path = Path("cloud_optimization.db").resolve()

    if not sqlite_path.exists():
        print(f"❌ Error: SQLite database not found at {sqlite_path}")
        sys.exit(1)

    print(f"📁 Source SQLite: {sqlite_path}")
    print(f"☁️ Target PostgreSQL: {postgres_url.split('@')[-1] if '@' in postgres_url else 'PostgreSQL'}")

    sqlite_engine = create_engine(f"sqlite:///{sqlite_path.as_posix()}")
    pg_engine = create_engine(postgres_url)

    # 2. Initialize tables on PostgreSQL
    print("\n⏳ Step 1: Creating database tables on PostgreSQL...")
    Base.metadata.create_all(bind=pg_engine)
    print("✅ Tables created successfully.")

    SqliteSession = sessionmaker(bind=sqlite_engine)
    PgSession = sessionmaker(bind=pg_engine)

    src_session = SqliteSession()
    tgt_session = PgSession()

    try:
        # 3. Migrate Users
        users = src_session.query(User).all()
        print(f"\n⏳ Step 2: Migrating {len(users)} users...")
        for u in users:
            tgt_session.merge(User(
                id=u.id,
                email=u.email,
                username=u.username,
                hashed_password=u.hashed_password,
                is_active=u.is_active,
                created_at=u.created_at
            ))
        tgt_session.commit()
        print(f"✅ Migrated {len(users)} users.")

        # 4. Migrate Instances
        instances = src_session.query(Instance).all()
        print(f"\n⏳ Step 3: Migrating {len(instances)} instances...")
        for inst in instances:
            tgt_session.merge(Instance(
                id=inst.id,
                name=inst.name,
                cpu_usage=inst.cpu_usage,
                ram_usage=inst.ram_usage,
                storage_usage=inst.storage_usage,
                storage_capacity=inst.storage_capacity,
                uptime_hours=inst.uptime_hours,
                downtime_hours=inst.downtime_hours,
                region=inst.region,
                monthly_cost=inst.monthly_cost,
                status=inst.status,
                created_at=inst.created_at,
                updated_at=inst.updated_at,
                user_id=inst.user_id
            ))
        tgt_session.commit()
        print(f"✅ Migrated {len(instances)} instances.")

        # 5. Migrate Metrics
        metrics = src_session.query(Metric).all()
        print(f"\n⏳ Step 4: Migrating {len(metrics)} metric records...")
        for m in metrics:
            tgt_session.merge(Metric(
                id=m.id,
                instance_id=m.instance_id,
                cpu_usage=m.cpu_usage,
                ram_usage=m.ram_usage,
                storage_usage=m.storage_usage,
                timestamp=m.timestamp
            ))
        tgt_session.commit()
        print(f"✅ Migrated {len(metrics)} metrics.")

        # 6. Migrate Health Alerts
        alerts = src_session.query(HealthAlert).all()
        print(f"\n⏳ Step 5: Migrating {len(alerts)} health alerts...")
        for a in alerts:
            tgt_session.merge(HealthAlert(
                id=a.id,
                instance_id=a.instance_id,
                alert_type=a.alert_type,
                severity=a.severity,
                message=a.message,
                email_sent=a.email_sent,
                created_at=a.created_at,
                resolved_at=a.resolved_at
            ))
        tgt_session.commit()
        print(f"✅ Migrated {len(alerts)} health alerts.")

        print("\n🎉 All database data successfully migrated to Cloud PostgreSQL!")

    except Exception as e:
        tgt_session.rollback()
        print(f"\n❌ Migration failed: {e}")
        raise
    finally:
        src_session.close()
        tgt_session.close()


if __name__ == "__main__":
    target_url = sys.argv[1] if len(sys.argv) > 1 else os.getenv("DATABASE_URL", "")
    migrate(target_url)
