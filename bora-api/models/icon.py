# models/icon.py — Icon table (name, tags, embedding, r2 key)

import uuid
from sqlalchemy import Column, String, DateTime, ARRAY, Text
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
from models.database import Base


def _gen_id() -> str:
    return uuid.uuid4().hex[:12]


class Icon(Base):
    __tablename__ = "icons"

    id = Column(String, primary_key=True, default=_gen_id)
    name = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    tags = Column(ARRAY(String), default=[])
    category = Column(String, nullable=True, index=True)
    license = Column(String, nullable=True)
    source = Column(String, nullable=False, index=True)  # bioicons | servier | scidraw | reactome
    r2_key = Column(String, nullable=False)               # SVG file path in R2 / local
    svg_content = Column(Text, nullable=True)              # Inline SVG for local dev
    thumbnail_url = Column(String, nullable=True)
    embedding = Column(Vector(384))                        # 384d sentence-transformers vector
    created_at = Column(DateTime(timezone=True), server_default=func.now())
