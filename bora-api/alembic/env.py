# alembic/env.py — Alembic migration environment

from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from alembic import context
import os

# Import Base so Alembic can detect models
# from models.database import Base
# target_metadata = Base.metadata
target_metadata = None  # TODO: Set to Base.metadata

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://localhost:5432/bora")


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    context.configure(
        url=DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    # TODO: Create engine and run migrations
    pass


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
